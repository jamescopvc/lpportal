import { createClient } from "@/lib/supabase/server";
import { getUserFunds } from "@/lib/actions/auth";
import { PortfolioTables } from "@/components/portal/portfolio-tables";

export default async function PortfolioPage({
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

  const supabase = await createClient();

  // Companies for this fund via junction table
  const { data: companyFunds } = await supabase
    .from("company_funds")
    .select("company_id")
    .eq("fund_id", activeFund.id);

  const companyIds = (companyFunds || []).map((cf) => cf.company_id);

  let companies: Record<string, unknown>[] = [];
  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .in("id", companyIds)
      .order("name");
    companies = data || [];
  }

  // Investments for this fund
  const { data: investments } = await supabase
    .from("investments")
    .select("*, companies(name)")
    .eq("fund_id", activeFund.id)
    .order("investment_date", { ascending: false });

  return (
    <PortfolioTables
      fundName={activeFund.name}
      companies={companies}
      investments={investments || []}
    />
  );
}
