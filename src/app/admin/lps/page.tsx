import { getLPs } from "@/lib/actions/lps";
import { getFunds } from "@/lib/actions/funds";
import { LPsTable } from "@/components/admin/lps-table";

export default async function LPsPage() {
  const [lps, funds] = await Promise.all([getLPs(), getFunds()]);
  return <LPsTable initialData={lps} funds={funds} />;
}
