import { getUpdate } from "@/lib/actions/updates";
import { getFunds } from "@/lib/actions/funds";
import { UpdateEditor } from "@/components/admin/update-editor";
import { redirect } from "next/navigation";

export default async function EditUpdatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [update, funds] = await Promise.all([getUpdate(id), getFunds()]);

  if (!update) {
    redirect("/admin/updates");
  }

  return (
    <UpdateEditor
      funds={funds}
      initialUpdate={{
        id: update.id,
        title: update.title,
        body: update.body ?? "",
        status: update.status,
        fundIds: update.update_fund_visibility.map(
          (v: { fund_id: string }) => v.fund_id
        ),
      }}
    />
  );
}
