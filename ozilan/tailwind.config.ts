import type { Config } from "tailwindcss";

/**
 * Görsel kimlik v3: "Porselen"
 * Sadelik içinde imza: bol boşluk, kıl payı çizgiler, yumuşak derinlik.
 * Renk disiplini — tek vurgu kobalt, fiyat vurgusu safran; gerisi sessiz.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B0F1A", 2: "#151B2B", 3: "#232B40", line: "#2B3450" },
        paper: { DEFAULT: "#FAFAFC", 2: "#FFFFFF", 3: "#F0F2F7" },
        line: { DEFAULT: "#E5E8F0", strong: "#CBD2E0" },
        mute: { DEFAULT: "#5C6577", 2: "#99A1B3" },
        signal: { DEFAULT: "#1B44E5", ink: "#1233B8", soft: "#EDF1FF" },
        gold: { DEFAULT: "#E8A400", ink: "#8F6600", soft: "#FFF5DC" },
        moss: { DEFAULT: "#0B7A52", soft: "#E3F4EC" },
        alert: { DEFAULT: "#D3302B", soft: "#FCEAE9" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },
      borderRadius: { sm: "8px", DEFAULT: "10px", md: "12px", lg: "16px", xl: "22px" },
      boxShadow: {
        plaque: "0 1px 2px rgba(11,15,26,.04), 0 8px 28px -14px rgba(11,15,26,.14)",
        "plaque-sm": "0 1px 2px rgba(11,15,26,.05)",
        "plaque-blue": "0 12px 32px -14px rgba(27,68,229,.35)",
        pop: "0 2px 4px rgba(11,15,26,.05), 0 18px 44px -16px rgba(11,15,26,.22)",
      },
      transitionDuration: { DEFAULT: "160ms" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .4s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
import type { Config } from "tailwindcss";

/**
 * Görsel kimlik: "Emaye Tabela"
 * Türk çarşı esnafının emaye levhaları — kobalt mavi zemin, süt beyazı harf,
 * safran sarısı vurgu, kalın çerçeve ve levhanın altındaki sert gölge.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "ink" = derin lacivert gövde rengi
        ink: { DEFAULT: "#0C1830", 2: "#152442", 3: "#1E3157", line: "#2B4372" },
        // "paper" = soğuk porselen zemin
        paper: { DEFAULT: "#EDF0F5", 2: "#FFFFFF", 3: "#DDE3EC" },
        line: { DEFAULT: "#C6CFDD", strong: "#9CAABF" },
        mute: { DEFAULT: "#5B6880", 2: "#8E9AAE" },
        // sinyal = elektrik kobaltı
        signal: { DEFAULT: "#1B44E5", ink: "#0F2FAF", soft: "#DFE5FF" },
        // safran — fiyat ve fırsat vurgusu
        gold: { DEFAULT: "#E8A400", ink: "#9A6D00", soft: "#FFF1CE" },
        moss: { DEFAULT: "#0B7A52", soft: "#D6F0E4" },
        alert: { DEFAULT: "#D32F2B", soft: "#FDE3E1" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // "serif" adı kalıyor ama artık teşhir tipografisi: Bricolage Grotesque
        serif: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
      },
      borderRadius: { none: "0", sm: "3px", DEFAULT: "5px", md: "6px", lg: "8px", xl: "12px" },
      boxShadow: {
        // levha gölgesi: yumuşak değil, sert ve kaydırılmış
        plaque: "3px 3px 0 0 #0C1830",
        "plaque-sm": "2px 2px 0 0 #0C1830",
        "plaque-blue": "3px 3px 0 0 #1B44E5",
        pop: "6px 6px 0 0 #0C1830",
      },
      transitionDuration: { DEFAULT: "130ms" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        press: { "0%": { transform: "none" }, "100%": { transform: "translate(3px,3px)" } },
      },
      animation: { rise: "rise .26s cubic-bezier(.2,.8,.3,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
