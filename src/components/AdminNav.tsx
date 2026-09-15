"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/static-content", label: "Static content" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
      <nav className="flex flex-wrap gap-4">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold ${active ? "text-accent-dark" : "text-muted hover:text-foreground"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="text-sm font-semibold text-muted hover:text-foreground">
        Log out
      </button>
    </div>
  );
}
