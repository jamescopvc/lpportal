import { getUpdates } from "@/lib/actions/updates";
import { getFunds } from "@/lib/actions/funds";
import { UpdatesList } from "@/components/admin/updates-list";

export default async function UpdatesPage() {
  const [updates, funds] = await Promise.all([getUpdates(), getFunds()]);
  return <UpdatesList initialData={updates} funds={funds} />;
}
