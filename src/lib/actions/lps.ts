"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getLPs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("allowed_lps")
    .select("*, lp_fund_access(fund_id), users(last_login_at)")
    .order("email");
  return data || [];
}

export async function addLP(
  email: string,
  name: string,
  organization: string,
  fundIds: string[]
) {
  const supabase = await createClient();

  const { data: lp, error } = await supabase
    .from("allowed_lps")
    .insert({ email, name, organization })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (fundIds.length > 0) {
    await supabase
      .from("lp_fund_access")
      .insert(fundIds.map((fund_id) => ({ allowed_lp_id: lp.id, fund_id })));
  }

  return {
    ...lp,
    lp_fund_access: fundIds.map((fund_id) => ({ fund_id })),
    users: [],
  };
}

export async function updateLPField(
  id: string,
  field: "name" | "organization",
  value: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("allowed_lps")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateLPFunds(
  allowedLpId: string,
  fundIds: string[]
) {
  const supabase = await createClient();
  await supabase
    .from("lp_fund_access")
    .delete()
    .eq("allowed_lp_id", allowedLpId);

  if (fundIds.length > 0) {
    await supabase
      .from("lp_fund_access")
      .insert(fundIds.map((fund_id) => ({ allowed_lp_id: allowedLpId, fund_id })));
  }
}

export async function deleteLP(allowedLpId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Find auth user if they've logged in
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("allowed_lp_id", allowedLpId)
    .single();

  if (user) {
    // Delete auth user → users row cascades (ON DELETE CASCADE)
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`Failed to remove auth user: ${error.message}`);
  }

  // Delete AllowedLP → lp_fund_access cascades
  const { error } = await supabase
    .from("allowed_lps")
    .delete()
    .eq("id", allowedLpId);
  if (error) throw new Error(error.message);
}
