import { getFunds } from "@/lib/actions/funds";
import { UpdateEditor } from "@/components/admin/update-editor";

export default async function NewUpdatePage() {
  const funds = await getFunds();
  return <UpdateEditor funds={funds} />;
}
