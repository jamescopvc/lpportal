"use server";

import { createClient } from "@/lib/supabase/server";
import type { Fund } from "@/lib/types";

export async function getFunds(): Promise<Fund[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("funds").select("*").order("slug");
  return (data as Fund[]) || [];
}
