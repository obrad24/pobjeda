import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/nav";
import { SiteNav } from "./SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-navy">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-white">
          <Image src="/logo.svg" alt="" width={36} height={40} preload unoptimized className="h-9 w-8" />
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold tracking-wide sm:text-lg">
              FK Pobjeda
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">Triješnica</span>
          </span>
          <span className="sr-only">{SITE_NAME}</span>
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
