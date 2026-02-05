"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAppUrl(): Promise<string> {
  const headersList = await headers();
  return headersList.get("origin") || "http://localhost:3000";
}

/**
 * Step 1 of login: check whether email is allowed and whether user record exists.
 * Uses admin client because RLS blocks unauthenticated reads on allowed_lps and users.
 */
export async function checkEmail(
  email: string
): Promise<{ status: "not_allowed" | "new_user" | "existing_user" }> {
  const admin = createAdminClient();

  const { data: allowedLp } = await admin
    .from("allowed_lps")
    .select("id")
    .eq("email", email)
    .single();

  if (!allowedLp) {
    return { status: "not_allowed" };
  }

  const { data: user } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  return { status: user ? "existing_user" : "new_user" };
}

/** Send magic link OTP for first-time users. */
export async function sendMagicLink(email: string) {
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Password login for returning users. Redirects on success. */
export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication failed");
  }

  // Update last_login_at and fetch role in one query
  const { data: userData } = await supabase
    .from("users")
    .update({
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("role")
    .single();

  redirect(userData?.role === "admin" ? "/admin" : "/portal");
}

/** Set or update password for the current authenticated user. */
export async function setupPassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new Error(error.message);
  }
}

/** Create the Users table record after first-time password setup. */
export async function createUserRecord() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No authenticated user");
  }

  // allowed_lps lookup needs admin client (RLS: admin-only table)
  const { data: allowedLp } = await admin
    .from("allowed_lps")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!allowedLp) {
    throw new Error("Email not in AllowedLPs");
  }

  await supabase.from("users").insert({
    id: user.id,
    email: user.email!,
    allowed_lp_id: allowedLp.id,
    role: "lp",
  });
}

/** Send password reset email. */
export async function resetPassword(email: string) {
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Sign out and redirect to login. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Get the current user's record from our Users table (null if not found). */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}

/** Get the list of Funds the current user can access. */
export async function getUserFunds() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: userData } = await supabase
    .from("users")
    .select("allowed_lp_id")
    .eq("id", user.id)
    .single();

  if (!userData?.allowed_lp_id) return [];

  const { data: fundAccess } = await supabase
    .from("lp_fund_access")
    .select("fund_id")
    .eq("allowed_lp_id", userData.allowed_lp_id);

  if (!fundAccess || fundAccess.length === 0) return [];

  const { data: funds } = await supabase
    .from("funds")
    .select("*")
    .in(
      "id",
      fundAccess.map((fa) => fa.fund_id)
    )
    .order("slug");

  return funds || [];
}
