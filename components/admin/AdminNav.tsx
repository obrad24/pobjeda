"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_NAV, isAdminNavActive } from "@/lib/admin/nav";

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {ADMIN_NAV.map((link) => {
        const active = isAdminNavActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-2 text-sm ${
              active ? "bg-white/10 text-gold" : "text-white/85 hover:bg-white/10 hover:text-gold"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-navy-dark text-white md:flex">
      <div className="border-b border-gold/20 px-5 py-5">
        <p className="font-display text-lg text-gold">Pobjeda</p>
        <p className="text-xs text-white/60">Admin panel</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Admin navigacija">
        <NavLinks pathname={pathname} />
        <Link href="/" className="mt-auto rounded-md px-3 py-2 text-sm text-white/60 hover:text-gold">
          Javni sajt
        </Link>
      </nav>
    </aside>
  );
}

export function AdminMobileNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex items-center gap-3 md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy/20 text-navy"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Zatvori meni" : "Otvori meni"}</span>
        <span className="flex flex-col gap-1.5" aria-hidden>
          <span className={`h-0.5 w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </span>
      </button>
      <p className="truncate text-sm text-muted">{email}</p>
      {open ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-0 z-40 bg-navy-dark/98"
          role="dialog"
          aria-modal="true"
          aria-label="Admin meni"
        >
          <nav className="flex h-full flex-col gap-1 px-5 py-8">
            <button
              type="button"
              className="mb-4 self-end text-sm text-gold"
              onClick={() => setOpen(false)}
            >
              Zatvori
            </button>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <Link href="/" className="mt-6 px-3 text-sm text-white/70">
              Javni sajt
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
