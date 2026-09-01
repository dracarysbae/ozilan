import type { Config } from "tailwindcss";

/**
 * Görsel kimlik v4: "Sade"
 * Tek yazı ailesi, neredeyse tek renk, kıl payı çizgi, çok boşluk.
 * Vurgu sayılarda ve tek bir mavide; geri kalan her şey sessiz.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1D1D1F", 2: "#2C2C2E", 3: "#48484A", line: "#3A3A3C" },
        paper: { DEFAULT: "#FFFFFF", 2: "#FFFFFF", 3: "#F5F5F7" },
        line: { DEFAULT: "#E8E8ED", strong: "#D2D2D7" },
        mute: { DEFAULT: "#6E6E73", 2: "#8E8E93" },
        signal: { DEFAULT: "#0066CC", ink: "#0055B3", soft: "#EAF2FC" },
        gold: { DEFAULT: "#B25E00", ink: "#8A4900", soft: "#FBF1E6" },
        moss: { DEFAULT: "#1D7A4C", soft: "#E8F4ED" },
        alert: { DEFAULT: "#C2352F", soft: "#FBECEB" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["var(--font-sans)", "-apple-system", "sans-serif"],
        mono: ["var(--font-sans)", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.1rem", letterSpacing: "0" }],
      },
      maxWidth: { shell: "1180px" },
      borderRadius: { sm: "10px", DEFAULT: "14px", md: "16px", lg: "20px", xl: "28px" },
      boxShadow: {
        plaque: "0 0 0 0.5px rgba(0,0,0,.04), 0 2px 8px -4px rgba(0,0,0,.06)",
        "plaque-sm": "0 1px 2px rgba(0,0,0,.04)",
        "plaque-blue": "0 8px 24px -12px rgba(0,102,204,.4)",
        pop: "0 0 0 0.5px rgba(0,0,0,.05), 0 12px 32px -12px rgba(0,0,0,.14)",
      },
      transitionDuration: { DEFAULT: "220ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(.32,.72,0,1)" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .45s cubic-bezier(.32,.72,0,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
