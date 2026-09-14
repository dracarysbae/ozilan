import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
export const backendConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const authMethod = process.env.NEXT_PUBLIC_AUTH_METHOD ?? "google";
export const emailSignInEnabled = authMethod === "email" || authMethod === "both";
export const googleSignInEnabled = !emailSignInEnabled || authMethod === "both";
export function backend(): SupabaseClient {
  if (!backendConfigured) throw new Error("Üyelik ve ortak ilan bağlantısı hazırlanıyor. Şu anda kayıt alınmıyor.");
  return client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}
export function authReturn(path = "/giris/") {
  return `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
export function publicPhoto(path: string) {
  return backendConfigured ? backend().storage.from("listing-photos").getPublicUrl(path).data.publicUrl : "";
}
export function friendlyError(error: unknown) {
  const msg = error instanceof Error ? error.message : String((error as {message?:string})?.message ?? "");
  if (/Invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/Email not confirmed/i.test(msg)) return "Girişten önce e-postandaki doğrulama bağlantısını açmalısın.";
  if (/provider.*not.*enabled|unsupported provider/i.test(msg)) return "Google ile giriş bağlantısı henüz açılmamış. Lütfen daha sonra tekrar dene.";
  if (/rate limit|too many|security purposes/i.test(msg)) return "Kısa sürede çok fazla işlem yapıldı. Biraz sonra tekrar dene.";
  if (/fetch|network|Failed to fetch/i.test(msg)) return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene; işlem henüz tamamlanmadı.";
  if (/row-level|permission denied|not authorized/i.test(msg)) return "Bu işlem için yetkin bulunmuyor. Hesabını ve ilan sahipliğini kontrol et.";
  if (/already registered|already been registered/i.test(msg)) return "Bu e-postayla bir hesap zaten var. Giriş yapabilir veya şifreni yenileyebilirsin.";
  if (/password/i.test(msg)) return "Şifren en az 8 karakter olmalı. Daha güçlü bir şifre seç.";
  if (/hazırlanıyor|giriş|İlan|fotoğraf|mesaj|Kendi|saniye|sınır|karakter|zorunlu|geçerli|olmalı|bulunamadı/i.test(msg)) return msg;
  return "İşlem tamamlanamadı. Bilgilerin korunuyor; lütfen tekrar dene.";
}
