"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {authReturn, backend, friendlyError} from "@/lib/backend";
import {safeReturnPath} from "@/lib/listing-data";
import {useStore} from "@/lib/store";

const RETURN_KEY = "ozilan.oauth-return";

/** Google verifies the account; the site does not need to send an email. */
export function GoogleAccess({next}: {next: string}) {
  const router = useRouter();
  const {me} = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    if (url.searchParams.has("error") || hash.has("error")) {
      setError("Google ile giriş tamamlanmadı. İstersen yeniden deneyebilirsin.");
      try { sessionStorage.removeItem(RETURN_KEY); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!me) return;
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
    } catch {}
    if (target) router.replace(safeReturnPath(target));
  }, [me, router]);

  async function signIn() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      try { sessionStorage.setItem(RETURN_KEY, safeReturnPath(next)); } catch {}
      const {error: failure} = await backend().auth.signInWithOAuth({
        provider: "google",
        options: {redirectTo: authReturn()},
      });
      if (failure) throw failure;
      // Supabase redirects this same tab. Its PKCE initialization exchanges
      // the return code; do not exchange it a second time in the component.
    } catch (failure) {
      try { sessionStorage.removeItem(RETURN_KEY); } catch {}
      setError(friendlyError(failure));
      setBusy(false);
    }
  }

  if (me) return null;
  return <div className="google-access">
    <button type="button" disabled={busy} onClick={() => void signIn()}>
      {busy ? "Google’a yönlendiriliyorsun…" : "Google ile devam et"}
      <span aria-hidden="true">↗</span>
    </button>
    <p>İlk girişte hesabın oluşur. Sonraki ziyaretlerinde aynı Google hesabınla kaldığın yerden devam edersin.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
