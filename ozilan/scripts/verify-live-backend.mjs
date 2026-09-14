// Read-only deployment smoke checks. No accounts, listings, or photos are created.
// Load public configuration with: node --env-file=.env.local scripts/verify-live-backend.mjs
import assert from 'node:assert/strict';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(url && key, 'Public Supabase URL and publishable key are required.');
assert(key.startsWith('sb_publishable_'), 'Use a publishable key, never a server secret.');
assert(new URL(url).protocol === 'https:', 'Live checks require HTTPS.');

async function check(label, path, allowedStatuses, expectEmpty = false) {
  const response = await fetch(`${url}${path}`, {
    headers: { apikey: key }, signal: AbortSignal.timeout(20000),
  });
  // Do not print API response bodies: they may contain records or diagnostics.
  const body = await response.text();
  assert(allowedStatuses.includes(response.status), `${label}: unexpected HTTP ${response.status}`);
  if (expectEmpty) assert.deepEqual(JSON.parse(body), [], `${label}: rows must be hidden`);
  console.log(`${label}: HTTP ${response.status}`);
}

await check('Public listing catalog', '/rest/v1/listings?select=id&limit=0', [200]);
await check('Public profile display', '/rest/v1/profiles?select=id&limit=0', [200]);
// Anonymous catalog RLS evaluates a threads subquery. SELECT is granted for
// that evaluation, while its authenticated-only row policy hides every row.
await check('Anonymous threads hidden by RLS', '/rest/v1/threads?select=id&limit=1', [200], true);
for (const table of ['messages', 'favorites', 'saved_searches', 'reports', 'media_assets']) {
  await check(`Anonymous access denied: ${table}`, `/rest/v1/${table}?select=*&limit=0`, [401, 403]);
}
await check('Media handler running; GET rejected', '/functions/v1/listing-media', [405]);
console.log('Read-only live smoke checks passed. OAuth and real uploads still require acceptance testing.');
