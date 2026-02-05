import { createClient } from "@/lib/supabase/server";
import { getUserFunds } from "@/lib/actions/auth";
import Link from "next/link";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string }>;
}) {
  const params = await searchParams;
  const funds = await getUserFunds();
  const activeFund = funds.find((f) => f.slug === params.fund) || funds[0];

  if (!activeFund) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        No fund access.
      </p>
    );
  }

  const supabase = await createClient();

  const { data: vis } = await supabase
    .from("update_fund_visibility")
    .select("update_id")
    .eq("fund_id", activeFund.id);

  const updateIds = (vis || []).map((v) => v.update_id);

  let updates: { id: string; title: string; published_at: string | null }[] =
    [];
  if (updateIds.length > 0) {
    const { data } = await supabase
      .from("updates")
      .select("id, title, published_at")
      .in("id", updateIds)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    updates = data || [];
  }

  const fundParam = activeFund.slug ? `?fund=${activeFund.slug}` : "";

  return (
    <div className="py-8">
      <h1 className="text-4xl font-light tracking-tight text-center mb-10">
        Updates
      </h1>
      <div className="max-w-xl mx-auto">
        {updates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No updates yet.
          </p>
        ) : (
          <div className="flex flex-col">
            {updates.map((update, i) => (
              <div key={update.id}>
                <Link
                  href={`/portal/updates/${update.id}${fundParam}`}
                  className="block py-5"
                >
                  <p className="text-base font-medium">{update.title}</p>
                  {update.published_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.published_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  )}
                </Link>
                {i < updates.length - 1 && <hr className="border-gray-100" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
