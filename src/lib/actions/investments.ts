"use server";

import { createClient } from "@/lib/supabase/server";

export async function getInvestments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investments")
    .select("*, companies(name)")
    .order("investment_date", { ascending: false });
  return data || [];
}

export async function addInvestment(investment: {
  company_id: string;
  fund_id: string;
  investment_date: string;
  investment_type: string;
  stage: string;
  amount: string;
  ownership_percentage: string;
  role: string;
  post_money_valuation: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .insert({
      company_id: investment.company_id,
      fund_id: investment.fund_id,
      investment_date: investment.investment_date || null,
      investment_type: investment.investment_type || null,
      stage: investment.stage || null,
      amount: investment.amount || null,
      ownership_percentage: investment.ownership_percentage || null,
      role: investment.role || null,
      post_money_valuation: investment.post_money_valuation || null,
    })
    .select("*, companies(name)")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateInvestmentField(
  id: string,
  field: string,
  value: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .update({
      [field]: value === "" ? null : value,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
