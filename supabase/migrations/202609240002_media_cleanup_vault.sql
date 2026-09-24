begin;

-- The hourly cleanup job authenticates with a random token kept only in
-- Supabase Vault (name: media_cleanup_secret). The Edge Function asks the
-- database to compare it, so nobody copies the token into another dashboard.
create function public.media_cleanup_authorized(p_token text) returns boolean
language plpgsql security definer set search_path='' as $$
declare expected text;
begin
  if p_token is null or char_length(p_token)<32 then return false; end if;
  begin
    execute 'select decrypted_secret from vault.decrypted_secrets where name=$1 limit 1' into expected using 'media_cleanup_secret';
  exception when undefined_table or invalid_schema_name then return false;
  end;
  return expected is not null and char_length(expected)>=32 and expected=p_token;
end $$;
revoke all on function public.media_cleanup_authorized(text) from public,anon,authenticated;
grant execute on function public.media_cleanup_authorized(text) to service_role;

commit;
