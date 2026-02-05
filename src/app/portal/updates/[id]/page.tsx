import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UpdateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fund?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: update } = await supabase
    .from("updates")
    .select("*")
    .eq("id", id)
    .single();

  // RLS blocks draft updates for LPs; null means no access or not found
  if (!update) {
    redirect(`/portal/updates${sp.fund ? `?fund=${sp.fund}` : ""}`);
  }

  const backHref = `/portal/updates${sp.fund ? `?fund=${sp.fund}` : ""}`;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link
        href={backHref}
        className="text-xs text-gray-400 hover:text-black transition-colors"
      >
        ← Back
      </Link>
      <h1 className="text-3xl font-light tracking-tight mt-6">
        {update.title}
      </h1>
      {update.published_at && (
        <p className="text-xs text-gray-400 mt-2">
          {new Date(update.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
      <div className="mt-8 prose max-w-none">
        {update.body ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {update.body}
          </ReactMarkdown>
        ) : null}
      </div>
    </div>
  );
}
