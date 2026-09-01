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
