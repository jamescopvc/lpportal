"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCompanies() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*, company_funds(fund_id)")
    .order("name");
  return data || [];
}

export async function addCompany(
  company: {
    name: string;
    sector: string;
    location: string;
    status: string;
    website_url: string;
  },
  fundIds: string[]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert(company)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (fundIds.length > 0) {
    await supabase
      .from("company_funds")
      .insert(fundIds.map((fund_id) => ({ company_id: data.id, fund_id })));
  }

  return { ...data, company_funds: fundIds.map((fund_id) => ({ fund_id })) };
}

export async function updateCompanyField(
  id: string,
  field: string,
  value: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      [field]: value === "" ? null : value,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateCompanyFunds(
  companyId: string,
  fundIds: string[]
) {
  const supabase = await createClient();
  await supabase
    .from("company_funds")
    .delete()
    .eq("company_id", companyId);

  if (fundIds.length > 0) {
    await supabase
      .from("company_funds")
      .insert(fundIds.map((fund_id) => ({ company_id: companyId, fund_id })));
  }
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();

  // Blocked if investments exist
  const { count } = await supabase
    .from("investments")
    .select("*", { count: "exact", head: true })
    .eq("company_id", id);

  if (count && count > 0) {
    throw new Error("Cannot delete: this company has investments");
  }

  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
