import { AdminNav } from "@/components/admin-nav";
import { IdleTimeout } from "@/components/idle-timeout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <IdleTimeout />
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
