import { getUserFunds } from "@/lib/actions/auth";
import { getMetrics } from "@/lib/actions/metrics";
import { FundStats } from "@/components/portal/fund-stats";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string }>;
}) {
  const params = await searchParams;
  const funds = await getUserFunds();
  const activeFund = funds.find((f) => f.slug === params.fund) || funds[0];

  if (!activeFund) {
    return <p className="text-sm text-gray-500">No fund access.</p>;
  }

  const metrics = await getMetrics(activeFund.id);

  return <FundStats fundName={activeFund.name} metrics={metrics} />;
}
