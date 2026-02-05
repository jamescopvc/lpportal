"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import type { Fund } from "@/lib/types";

interface Props {
  funds: Fund[];
}

export function PortalNav({ funds }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeFundSlug = searchParams.get("fund") || funds[0]?.slug;

  const withFund = (href: string) =>
    activeFundSlug ? `${href}?fund=${activeFundSlug}` : href;

  const switchFund = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fund", slug);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isActive = (href: string) =>
    href === "/portal/updates"
      ? pathname.startsWith(href)
      : pathname === href;

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
      <div className="flex items-center gap-10">
        <Link href="/portal" className="mr-6">
          <Logo />
        </Link>
        {[
          { label: "Fund Stats", href: "/portal/stats" },
          { label: "Portfolio", href: "/portal/portfolio" },
          { label: "Updates", href: "/portal/updates" },
        ].map((link) => (
          <Link
            key={link.label}
            href={withFund(link.href)}
            className={`text-sm transition-colors ${
              isActive(link.href)
                ? "text-black font-medium"
                : "text-gray-400 hover:text-black"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-6">
        {funds.length > 1 && (
          <select
            value={activeFundSlug || ""}
            onChange={(e) => switchFund(e.target.value)}
            className="text-sm border border-gray-200 px-3 py-1 bg-white"
          >
            {funds.map((fund) => (
              <option key={fund.id} value={fund.slug}>
                {fund.name}
              </option>
            ))}
          </select>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-black transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
