"use server";

import { createClient } from "@/lib/supabase/server";
import type { FundMetrics } from "@/lib/types";

export async function getMetrics(fundId: string): Promise<FundMetrics[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fund_metrics")
    .select("*")
    .eq("fund_id", fundId)
    .order("year", { ascending: true })
    .order("quarter", { ascending: true });
  return (data as FundMetrics[]) || [];
}

export async function updateMetric(id: string, field: string, value: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fund_metrics")
    .update({
      [field]: value === "" ? null : value,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addQuarter(
  fundId: string,
  quarter: number,
  year: number
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fund_metrics")
    .insert({ fund_id: fundId, quarter, year })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as FundMetrics;
}
