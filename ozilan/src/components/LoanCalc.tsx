"use client";
import { useMemo, useState } from "react";
import { num, tl } from "@/lib/format";

/** temsilî aylık taksit hesaplayıcı — emlak ve vasıta satılık ilanları için */
export function LoanCalc({ price, kind }: { price: number; kind: "emlak" | "vasita" }) {
  const [downPct, setDownPct] = useState(kind === "emlak" ? 20 : 30);
  const [months, setMonths] = useState(kind === "emlak" ? 120 : 36);
  const [rate, setRate] = useState(kind === "emlak" ? 2.79 : 3.49); // aylık %

  const res = useMemo(() => {
    const principal = price * (1 - downPct / 100);
    const r = rate / 100;
    const pay = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    return { principal, pay, total: pay * months };
  }, [price, downPct, months, rate]);

  const maxMonths = kind === "emlak" ? 240 : 48;

  return (
    <div className="panel-flat p-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Kredi hesaplayıcı</span>
        <span className="font-mono text-2xs text-mute-2">temsilîdir</span>
      </div>

      <p className="num mt-3 text-2xl leading-none text-signal">{tl(Math.round(res.pay))}<span className="ml-1 text-[0.8rem] text-mute">/ ay</span></p>
      <p className="mt-1.5 text-[0.78rem] text-mute">
        {num(Math.round(res.principal))} TL kredi · {months} ay · aylık %{rate.toFixed(2)}
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="flex justify-between text-[0.78rem] text-mute">
            <span>Peşinat</span><span className="num text-ink">%{downPct} · {tl(Math.round(price * downPct / 100))}</span>
          </span>
          <input type="range" min={10} max={90} step={5} value={downPct}
            onChange={(e) => setDownPct(+e.target.value)} className="mt-2 w-full" />
        </label>
        <label className="block">
          <span className="flex justify-between text-[0.78rem] text-mute">
            <span>Vade</span><span className="num text-ink">{months} ay</span>
          </span>
          <input type="range" min={12} max={maxMonths} step={12} value={months}
            onChange={(e) => setMonths(+e.target.value)} className="mt-2 w-full" />
        </label>
        <label className="block">
          <span className="flex justify-between text-[0.78rem] text-mute">
            <span>Aylık faiz</span><span className="num text-ink">%{rate.toFixed(2)}</span>
          </span>
          <input type="range" min={1} max={6} step={0.1} value={rate}
            onChange={(e) => setRate(+e.target.value)} className="mt-2 w-full" />
        </label>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[0.7rem] leading-relaxed text-mute">
        Toplam geri ödeme <span className="num text-ink">{tl(Math.round(res.total))}</span>.
        Hesap bilgilendirme amaçlıdır; güncel oranlar bankanıza göre değişir.
      </p>
    </div>
  );
}
