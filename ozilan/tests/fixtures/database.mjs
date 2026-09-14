import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
export async function testDatabase(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
    grant usage on schema public,auth,storage to anon,authenticated;
    grant select,insert,delete on storage.objects to authenticated;`);
  const migrations=new URL('../../../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(migrations)).filter(n=>n.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name,migrations),'utf8'));
  }
  return db;
}
