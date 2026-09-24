import type { AttrDef } from "./taxonomy";

/**
 * Fields for the four marketplace areas that are published as regular
 * listings. They describe what the seller offers; none of them promises
 * stock, delivery or payment handled by the platform.
 */
export const MARKET_ATTRS: Record<string, AttrDef[]> = {
  alisveris: [
    { key: "durum", label: "Ürün durumu", type: "select", options: ["Sıfır", "Az kullanılmış", "Kullanılmış", "Yenilenmiş"], spotlight: true, required: true, comparable: true },
    { key: "marka", label: "Marka", type: "text", spotlight: true },
    { key: "varyant", label: "Seçenekler (renk, beden, kapasite)", type: "text", spotlight: true },
    { key: "faturali", label: "Faturalı", type: "bool" },
    { key: "garantili", label: "Garantili", type: "bool" },
  ],
  "cicek-hediye": [
    { key: "hazirlik", label: "Hazırlık süresi", type: "number", unit: "gün", spotlight: true, required: true },
    { key: "bolge", label: "Hazırlık / teslim bölgesi", type: "text", spotlight: true, required: true },
    { key: "kart_notu", label: "Kart notu eklenebilir", type: "bool" },
    { key: "kisiye_ozel", label: "Kişiye özel hazırlanır", type: "bool" },
  ],
  hizmet: [
    { key: "bolge", label: "Hizmet verilen bölge", type: "text", spotlight: true, required: true },
    { key: "ucret", label: "Ücretlendirme", type: "select", options: ["Sabit fiyat", "Saatlik", "Keşif sonrası teklif"], spotlight: true, required: true },
    { key: "deneyim", label: "Deneyim", type: "number", unit: "yıl", spotlight: true },
    { key: "yerinde_kesif", label: "Yerinde keşif yapılır", type: "bool" },
  ],
  freelance: [
    { key: "calisma", label: "Çalışma şekli", type: "select", options: ["Proje bazlı", "Saatlik", "Aylık"], spotlight: true, required: true },
    { key: "teslim", label: "Tahmini teslim süresi", type: "number", unit: "gün", spotlight: true, required: true },
    { key: "revizyon", label: "Revizyon hakkı", type: "number", unit: "tur" },
    { key: "portfoy", label: "Portföy bağlantısı", type: "text" },
  ],
};

