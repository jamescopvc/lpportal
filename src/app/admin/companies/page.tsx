import { getCompanies } from "@/lib/actions/companies";
import { getFunds } from "@/lib/actions/funds";
import { CompaniesTable } from "@/components/admin/companies-table";

export default async function CompaniesPage() {
  const [companies, funds] = await Promise.all([
    getCompanies(),
    getFunds(),
  ]);
  return <CompaniesTable initialData={companies} funds={funds} />;
}
