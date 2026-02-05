import { getUserFunds } from "@/lib/actions/auth";
import { PortalNav } from "@/components/portal-nav";
import { IdleTimeout } from "@/components/idle-timeout";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const funds = await getUserFunds();

  return (
    <div className="min-h-screen bg-white">
      <IdleTimeout />
      <PortalNav funds={funds} />
      <main className="max-w-6xl mx-auto px-6">{children}</main>
    </div>
  );
}
