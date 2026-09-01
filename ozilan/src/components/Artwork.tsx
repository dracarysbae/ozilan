import React from "react";

const PALETTES: [string, string][] = [
  ["#F2F2F4", "#8A8A90"],
  ["#EEF1F6", "#7C8794"],
  ["#F3F1EE", "#8E8579"],
  ["#EDF1EF", "#7B8C83"],
  ["#F1F0F4", "#87848F"],
  ["#EFF2F5", "#7E8892"],
  ["#F4F1F0", "#8C8280"],
  ["#ECEFF3", "#79848F"],
]
/* silhouettes drawn on a 0..100 box, anchored bottom */
const GLYPH: Record<string, string[]> = {
  konut: [
    "M8 92V44l22-16 22 16v48z M30 92V66h14v26z",
    "M12 92V38h30v54z M46 92V54h30v38z M20 46h6v6h-6z M32 46h6v6h-6z M20 62h6v6h-6z M32 62h6v6h-6z M54 62h6v6h-6z M66 62h6v6h-6z",
    "M10 92V30l30-14 30 14v62z M28 92V62h24v30z",
  ],
  isyeri: [
    "M8 92V34h74v58z M16 44h14v14H16z M36 44h14v14H36z M56 44h14v14H56z M36 68h14v24H36z",
    "M22 92V16h46v76z M32 26h10v10H32z M48 26h10v10H48z M32 44h10v10H32z M48 44h10v10H48z M32 62h10v10H32z M48 62h10v10H48z M10 92h80",
    "M10 92V52l16-14h48l16 14v40z M10 52h80 M40 92V70h20v22z",
  ],
  arsa: ["M6 84l28-22 20 12 30-24v34z M6 84h84", "M10 88l18-30 16 18 14-24 22 36z", "M14 88V40h20v48z M40 88V26h20v62z M66 88V52h20v36z"],
  otomobil: [
    "M8 70c0-6 4-8 8-9l10-16c2-3 5-5 9-5h30c4 0 7 2 9 5l10 16c4 1 8 3 8 9v10H8z M22 80a7 7 0 1014 0 7 7 0 10-14 0 M64 80a7 7 0 1014 0 7 7 0 10-14 0 M30 45h32l7 12H23z",
    "M10 76V52c0-4 3-7 7-7l8-14c2-3 5-5 9-5h32c4 0 7 2 9 5l8 14c4 0 7 3 7 7v24z M22 80a7 7 0 1014 0 7 7 0 10-14 0 M64 80a7 7 0 1014 0 7 7 0 10-14 0 M28 32h44l6 13H22z M10 62h80",
    "M6 72c0-7 6-10 12-11l14-18h34l10 18c6 1 12 4 12 11v8H6z M20 82a8 8 0 1016 0 8 8 0 10-16 0 M62 82a8 8 0 1016 0 8 8 0 10-16 0 M36 47h26l6 12H28z",
  ],
  motosiklet: [
    "M12 76a12 12 0 1024 0 12 12 0 10-24 0 M64 76a12 12 0 1024 0 12 12 0 10-24 0 M24 76l14-24h22l14 24 M44 52l-6-12h14 M56 40h12",
    "M14 78a11 11 0 1022 0 11 11 0 10-22 0 M64 78a11 11 0 1022 0 11 11 0 10-22 0 M25 78c0-16 8-26 24-26h14 M40 52l6-16h16 M46 62h26l6 16",
  ],
  ticari: [
    "M6 74V36h48v38z M54 48h18l10 14v12H54z M16 78a7 7 0 1014 0 7 7 0 10-14 0 M60 78a7 7 0 1014 0 7 7 0 10-14 0",
    "M8 76V28h44v48z M52 44h20l14 18v14H52z M18 80a8 8 0 1016 0 8 8 0 10-16 0 M60 80a8 8 0 1016 0 8 8 0 10-16 0 M58 50h12l8 10H58z",
  ],
  elektronik: [
    "M26 20h38a6 6 0 016 6v52a6 6 0 01-6 6H26a6 6 0 01-6-6V26a6 6 0 016-6z M38 26h14 M34 76h22",
    "M18 30h64v36H18z M10 72h80l-6 8H16z M26 38h48v20H26z",
    "M14 26h72v42H14z M40 68h20v8H40z M28 80h44 M22 34h56v26H22z",
    "M20 40h60v34H20z M32 40V24h36v16 M44 56h12",
  ],
  "ev-yasam": [
    "M12 78V56c0-6 4-10 10-10h46c6 0 10 4 10 10v22 M12 62h66 M18 78v8 M72 78v8 M22 46V36c0-4 3-6 7-6h32c4 0 7 2 7 6v10",
    "M26 16h34a6 6 0 016 6v62a6 6 0 01-6 6H26a6 6 0 01-6-6V22a6 6 0 016-6z M20 46h46 M32 30v8 M32 56v8",
    "M50 20v34 M30 54h40l-8 30H38z M36 20h28l6 12H30z",
  ],
  "hobi-spor": [
    "M14 74a16 16 0 1032 0 16 16 0 10-32 0 M54 74a16 16 0 1032 0 16 16 0 10-32 0 M30 74l14-30h14 M44 44l10 30 M40 40h14",
    "M40 74a18 18 0 1036 0 18 18 0 10-36 0 M52 56L30 30 M24 20l10 4 4 10-8 4-10-4-4-10z",
    "M16 44v24 M24 36v40 M24 52h52 M76 36v40 M84 44v24",
    "M50 18v40 M34 58h32v14a16 16 0 01-32 0z M42 84h16",
  ],
  moda: [
    "M32 26l12 8 12-8 16 10-6 14-8-3v39H30V47l-8 3-6-14z",
    "M14 72c14-2 20-8 26-20l10 2c0 8 4 12 12 14l22 6v10H14z M40 54l4 8",
    "M50 30a22 22 0 100 44 22 22 0 100-44 M50 40v12l8 6 M36 18h28l-4 12H40z M40 74l-4 12h28l-4-12",
    "M26 40h48l6 46H20z M36 40V28a14 14 0 0128 0v12",
  ],
};

/* product-type specific silhouettes — picked over the sub-category default when present */
const TYPE_GLYPH: Record<string, string[]> = {
  "Telefon": ["M32 14h36a6 6 0 016 6v60a6 6 0 01-6 6H32a6 6 0 01-6-6V20a6 6 0 016-6z M42 20h16 M40 78h20"],
  "Dizüstü bilgisayar": ["M18 26h64v40H18z M8 70h84l-6 10H14z M28 34h44v22H28z"],
  "Masaüstü": ["M20 18h30v56H20z M56 30h34v30H56z M60 68h26v6H60z M28 28h14 M28 38h14"],
  "Tablet": ["M24 14h52a5 5 0 015 5v62a5 5 0 01-5 5H24a5 5 0 01-5-5V19a5 5 0 015-5z M42 78h16"],
  "Televizyon": ["M12 24h76v42H12z M40 70h20v8H40z M26 82h48 M20 32h60v26H20z"],
  "Kulaklık": ["M22 62V46a28 28 0 0156 0v16 M14 60h14v24H14z M72 60h14v24H72z"],
  "Fotoğraf makinesi": ["M14 32h20l6-10h20l6 10h20v46H14z M50 54a14 14 0 100 .1z M50 40a14 14 0 110 28 14 14 0 010-28z"],
  "Oyun konsolu": ["M24 40h52c8 0 14 8 14 18s-6 18-14 18c-8 0-10-8-16-8H40c-6 0-8 8-16 8-8 0-14-8-14-18s6-18 14-18z M28 52v14 M21 59h14 M66 54h.1 M74 62h.1"],
  "Ekran kartı": ["M10 34h68v32H10z M78 40h12v20H78z M22 70v12 M42 70v12 M62 70v12 M26 42h36v16H26z"],
  "Beyaz eşya": ["M26 12h34a6 6 0 016 6v62a6 6 0 01-6 6H26a6 6 0 01-6-6V18a6 6 0 016-6z M20 44h46 M32 26v8 M43 62a10 10 0 100 .1z"],
  "Koltuk takımı": ["M12 78V56c0-6 4-10 10-10h46c6 0 10 4 10 10v22 M12 62h66 M18 78v8 M72 78v8 M22 46V36c0-4 3-6 7-6h32c4 0 7 2 7 6v10"],
  "Yatak odası": ["M10 80V44h16v14h50V44h14v36 M10 66h80 M26 44V34h24v10"],
  "Yemek odası": ["M14 42h72 M24 42v40 M76 42v40 M34 52h6v30h-6 M60 52h6v30h-6"],
  "Halı": ["M12 28h76v56H12z M20 36h60v40H20z M28 44h44v24H28z"],
  "Aydınlatma": ["M50 10v18 M28 60l22-32 22 32z M40 60v10a10 10 0 0020 0V60 M50 80v10"],
  "Bisiklet": ["M14 74a16 16 0 1032 0 16 16 0 10-32 0 M54 74a16 16 0 1032 0 16 16 0 10-32 0 M30 74l14-30h14 M44 44l10 30 M40 40h14"],
  "Müzik aleti": ["M40 74a18 18 0 1036 0 18 18 0 10-36 0 M52 56L30 30 M24 20l10 4 4 10-8 4-10-4-4-10z"],
  "Fitness": ["M16 44v24 M24 36v40 M24 52h52 M76 36v40 M84 44v24"],
  "Kamp": ["M50 18L18 84h64z M50 44v40 M34 84h32"],
  "Saat": ["M50 30a22 22 0 100 44 22 22 0 100-44 M50 40v12l8 6 M36 18h28l-4 12H40z M40 74l-4 12h28l-4-12"],
  "Çanta": ["M26 40h48l6 46H20z M36 40V28a14 14 0 0128 0v12"],
  "Ayakkabı": ["M14 72c14-2 20-8 26-20l10 2c0 8 4 12 12 14l22 6v10H14z M40 54l4 8"],
  "Giyim": ["M32 26l12 8 12-8 16 10-6 14-8-3v39H30V47l-8 3-6-14z"],
  "Takı": ["M50 34l16 14-16 34-16-34z M34 48h32 M36 20h28l6 14H30z"],
  "Dükkan": ["M8 92V34h74v58z M16 44h14v14H16z M36 44h14v14H36z M56 44h14v14H56z M36 68h14v24H36z"],
  "Ofis": ["M22 92V16h46v76z M32 26h10v10H32z M48 26h10v10H48z M32 44h10v10H32z M48 44h10v10H48z M32 62h10v10H32z M48 62h10v10H48z M10 92h80"],
  "Depo": ["M10 92V52l16-14h48l16 14v40z M10 52h80 M40 92V70h20v22z"],
  "Panelvan": ["M6 74V36h48v38z M54 48h18l10 14v12H54z M16 78a7 7 0 1014 0 7 7 0 10-14 0 M60 78a7 7 0 1014 0 7 7 0 10-14 0"],
  "Kamyon": ["M8 76V28h44v48z M52 44h20l14 18v14H52z M18 80a8 8 0 1016 0 8 8 0 10-16 0 M60 80a8 8 0 1016 0 8 8 0 10-16 0"],
  "Otobüs": ["M10 78V22h72v56z M18 32h56v24H18z M20 82v6 M72 82v6 M22 66h.1 M74 66h.1"],
  "Minibüs": ["M8 74V38h58l16 16v20z M18 44h18v14H18z M42 44h18v14H42z M20 78a7 7 0 1014 0 7 7 0 10-14 0 M58 78a7 7 0 1014 0 7 7 0 10-14 0"],
};

export function Artwork({
  seed, sub, kind, className = "", label,
}: { seed: number; sub: string; kind?: string; className?: string; label?: string }) {
  const p = PALETTES[seed % PALETTES.length];
  const [bg, fg] = p;
  const glyphs = (kind ? TYPE_GLYPH[kind] : undefined) ?? GLYPH[sub] ?? GLYPH.elektronik;
  const d = glyphs[seed % glyphs.length];
  const rot = ((seed >> 3) % 3) - 1;
  const id = `a${seed}`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} role="img"
      aria-label={label ?? "ilan görseli"}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={bg} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#g${id})`} />
      <g transform={`translate(2 1) rotate(${rot} 50 58) scale(0.9)`} fill="none" stroke={fg}
        strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" opacity="0.85">
        <path d={d} />
      </g>
    </svg>
  );
}
