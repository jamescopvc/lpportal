import { getInvestments } from "@/lib/actions/investments";
import { getFunds } from "@/lib/actions/funds";
import { getCompanies } from "@/lib/actions/companies";
import { InvestmentsTable } from "@/components/admin/investments-table";

export default async function InvestmentsPage() {
  const [investments, funds, companies] = await Promise.all([
    getInvestments(),
    getFunds(),
    getCompanies(),
  ]);
  return (
    <InvestmentsTable
      initialData={investments}
      funds={funds}
      companies={companies}
    />
  );
}
