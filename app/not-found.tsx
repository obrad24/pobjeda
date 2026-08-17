import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark">404</p>
      <h1 className="mt-3 font-display text-4xl text-navy">Stranica nije pronađena</h1>
      <p className="mt-3 text-muted">Tražena stranica, igrač ili utakmica ne postoji.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-navy px-5 py-2.5 text-sm text-gold hover:bg-navy-dark">
        Nazad na početnu
      </Link>
    </div>
  );
}
