-- Hourly orphan-photo cleanup for the live OzBirArada project.
-- Run once in the Supabase SQL Editor AFTER migration
-- 202609240002_media_cleanup_vault.sql and after deploying the listing-media
-- function version that contains media_cleanup_authorized.
--
-- The token is generated inside the database and never shown, logged or
-- copied: Vault stores it, pg_cron reads it for the Authorization header and
-- the Edge Function asks PostgreSQL to compare it. Both extensions are part of
-- the free plan; no paid add-on is enabled.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin
  if not exists(select 1 from vault.secrets where name='media_cleanup_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'media_cleanup_secret','Bearer token for the hourly listing-media cleanup job');
  end if;
end $$;

select cron.unschedule(jobid) from cron.job where jobname='listing-media-cleanup';
select cron.schedule('listing-media-cleanup','17 * * * *',$job$
  select net.http_post(
    url:='https://iaaajytulwtholkolbmd.supabase.co/functions/v1/listing-media?cleanup=1',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='media_cleanup_secret' limit 1)),
    body:='{}'::jsonb,
    timeout_milliseconds:=90000)
$job$);

-- Check: select jobname,schedule,active from cron.job;
-- Last runs: select status,return_message,start_time from cron.job_run_details order by start_time desc limit 5;
-- HTTP answers: select status_code,content from net._http_response order by created desc limit 5;
