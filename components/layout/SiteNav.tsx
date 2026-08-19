"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/nav";

function linkClass(active: boolean) {
  return [
    "relative rounded-full px-3 py-1.5 text-sm font-medium tracking-wide transition-all duration-200",
    active
      ? "glass-pill text-purple-light"
      : "text-white/70 hover:text-purple-light hover:bg-white/5",
  ].join(" ");
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-1 xl:flex" aria-label="Glavna navigacija">
        {NAV_LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} prefetch={false} className={linkClass(active)}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* More menu for items not in bottom nav */}
      <button
        type="button"
        className="glass-pill inline-flex h-10 w-10 items-center justify-center text-purple-light xl:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Zatvori meni" : "Otvori meni"}</span>
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30 xl:hidden" aria-hidden onClick={() => setOpen(false)} />
          <div
            id="mobile-nav"
            className="fixed inset-x-3 top-[4.75rem] z-40 rounded-3xl border border-white/10 bg-[#0f0a2e]/95 p-4 shadow-2xl backdrop-blur-2xl xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobilni meni"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className={`rounded-2xl px-4 py-3 font-display text-lg transition ${
                      active ? "bg-purple/15 text-purple-light" : "text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
