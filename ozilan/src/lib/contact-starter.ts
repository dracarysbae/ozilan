/** First message suggestions shaped by what each area needs to settle with the seller. */
export function contactStarter(cat: string): string {
  switch (cat) {
    case "alisveris": return "Merhaba, ürün hâlâ mevcut mu? İstediğim seçenek (renk, beden vb.): ";
    case "cicek-hediye": return "Merhaba, bu ürünü sipariş etmek istiyorum. Hazırlanıp teslim edilebilecek günü birlikte netleştirebilir miyiz?";
    case "hizmet": return "Merhaba, teklif almak istiyorum.\nİşin kapsamı: \nBölge / ilçe: \nUygun tarih: ";
    case "freelance": return "Merhaba, bir proje için görüşmek istiyorum.\nKapsam: \nBütçe aralığı: \nİstenen teslim tarihi: ";
    default: return "Merhaba, ilan hâlâ güncel mi?";
  }
}

/** Gift preferences travel inside the message; nothing is booked or promised. */
export function withGiftPreferences(body: string, date: string, note: string): string {
  const lines = [body.trim()];
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    lines.push(`Tercih ettiğim gün: ${d}.${m}.${y}`);
  }
  if (note.trim()) lines.push(`Kart notu: ${note.trim().slice(0, 160)}`);
  return lines.join("\n").slice(0, 2000);
}
