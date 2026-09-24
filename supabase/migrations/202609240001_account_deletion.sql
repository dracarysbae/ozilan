begin;

-- Member-initiated account deletion.
--
-- Other members keep a readable conversation history, so threads survive.
-- The leaving member's identity, private lists, reports, listing content,
-- message text and sign-in (auth.users row) are erased. A tombstone profile
-- row stays because threads/messages/media reference it; it carries no
-- personal data and can never act again.

alter table public.profiles add column deleted_at timestamptz;

-- The tombstone must outlive auth.users, so the profile no longer cascades
-- from (or blocks deleting) the auth row.
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid='public.profiles'::regclass and contype='f' loop
    execute format('alter table public.profiles drop constraint %I',c);
  end loop;
end $$;

-- Erased listings keep no photos; every published listing still needs 1–6.
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid='public.listings'::regclass and contype='c'
    and pg_get_constraintdef(oid) like '%photo_paths%' loop
    execute format('alter table public.listings drop constraint %I',c);
  end loop;
end $$;
alter table public.listings add constraint listings_photo_count
  check(cardinality(photo_paths)<=6 and (cardinality(photo_paths)>=1 or status='removed'));

create function public.active_member() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and deleted_at is null)
$$;
revoke all on function public.active_member() from public;
grant execute on function public.active_member() to anon,authenticated;

-- A token issued before deletion stays cryptographically valid until it
-- expires; these checks stop it from writing through the tombstone.
drop policy listings_create on public.listings;
create policy listings_create on public.listings for insert to authenticated
  with check(seller_id=auth.uid() and status='active' and public.active_member());
drop policy listings_edit on public.listings;
create policy listings_edit on public.listings for update to authenticated
  using((seller_id=auth.uid() and public.active_member()) or public.is_admin())
  with check((seller_id=auth.uid() and public.active_member()) or public.is_admin());
drop policy messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
  with check(sender_id=auth.uid() and public.active_member()
    and exists(select 1 from public.threads t where t.id=thread_id and auth.uid() in(t.buyer_id,t.seller_id)));
drop policy reports_create on public.reports;
create policy reports_create on public.reports for insert to authenticated
  with check(user_id=auth.uid() and state='open' and public.active_member());
drop policy profiles_edit on public.profiles;
create policy profiles_edit on public.profiles for update to authenticated
  using(id=auth.uid() and deleted_at is null) with check(id=auth.uid() and deleted_at is null);

create or replace function public.start_thread(listing uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid; tid uuid;
begin
  if auth.uid() is null or not public.active_member() then raise exception 'Mesaj için giriş yapmalısın.'; end if;
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
revoke all on function public.start_thread(uuid) from public,anon;
grant execute on function public.start_thread(uuid) to authenticated;

-- Same business rules as before; the erasure transaction may scrub a listing
-- that an administrator had blocked.
create or replace function public.validate_listing() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if TG_OP='UPDATE' and (new.id<>old.id or new.seller_id<>old.seller_id or new.created_at<>old.created_at) then raise exception 'İlan sahipliği değiştirilemez.'; end if;
  if TG_OP='UPDATE' and current_setting('ozilan.erasing',true)='on' then return new; end if;
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
revoke all on function public.validate_listing() from public,anon,authenticated;

create function public.delete_my_account(confirmation text) returns void
language plpgsql security definer set search_path='' as $$
declare me uuid=auth.uid();
begin
  if me is null or not public.active_member() then raise exception 'Bu işlem için giriş yapmalısın.'; end if;
  if confirmation is distinct from 'HESABIMI SİL' then raise exception 'Onay metni eşleşmedi. Hesabın silinmedi.'; end if;
  perform pg_advisory_xact_lock(hashtext(me::text));
  perform set_config('ozilan.erasing','on',true);
  delete from public.favorites where user_id=me;
  delete from public.saved_searches where user_id=me;
  delete from public.reports where user_id=me;
  -- Listings nobody has discussed or reported disappear entirely.
  delete from public.listings l where l.seller_id=me
    and not exists(select 1 from public.threads t where t.listing_id=l.id)
    and not exists(select 1 from public.reports r where r.listing_id=l.id);
  -- The rest stay as empty, unpublished context for the other side.
  update public.listings set status='removed',title='Silinen hesaba ait ilan',
    description='Bu ilanın sahibi hesabını sildi. İlan kaldırıldı ve içeriği silindi.',
    attributes='{}',path='{}',path_labels='{}',photo_paths='{}',price=0,city='Bilinmiyor',district='—'
    where seller_id=me;
  update public.messages set body='Bu mesaj, hesabını silen üye tarafından kaldırıldı.' where sender_id=me;
  update public.profiles set name='Silinmiş üye',city='',kind='bireysel',deleted_at=now() where id=me;
  -- Unlinked photos fall to the hourly media cleanup like any orphan.
  delete from auth.users where id=me;
end $$;
revoke all on function public.delete_my_account(text) from public,anon;
grant execute on function public.delete_my_account(text) to authenticated;

commit;
