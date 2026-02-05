"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

const links = [
  { label: "Dashboard", href: "/admin" },
  { label: "Metrics", href: "/admin/metrics" },
  { label: "LPs", href: "/admin/lps" },
  { label: "Companies", href: "/admin/companies" },
  { label: "Investments", href: "/admin/investments" },
  { label: "Updates", href: "/admin/updates" },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="mr-6">
          <Logo />
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm ${isActive(link.href) ? "font-semibold underline" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Link href="/portal" className="text-sm underline">
          LP Portal
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm underline">
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
