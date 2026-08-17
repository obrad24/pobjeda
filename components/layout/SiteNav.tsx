"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/nav";

function linkClass(active: boolean) {
  return [
    "relative px-1 py-2 text-sm font-medium tracking-wide transition-colors",
    active ? "text-gold" : "text-white/85 hover:text-gold-light",
    active ? "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-gold" : "",
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
      <nav className="hidden items-center gap-4 xl:flex" aria-label="Glavna navigacija">
        {NAV_LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={linkClass(active)}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gold/30 text-gold xl:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Zatvori meni" : "Otvori meni"}</span>
        <span className="flex flex-col gap-1.5" aria-hidden>
          <span className={`h-0.5 w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </span>
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-16 z-40 bg-navy-dark/98 sm:top-[4.25rem] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobilni meni"
        >
          <nav className="flex h-full flex-col gap-2 px-6 py-8">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`border-b border-white/10 py-4 font-display text-2xl ${
                    active ? "text-gold" : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
}
