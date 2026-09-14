begin;

create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role'='admin',false)
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 2 and 80),
  kind text not null default 'bireysel' check(kind in ('bireysel','kurumsal')),
  city text not null default '', created_at timestamptz not null default now()
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,name,kind) values(new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Yeni üye'),80),
    case when new.raw_user_meta_data->>'kind'='kurumsal' then 'kurumsal' else 'bireysel' end);
  return new;
end $$;
create trigger on_member_created after insert on auth.users for each row execute function public.create_profile();

create table public.listings (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null default auth.uid() references public.profiles(id),
  title text not null check(char_length(trim(title)) between 10 and 90),
  description text not null check(char_length(trim(description)) between 40 and 8000),
  category text not null check(category in ('emlak','vasita','ikinci-el','alisveris','cicek-hediye','hizmet','freelance')),
  subcategory text not null check(char_length(subcategory) between 1 and 100),
  deal text not null check(char_length(deal) between 1 and 40),
  price numeric(14,2) not null check(price>=0 and price<=999999999999),
  city text not null check(char_length(city) between 2 and 80), district text not null check(char_length(district) between 1 and 80),
  attributes jsonb not null default '{}' check(jsonb_typeof(attributes)='object' and octet_length(attributes::text)<=16000),
  path text[] not null default '{}', path_labels text[] not null default '{}',
  photo_paths text[] not null default '{}' check(cardinality(photo_paths) between 1 and 6),
  status text not null default 'active' check(status in ('active','pending','removed')), blocked boolean not null default false,
  created_at timestamptz not null default now(), bumped_at timestamptz not null default now()
);
create index listings_active_recent on public.listings(bumped_at desc) where status='active';
create index listings_seller on public.listings(seller_id);
create index listings_category on public.listings(category,subcategory,status);

create function public.validate_listing() returns trigger language plpgsql security definer set search_path='' as $$
declare photo text;
begin
  if TG_OP='UPDATE' and (new.id<>old.id or new.seller_id<>old.seller_id or new.created_at<>old.created_at) then raise exception 'İlan sahipliği değiştirilemez.'; end if;
  if TG_OP='INSERT' then new.blocked=false;
  elsif public.is_admin() then new.blocked=(new.status='removed');
  elsif old.blocked then raise exception 'İlan yönetim tarafından kaldırılmış. Yeniden yayınlanamaz.';
  end if;
  if cardinality(new.path)>8 or cardinality(new.path_labels)>8 then raise exception 'Geçerli kategori seçilmeli.'; end if;
  foreach photo in array new.photo_paths loop
    if photo !~ ('^'||new.seller_id::text||'/[a-f0-9-]+\.webp$') then raise exception 'Fotoğraf bu hesaba ait olmalı.'; end if;
    if not exists(select 1 from storage.objects where bucket_id='listing-photos' and name=photo) then raise exception 'Fotoğraf yüklemesi bulunamadı.'; end if;
  end loop;
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
create trigger validate_listing before insert or update on public.listings for each row execute function public.validate_listing();

create table public.favorites (user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, listing_id uuid not null references public.listings(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,listing_id));
create table public.saved_searches (id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,label text not null check(char_length(label) between 1 and 200),href text not null check(href ~ '^/(arama|kesfet|vasita|akis)/[?]'),created_at timestamptz not null default now(),unique(user_id,href));
create table public.threads (
  id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),seller_id uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),check(buyer_id<>seller_id),unique(listing_id,buyer_id)
);
create index threads_buyer on public.threads(buyer_id,updated_at desc);
create index threads_seller on public.threads(seller_id,updated_at desc);
create table public.messages (
  id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.threads(id),
  sender_id uuid not null default auth.uid() references public.profiles(id),body text not null check(char_length(trim(body)) between 1 and 2000),created_at timestamptz not null default now()
);
create index messages_thread on public.messages(thread_id,created_at);
create index messages_sender on public.messages(sender_id,created_at);
create function public.start_thread(listing uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid; tid uuid;
begin
  if auth.uid() is null then raise exception 'Mesaj için giriş yapmalısın.'; end if;
  select seller_id into owner from public.listings where id=listing and status='active';
  if owner is null then raise exception 'İlan yayında değil.'; end if;
  if owner=auth.uid() then raise exception 'Kendi ilanına mesaj gönderemezsin.'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select id into tid from public.threads where listing_id=listing and buyer_id=auth.uid();
  if tid is not null then return tid; end if;
  if (select count(*) from public.threads where buyer_id=auth.uid() and updated_at>now()-interval '1 hour')>=30 then raise exception 'Görüşme sınırına ulaştın. Daha sonra tekrar dene.'; end if;
  insert into public.threads(listing_id,buyer_id,seller_id) values(listing,auth.uid(),owner) returning id into tid;
  return tid;
end $$;
create function public.message_time() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.sender_id::text));
  if (select count(*) from public.messages where sender_id=new.sender_id and created_at>now()-interval '1 minute')>=30 then raise exception 'Mesaj sınırına ulaştın. Bir dakika bekle.'; end if;
  new.created_at=now(); new.body=trim(new.body);
  update public.threads set updated_at=now() where id=new.thread_id;
  return new;
end $$;
create trigger message_time before insert on public.messages for each row execute function public.message_time();
create table public.reports (
  id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id),user_id uuid not null default auth.uid() references public.profiles(id),
  reason text not null check(char_length(reason) between 3 and 100),note text not null default '' check(char_length(note)<=2000),state text not null default 'open' check(state in ('open','resolved')),created_at timestamptz not null default now(),unique(listing_id,user_id)
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
create policy profiles_read on public.profiles for select using(true);
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy listings_read on public.listings for select using(status='active' or seller_id=auth.uid() or public.is_admin() or exists(select 1 from public.threads t where t.listing_id=listings.id and auth.uid() in(t.buyer_id,t.seller_id)));
create policy listings_create on public.listings for insert to authenticated with check(seller_id=auth.uid() and status='active');
create policy listings_edit on public.listings for update to authenticated using(seller_id=auth.uid() or public.is_admin()) with check(seller_id=auth.uid() or public.is_admin());
create policy favorites_own on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy searches_own on public.saved_searches for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy threads_participants on public.threads for select to authenticated using(auth.uid() in(buyer_id,seller_id));
create policy messages_read on public.messages for select to authenticated using(exists(select 1 from public.threads t where t.id=thread_id and auth.uid() in(t.buyer_id,t.seller_id)));
create policy messages_send on public.messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.threads t where t.id=thread_id and auth.uid() in(t.buyer_id,t.seller_id)));
create policy reports_read on public.reports for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy reports_create on public.reports for insert to authenticated with check(user_id=auth.uid() and state='open');
create policy reports_resolve on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());

revoke all on public.profiles,public.listings,public.favorites,public.saved_searches,public.threads,public.messages,public.reports from anon,authenticated;
grant select on public.profiles,public.listings to anon,authenticated;
grant update(name,kind,city) on public.profiles to authenticated;
grant insert on public.listings to authenticated;
grant update(title,description,category,subcategory,deal,price,city,district,attributes,path,path_labels,photo_paths,status,bumped_at) on public.listings to authenticated;
grant select,insert,delete on public.favorites,public.saved_searches to authenticated;
-- Anonymous listing reads evaluate the participant subquery too. RLS exposes
-- no thread rows to anon; this table grant only allows that policy evaluation.
grant select on public.threads to anon,authenticated;
grant select,insert on public.messages,public.reports to authenticated;
grant update(state) on public.reports to authenticated;
revoke all on function public.start_thread(uuid) from public,anon;
grant execute on function public.start_thread(uuid) to authenticated;
revoke all on function public.create_profile(),public.validate_listing(),public.message_time() from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('listing-photos','listing-photos',true,2097152,array['image/webp']);
create policy photo_upload on storage.objects for insert to authenticated with check(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy photo_owner_read on storage.objects for select to authenticated using(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy photo_cleanup on storage.objects for delete to authenticated using(bucket_id='listing-photos' and (storage.foldername(name))[1]=auth.uid()::text and not exists(select 1 from public.listings where name=any(photo_paths)));
commit;
