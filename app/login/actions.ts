"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect(
      "/login?error=Please enter your email and password"
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Unable to load user profile");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    await supabase.auth.signOut({
      scope: "local",
    });

    redirect(
      "/login?error=User profile could not be loaded"
    );
  }

  if (profile.role === "ADMIN") {
    redirect("/admin");
  }

  if (profile.role === "TEAM_MEMBER") {
    redirect("/team-member");
  }

  await supabase.auth.signOut({
    scope: "local",
  });

  redirect("/login?error=Invalid user role");
}