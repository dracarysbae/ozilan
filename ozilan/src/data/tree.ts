/* ══════════════════════════════════════════════════════════════════
   Çok kademeli kategori ağacı.
   Veri, okunması ve bakımı kolay olsun diye girintili bir metin
   biçiminde yazılır; açılışta bir kez ağaca çevrilir.

     Marka
       Seri: paket, paket, paket
       Seri2: paket

   Girintisiz satır = üst düğüm, girintili satır = alt düğüm.
   "Seri: a, b, c" biçimi üçüncü kademeyi (paket) doğurur.
   ══════════════════════════════════════════════════════════════════ */

export type Node = {
  slug: string;
  label: string;
  kids?: Node[];
};

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o",
  ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", é: "e", É: "e",
};

export function slugify(s: string): string {
  return s
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Aynı seviyede yinelenen slug'lara sayı ekler. */
function uniq(nodes: Node[]) {
  const seen = new Map<string, number>();
  for (const n of nodes) {
    const c = seen.get(n.slug) ?? 0;
    seen.set(n.slug, c + 1);
    if (c > 0) n.slug = `${n.slug}-${c + 1}`;
  }
  return nodes;
}

export function parseTree(src: string): Node[] {
  const roots: Node[] = [];
  let current: Node | null = null;

  for (const raw of src.split("\n")) {
    if (!raw.trim()) continue;
    const indented = /^\s/.test(raw);
    const line = raw.trim();

    if (!indented) {
      current = { slug: slugify(line), label: line };
      roots.push(current);
      continue;
    }
    if (!current) continue;

    const i = line.indexOf(":");
    const name = i === -1 ? line : line.slice(0, i).trim();
    const rest = i === -1 ? "" : line.slice(i + 1).trim();
    const node: Node = { slug: slugify(name), label: name };
    if (rest) {
      node.kids = uniq(
        rest
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => ({ slug: slugify(t), label: t })),
      );
    }
    current.kids = current.kids ?? [];
    current.kids.push(node);
    uniq(current.kids);
  }
  return uniq(roots);
}

/* ---------------------------------------------------------- gezinme */

export function childrenOf(nodes: Node[], path: string[]): Node[] {
  let level = nodes;
  for (const p of path) {
    const hit = level.find((n) => n.slug === p);
    if (!hit || !hit.kids) return [];
    level = hit.kids;
  }
  return level;
}

export function labelPath(nodes: Node[], path: string[]): string[] {
  const out: string[] = [];
  let level = nodes;
  for (const p of path) {
    const hit = level.find((n) => n.slug === p);
    if (!hit) break;
    out.push(hit.label);
    level = hit.kids ?? [];
  }
  return out;
}

export function countLeaves(nodes: Node[]): number {
  let n = 0;
  for (const x of nodes) n += x.kids?.length ? countLeaves(x.kids) : 1;
  return n;
}

export function countNodes(nodes: Node[]): number {
  let n = 0;
  for (const x of nodes) { n += 1; if (x.kids) n += countNodes(x.kids); }
  return n;
}

/** Ağacı düz listeye açar — arama ve rastgele seçim için. */
export function flatten(nodes: Node[], depth = 0, prefix: string[] = [], out: { path: string[]; labels: string[] }[] = []) {
  for (const n of nodes) {
    const path = [...prefix, n.slug];
    if (n.kids?.length) flatten(n.kids, depth + 1, path, out);
    else out.push({ path, labels: [] });
  }
  return out;
}
