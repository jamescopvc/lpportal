"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUpdates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("updates")
    .select("*, update_fund_visibility(fund_id)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUpdate(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("updates")
    .select("*, update_fund_visibility(fund_id)")
    .eq("id", id)
    .single();
  return data;
}

export async function createUpdate(
  title: string,
  body: string,
  fundIds: string[]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("updates")
    .insert({ title, body, status: "draft" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (fundIds.length > 0) {
    await supabase
      .from("update_fund_visibility")
      .insert(fundIds.map((fund_id) => ({ update_id: data.id, fund_id })));
  }

  return {
    ...data,
    update_fund_visibility: fundIds.map((fund_id) => ({ fund_id })),
  };
}

export async function saveUpdate(
  id: string,
  title: string,
  body: string,
  fundIds: string[]
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("updates")
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Sync fund visibility
  await supabase
    .from("update_fund_visibility")
    .delete()
    .eq("update_id", id);
  if (fundIds.length > 0) {
    await supabase
      .from("update_fund_visibility")
      .insert(fundIds.map((fund_id) => ({ update_id: id, fund_id })));
  }
}

export async function publishUpdate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("updates")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function unpublishUpdate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("updates")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteUpdate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("updates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
