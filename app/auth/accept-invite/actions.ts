"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function completeInvitation(
  formData: FormData
) {
  const tokenHash = formData
    .get("token_hash")
    ?.toString();

  const password = formData
    .get("password")
    ?.toString();

  const confirmPassword = formData
    .get("confirmPassword")
    ?.toString();

  if (!tokenHash) {
    redirect(
      "/login?error=Invitation token is missing"
    );
  }

  if (!password) {
    redirect(
      `/auth/accept-invite?token_hash=${encodeURIComponent(
        tokenHash
      )}&error=Password is required`
    );
  }

  if (password.length < 8) {
    redirect(
      `/auth/accept-invite?token_hash=${encodeURIComponent(
        tokenHash
      )}&error=Password must be at least 8 characters`
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/auth/accept-invite?token_hash=${encodeURIComponent(
        tokenHash
      )}&error=Passwords do not match`
    );
  }

  const supabase =
    await createClient();

  /*
   * Verify the invitation token.
   *
   * This is the important part:
   * the token is NOT verified when the
   * email provider scans the link.
   *
   * It is verified only when the user
   * submits the form.
   */
  const {
    data,
    error: verifyError,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (
    verifyError ||
    !data.user
  ) {
    redirect(
      "/login?error=This invitation has expired or is invalid. Please ask the administrator to send a new invitation."
    );
  }

  /*
   * Update the password.
   */
  const {
    error: passwordError,
  } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    redirect(
      `/auth/accept-invite?token_hash=${encodeURIComponent(
        tokenHash
      )}&error=${encodeURIComponent(
        passwordError.message
      )}`
    );
  }

  /*
   * Make sure the application profile
   * is correctly configured.
   */
  const supabaseAdmin =
    createAdminClient();

  await supabaseAdmin
    .from("profiles")
    .update({
      role: "TEAM_MEMBER",
    })
    .eq("id", data.user.id);

  /*
   * Sign out the temporary invitation session.
   *
   * The user should explicitly login
   * using their new password.
   */
  await supabase.auth.signOut({
    scope: "local",
  });

  redirect(
    "/login?success=Your account is ready. You can now sign in."
  );
}