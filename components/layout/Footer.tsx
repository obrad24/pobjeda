import Link from "next/link";
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/nav";
import { ClubLogo } from "@/components/ui/ClubLogo";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/10">
      <div className="glass-dark mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <ClubLogo size="md" decorative />
          <div>
            <p className="font-display text-lg font-semibold tracking-wide text-white">{SITE_NAME}</p>
            <p className="mt-1 text-sm text-purple-light">{SITE_TAGLINE}</p>
          </div>
        </div>

        <nav aria-label="Podnožje" className="grid grid-cols-2 gap-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} className="text-white/60 transition hover:text-purple-light">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm leading-6 text-white/50">
          Tabela, raspored i rezultati lige preuzimaju se sa{" "}
          <a
            href="https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina"
            className="text-purple-light transition hover:text-white"
            rel="noreferrer"
          >
            SportDC
          </a>
          . Statistika igrača vodi se u klupskoj evidenciji.
        </p>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs tracking-wide text-white/30">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}
