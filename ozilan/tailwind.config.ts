import type { Config } from "tailwindcss";

/**
 * Görsel kimlik v5: "Gece Mavisi"
 * Lacivert → arduvaz grisi → azur mavisi tek bir merdivende.
 * Derinlik gölgeyle değil, katman ve ışıkla kurulur.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* lacivert merdiven — koyu bantlar ve metin */
        navy: {
          950: "#050A14",
          900: "#0A1220",
          800: "#0F1B2E",
          700: "#16253C",
          600: "#1E3350",
          500: "#2A4468",
          400: "#3D5B84",
        },
        /* eski adlar korunur (tüm bileşenler bunları kullanıyor) */
        ink: { DEFAULT: "#0E1729", 2: "#1A2740", 3: "#33415C", line: "#22314C" },
        paper: { DEFAULT: "#F7F9FC", 2: "#FFFFFF", 3: "#EDF2F9" },
        line: { DEFAULT: "#DCE4F0", strong: "#C0CCDF" },
        mute: { DEFAULT: "#5B6980", 2: "#8B99AF" },
        signal: { DEFAULT: "#2C6BF5", ink: "#1B4FD1", soft: "#E9F0FE", glow: "#5A8DFF" },
        gold: { DEFAULT: "#A9761F", ink: "#835A14", soft: "#FAF3E4" },
        moss: { DEFAULT: "#0E8A5F", soft: "#E4F4EE" },
        alert: { DEFAULT: "#CC4039", soft: "#FBEDEC" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["var(--font-sans)", "-apple-system", "sans-serif"],
        mono: ["var(--font-sans)", "-apple-system", "sans-serif"],
      },
      fontSize: { "2xs": ["0.75rem", { lineHeight: "1.1rem", letterSpacing: "0" }] },
      maxWidth: { shell: "1240px" },
      borderRadius: { sm: "10px", DEFAULT: "14px", md: "18px", lg: "22px", xl: "30px" },
      boxShadow: {
        /* mavi tonlu, katmanlı gölgeler — gri gölge kirli görünüyor */
        plaque: "0 1px 2px rgba(14,23,41,.04), 0 6px 20px -10px rgba(14,23,41,.12)",
        "plaque-sm": "0 1px 2px rgba(14,23,41,.05)",
        "plaque-blue": "0 10px 30px -12px rgba(44,107,245,.45)",
        pop: "0 2px 6px rgba(14,23,41,.05), 0 22px 50px -20px rgba(14,23,41,.28)",
        lift: "0 4px 10px rgba(14,23,41,.06), 0 30px 60px -24px rgba(20,40,80,.34)",
        inset: "inset 0 1px 0 rgba(255,255,255,.08)",
      },
      transitionDuration: { DEFAULT: "260ms" },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(.32,.72,0,1)",
        apple: "cubic-bezier(.32,.72,0,1)",
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "none" } },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%,-3%,0) scale(1.06)" },
        },
        sheen: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.32,.72,0,1) both",
        drift: "drift 22s ease-in-out infinite",
        sheen: "sheen 2.4s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
