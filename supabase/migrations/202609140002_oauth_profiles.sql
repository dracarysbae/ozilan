begin;

-- OAuth providers can supply full_name instead of name, or a one-letter name.
-- These are display labels only; no user metadata is used for privileges.
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare display_name text;
begin
  display_name=coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),
                        nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Yeni üye');
  if char_length(display_name)<2 then display_name='Yeni üye'; end if;
  insert into public.profiles(id,name,kind) values(new.id,left(display_name,80),
    case when new.raw_user_meta_data->>'kind'='kurumsal' then 'kurumsal' else 'bireysel' end);
  return new;
end $$;

revoke all on function public.create_profile() from public,anon,authenticated;
commit;
