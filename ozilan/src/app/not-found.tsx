import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-serif text-[clamp(2.2rem,6vw,3.6rem)] leading-none">Bu sayfa yayında değil</h1>
      <p className="mt-3 text-mute">Aradığın ilan kaldırılmış ya da bağlantı hatalı olabilir.</p>
      <div className="mt-7 flex justify-center gap-2">
        <Link href="/" className="btn-primary">Anasayfa</Link>
        <Link href="/arama/" className="btn-ghost">İlanlara göz at</Link>
      </div>
    </div>
  );
}
