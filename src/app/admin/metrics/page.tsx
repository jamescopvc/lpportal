import { getFunds } from "@/lib/actions/funds";
import { getMetrics } from "@/lib/actions/metrics";
import { MetricsSheet } from "@/components/admin/metrics-sheet";

export default async function MetricsPage() {
  const funds = await getFunds();
  const defaultFundId = funds[0]?.id;
  const metrics = defaultFundId ? await getMetrics(defaultFundId) : [];

  return (
    <MetricsSheet
      funds={funds}
      initialMetrics={metrics}
      initialFundId={defaultFundId ?? ""}
    />
  );
}
