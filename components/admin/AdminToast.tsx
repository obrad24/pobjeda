"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AdminToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = searchParams.get("toast");

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("toast");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toast, pathname, router, searchParams]);

  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-navy px-4 py-3 text-sm text-gold shadow-lg"
    >
      {toast}
    </div>
  );
}
