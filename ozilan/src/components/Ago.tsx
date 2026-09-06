"use client";
/* Göreli zaman etiketi.
   `ago()` doğrudan render edilirse sunucuda (derleme anı) ve istemcide
   (ziyaret anı) farklı metin üretir; React bunu hidrasyon uyuşmazlığı
   sayar ve tüm istemci ağacını düşürür — efektler dahil. Bu yüzden
   değer yalnızca bağlandıktan sonra yazılır. */
import { useEffect, useState } from "react";
import { ago } from "@/lib/format";

export function Ago({ ts, className }: { ts: number; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {now === null ? " " : ago(ts, now)}
    </span>
  );
}
