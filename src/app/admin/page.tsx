import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [lpsResult, updatesResult, metricsResult] = await Promise.all([
    supabase.from("allowed_lps").select("*", { count: "exact", head: true }),
    supabase
      .from("updates")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("fund_metrics")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const totalLPs = lpsResult.count ?? 0;
  const publishedUpdates = updatesResult.count ?? 0;
  const lastMetricsUpdate = metricsResult.data?.updated_at;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border p-4">
          <p className="text-xs text-gray-500 mb-1">Total LPs</p>
          <p className="text-xl font-semibold">{totalLPs}</p>
        </div>
        <div className="border p-4">
          <p className="text-xs text-gray-500 mb-1">Updates Published</p>
          <p className="text-xl font-semibold">{publishedUpdates}</p>
        </div>
        <div className="border p-4">
          <p className="text-xs text-gray-500 mb-1">Last Metrics Update</p>
          <p className="text-sm">
            {lastMetricsUpdate
              ? new Date(lastMetricsUpdate).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Quick actions</p>
        <div className="flex gap-4">
          <Link href="/admin/lps" className="text-sm underline">
            Add LP
          </Link>
          <Link href="/admin/updates/new" className="text-sm underline">
            New Update
          </Link>
          <Link href="/admin/metrics" className="text-sm underline">
            Update Metrics
          </Link>
        </div>
      </div>
    </div>
  );
}
