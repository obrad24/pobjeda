import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/nav";

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-red bg-navy-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <Image src="/logo.svg" alt="" width={40} height={46} unoptimized className="h-11 w-9" />
          <div>
            <p className="font-display text-lg font-semibold tracking-wide">{SITE_NAME}</p>
            <p className="mt-1 text-sm text-gold">{SITE_TAGLINE}</p>
          </div>
        </div>

        <nav aria-label="Podnožje" className="grid grid-cols-2 gap-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-white/80 hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm leading-6 text-white/70">
          Tabela, raspored i rezultati lige preuzimaju se sa{" "}
          <a
            href="https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina"
            className="text-gold hover:text-gold-light"
            rel="noreferrer"
          >
            SportDC
          </a>
          . Statistika igrača vodi se u klupskoj evidenciji.
        </p>
      </div>
      <div className="border-t border-gold/20 py-4 text-center text-xs tracking-wide text-white/50">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}
