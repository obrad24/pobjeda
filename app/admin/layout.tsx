import { Suspense } from "react";
import { logoutAction } from "@/app/login/actions";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";
import { AdminToast } from "@/components/admin/AdminToast";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-full">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-navy/10 bg-white px-4 py-3 md:px-8">
          <AdminMobileNav email={admin.email} />
          <p className="hidden truncate text-sm text-muted md:block">{admin.email}</p>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-navy hover:text-gold-dark">
              Odjava
            </button>
          </form>
        </header>
        <div className="flex-1 px-4 py-8 md:px-8">{children}</div>
      </div>
      <Suspense fallback={null}>
        <AdminToast />
      </Suspense>
    </div>
  );
}
