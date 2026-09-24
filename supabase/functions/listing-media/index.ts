import {createMediaHandler} from './handler.ts';

Deno.serve(createMediaHandler({
  supabaseUrl:Deno.env.get('SUPABASE_URL')??'',
  serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'',
  cloudName:Deno.env.get('CLOUDINARY_CLOUD_NAME')??'',
  apiKey:Deno.env.get('CLOUDINARY_API_KEY')??'',
  apiSecret:Deno.env.get('CLOUDINARY_API_SECRET')??'',
  origins:(Deno.env.get('MEDIA_ALLOWED_ORIGINS')??'').split(',').map(s=>s.trim()).filter(Boolean),
  // Optional: without it the Vault token checked by media_cleanup_authorized is used.
  cleanupSecret:Deno.env.get('MEDIA_CLEANUP_SECRET')||undefined,
}));
