import { getCompanies } from "@/lib/actions/companies";
import { getFunds } from "@/lib/actions/funds";
import { CompaniesTable } from "@/components/admin/companies-table";

export default async function CompaniesPage() {
  const funds = await getFunds();
  const defaultFundId = funds[0]?.id;
  const companies = await getCompanies();

  return (
    <CompaniesTable
      initialData={companies}
      funds={funds}
      initialFundId={defaultFundId ?? ""}
    />
  );
}
