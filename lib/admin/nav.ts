export const ADMIN_NAV = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin/igraci", label: "Igrači" },
  { href: "/admin/utakmice", label: "Utakmice" },
  { href: "/admin/fantasy", label: "Fantasy" },
  { href: "/admin/liga", label: "Liga" },
  { href: "/admin/sezone", label: "Sezone" },
  { href: "/admin/istorija", label: "Istorija" },
  { href: "/admin/podesavanja", label: "Podešavanja" },
] as const;

export function isAdminNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
