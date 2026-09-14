begin;

-- Only the authenticated Edge Function can reserve or confirm provider assets.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  path text not null unique,
  public_id text not null unique,
  bytes integer not null check(bytes between 1 and 524288),
  state text not null default 'pending' check(state in ('pending','ready','deleting','deleted')),
  created_at timestamptz not null default now(),
  touched_at timestamptz not null default now()
);
create index media_owner_recent on public.media_assets(owner_id,created_at);
create index media_cleanup on public.media_assets(touched_at) where state<>'deleted';
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public,anon,authenticated;

create function public.reserve_media_upload(p_owner uuid,p_bytes integer)
returns public.media_assets language plpgsql security definer set search_path='' as $$
declare item public.media_assets; asset uuid=gen_random_uuid();
begin
  if p_owner is null or p_bytes is null or p_bytes not between 1 and 524288 then raise exception 'Geçerli fotoğraf zorunlu.'; end if;
  perform pg_advisory_xact_lock(4173524);
  if (select count(*) from public.media_assets where owner_id=p_owner and created_at>now()-interval '1 hour')>=30
    or (select count(*) from public.media_assets where owner_id=p_owner and created_at>now()-interval '1 day')>=120 then
    raise exception 'Fotoğraf yükleme sınırına ulaştın. Daha sonra tekrar dene.';
  end if;
  -- Count failed/deleted attempts too: proxy traffic is still consumed.
  if (select coalesce(sum(bytes),0) from public.media_assets where created_at>now()-interval '30 days')+p_bytes>3000000000 then
    raise exception 'Aylık fotoğraf yükleme kotası doldu. Mevcut ilanların korunuyor.';
  end if;
  if (select coalesce(sum(bytes),0) from public.media_assets where state<>'deleted')+p_bytes>10000000000 then
    raise exception 'Fotoğraf depolama kotası doldu. Mevcut ilanların korunuyor.';
  end if;
  insert into public.media_assets(id,owner_id,path,public_id,bytes)
    values(asset,p_owner,'cloudinary/'||p_owner||'/'||asset||'.webp','ozilan/'||p_owner||'/'||asset,p_bytes)
    returning * into item;
  return item;
end $$;

create function public.complete_media_upload(p_id uuid,p_owner uuid,p_bytes integer)
returns text language plpgsql security definer set search_path='' as $$
declare item public.media_assets;
begin
  select * into item from public.media_assets where id=p_id and owner_id=p_owner for update;
  if item.id is null or item.state<>'pending' or p_bytes is distinct from item.bytes then raise exception 'Fotoğraf yüklemesi doğrulanamadı.'; end if;
  update public.media_assets set state='ready',touched_at=now() where id=p_id;
  return item.path;
end $$;

create function public.claim_media_delete(p_owner uuid,p_path text)
returns text language plpgsql security definer set search_path='' as $$
declare item public.media_assets;
begin
  select * into item from public.media_assets where owner_id=p_owner and path=p_path for update;
  if item.id is null or item.state='deleted' then return null; end if;
  if item.state='pending' and item.created_at>now()-interval '10 minutes' then return null; end if;
  if exists(select 1 from public.listings where item.path=any(photo_paths)) then return null; end if;
  update public.media_assets set state='deleting',touched_at=now() where id=item.id;
  return item.public_id;
end $$;

create function public.finish_media_delete(p_owner uuid,p_path text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.media_assets set state='deleted',touched_at=now()
    where owner_id=p_owner and path=p_path and state='deleting';
end $$;

create function public.stale_media_assets(p_owner uuid default null)
returns table(owner_id uuid,path text) language sql security definer set search_path='' as $$
  select a.owner_id,a.path from public.media_assets a
  where (p_owner is null or a.owner_id=p_owner) and a.state<>'deleted'
    and ((a.state='deleting' and a.touched_at<now()-interval '15 minutes')
      or (a.state in ('pending','ready') and a.touched_at<now()-interval '24 hours'))
    and not exists(select 1 from public.listings l where a.path=any(l.photo_paths))
  order by a.touched_at limit 50
$$;

-- Lock each photo while publishing so deletion cannot race a new reference.
create function public.validate_cloudinary_photos() returns trigger language plpgsql security definer set search_path='' as $$
declare photo text; item public.media_assets;
begin
  for photo in select distinct unnest(new.photo_paths) order by 1 loop
    if photo like 'cloudinary/%' then
      select * into item from public.media_assets where path=photo for update;
      if item.id is null or item.owner_id<>new.seller_id or item.state<>'ready' then
        raise exception 'Fotoğraf bu hesaba ait, tamamlanmış bir yükleme olmalı.';
      end if;
    elsif photo !~ ('^'||new.seller_id::text||'/[a-f0-9-]+\.webp$')
      or not exists(select 1 from storage.objects where bucket_id='listing-photos' and name=photo) then
      raise exception 'Fotoğraf yüklemesi bulunamadı.';
    end if;
  end loop;
  return new;
end $$;

-- Keep the existing business checks; photo verification now supports both providers.
create or replace function public.validate_listing() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='UPDATE' and (new.id<>old.id or new.seller_id<>old.seller_id or new.created_at<>old.created_at) then raise exception 'İlan sahipliği değiştirilemez.'; end if;
  if TG_OP='INSERT' then new.blocked=false;
  elsif public.is_admin() then new.blocked=(new.status='removed');
  elsif old.blocked then raise exception 'İlan yönetim tarafından kaldırılmış. Yeniden yayınlanamaz.';
  end if;
  if cardinality(new.path)>8 or cardinality(new.path_labels)>8 then raise exception 'Geçerli kategori seçilmeli.'; end if;
  if TG_OP='INSERT' then
    perform pg_advisory_xact_lock(hashtext(new.seller_id::text));
    if (select count(*) from public.listings where seller_id=new.seller_id and created_at>now()-interval '1 day')>=20 then raise exception 'Günlük ilan sınırına ulaştın.'; end if;
    new.created_at=now(); new.bumped_at=now();
  elsif new.bumped_at<>old.bumped_at then
    if old.bumped_at>now()-interval '1 day' then raise exception 'İlanını 24 saatte bir güncelleyebilirsin.'; end if;
    new.bumped_at=now();
  end if;
  return new;
end $$;
create trigger validate_photos before insert or update on public.listings for each row execute function public.validate_cloudinary_photos();

revoke all on function public.reserve_media_upload(uuid,integer),public.complete_media_upload(uuid,uuid,integer),public.claim_media_delete(uuid,text),public.finish_media_delete(uuid,text),public.stale_media_assets(uuid),public.validate_cloudinary_photos() from public,anon,authenticated;
grant execute on function public.reserve_media_upload(uuid,integer),public.complete_media_upload(uuid,uuid,integer),public.claim_media_delete(uuid,text),public.finish_media_delete(uuid,text),public.stale_media_assets(uuid) to service_role;

-- Legacy photos remain readable; new uploads must go through admission limits.
drop policy photo_upload on storage.objects;

commit;
