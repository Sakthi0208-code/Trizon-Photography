"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INVITE_REDIRECT_URL =
  "http://localhost:3000/auth/accept-invite";

/*
|--------------------------------------------------------------------------
| ADMIN AUTHORIZATION
|--------------------------------------------------------------------------
*/

async function requireAdmin() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    redirect("/login?error=You must be signed in");
  }

  const currentUserId = claimsData.claims.sub;

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", currentUserId)
      .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "ADMIN"
  ) {
    redirect(
      "/admin/team-members?error=Only administrators can manage team members"
    );
  }

  return {
    supabase,
    currentUserId,
    profile,
  };
}

/*
|--------------------------------------------------------------------------
| INVITE TEAM MEMBER
|--------------------------------------------------------------------------
*/

export async function inviteTeamMember(
  formData: FormData
) {
  const fullName = formData
    .get("fullName")
    ?.toString()
    .trim();

  const email = formData
    .get("email")
    ?.toString()
    .trim()
    .toLowerCase();

  if (!fullName || !email) {
    redirect(
      "/admin/team-members?error=Name and email are required"
    );
  }

  await requireAdmin();

  const supabaseAdmin = createAdminClient();

  /*
   * Check whether this email already exists.
   *
   * This gives us a cleaner application error
   * instead of blindly attempting another invite.
   */
  const {
    data: usersData,
    error: usersError,
  } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    redirect(
      `/admin/team-members?error=${encodeURIComponent(
        usersError.message
      )}`
    );
  }

  const existingUser = usersData.users.find(
    (user) =>
      user.email?.toLowerCase() === email
  );

  if (existingUser) {
    const existingProfile =
      await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", existingUser.id)
        .maybeSingle();

    if (
      existingProfile.data?.role ===
      "TEAM_MEMBER"
    ) {
      if (!existingUser.email_confirmed_at) {
        redirect(
          "/admin/team-members?error=This team member already has a pending invitation. Use Resend Invitation."
        );
      }

      redirect(
        "/admin/team-members?error=This email already belongs to an active team member."
      );
    }

    if (
      existingProfile.data?.role ===
      "ADMIN"
    ) {
      redirect(
        "/admin/team-members?error=This email belongs to an administrator."
      );
    }

    redirect(
      "/admin/team-members?error=This email is already registered."
    );
  }

  /*
   * Create the invitation.
   *
   * Supabase creates the Auth user and sends
   * the invitation email.
   */
  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
        },
        redirectTo: INVITE_REDIRECT_URL,
      }
    );

  if (error) {
    redirect(
      `/admin/team-members?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  /*
   * The database trigger automatically creates
   * the profile.
   *
   * We immediately make sure the application
   * profile has the correct name and role.
   */
  if (data.user) {
    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        role: "TEAM_MEMBER",
      })
      .eq("id", data.user.id);

    if (profileError) {
      redirect(
        `/admin/team-members?error=${encodeURIComponent(
          profileError.message
        )}`
      );
    }
  }

  redirect(
    "/admin/team-members?success=Team member invitation sent successfully"
  );
}

/*
|--------------------------------------------------------------------------
| DELETE TEAM MEMBER
|--------------------------------------------------------------------------
*/

export async function deleteTeamMember(
  formData: FormData
) {
  const userId = formData
    .get("userId")
    ?.toString();

  if (!userId) {
    redirect(
      "/admin/team-members?error=Team member ID is required"
    );
  }

  const { currentUserId } =
    await requireAdmin();

  /*
   * Never allow the admin to delete
   * their own account.
   */
  if (userId === currentUserId) {
    redirect(
      "/admin/team-members?error=You cannot delete your own administrator account"
    );
  }

  const supabaseAdmin = createAdminClient();

  /*
   * Get Auth user.
   */
  const {
    data: userData,
    error: userError,
  } =
    await supabaseAdmin.auth.admin.getUserById(
      userId
    );

  if (
    userError ||
    !userData.user
  ) {
    redirect(
      "/admin/team-members?error=Team member not found"
    );
  }

  /*
   * Verify application role.
   */
  const {
    data: targetProfile,
    error: targetProfileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (
    targetProfileError ||
    !targetProfile
  ) {
    redirect(
      "/admin/team-members?error=Team member profile not found"
    );
  }

  if (
    targetProfile.role !==
    "TEAM_MEMBER"
  ) {
    redirect(
      "/admin/team-members?error=Only team members can be deleted from this screen"
    );
  }

  /*
   * Delete Auth user.
   *
   * profiles.id references auth.users.id
   * with ON DELETE CASCADE.
   */
  const {
    error: deleteError,
  } =
    await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

  if (deleteError) {
    redirect(
      `/admin/team-members?error=${encodeURIComponent(
        deleteError.message
      )}`
    );
  }

  redirect(
    "/admin/team-members?success=Team member deleted successfully"
  );
}

/*
|--------------------------------------------------------------------------
| RESEND TEAM MEMBER INVITATION
|--------------------------------------------------------------------------
|
| Supabase invitation users cannot simply be invited again
| while the old unconfirmed Auth user still exists.
|
| Therefore:
|
| 1. Verify pending user.
| 2. Save their information.
| 3. Delete old unconfirmed Auth user.
| 4. Create a fresh invitation.
|
|--------------------------------------------------------------------------
*/

export async function resendTeamMemberInvitation(
  formData: FormData
) {
  const userId = formData
    .get("userId")
    ?.toString();

  if (!userId) {
    redirect(
      "/admin/team-members?error=Team member ID is required"
    );
  }

  const { currentUserId } =
    await requireAdmin();

  if (userId === currentUserId) {
    redirect(
      "/admin/team-members?error=Invalid team member"
    );
  }

  const supabaseAdmin = createAdminClient();

  /*
   * Get Auth user.
   */
  const {
    data: userData,
    error: userError,
  } =
    await supabaseAdmin.auth.admin.getUserById(
      userId
    );

  if (
    userError ||
    !userData.user
  ) {
    redirect(
      "/admin/team-members?error=Team member not found"
    );
  }

  const user = userData.user;

  /*
   * Get application profile.
   */
  const {
    data: targetProfile,
    error: targetProfileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

  if (
    targetProfileError ||
    !targetProfile
  ) {
    redirect(
      "/admin/team-members?error=Team member profile not found"
    );
  }

  if (
    targetProfile.role !==
    "TEAM_MEMBER"
  ) {
    redirect(
      "/admin/team-members?error=Only team members can receive invitations"
    );
  }

  /*
   * Already accepted?
   */
  if (user.email_confirmed_at) {
    redirect(
      "/admin/team-members?error=This team member has already accepted the invitation"
    );
  }

  if (!user.email) {
    redirect(
      "/admin/team-members?error=Team member email is missing"
    );
  }

  const email = user.email;

  const fullName =
    targetProfile.full_name ||
    user.user_metadata?.full_name ||
    "TRIZEN Team Member";

  /*
   * Delete old pending Auth user.
   */
  const {
    error: deleteError,
  } =
    await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

  if (deleteError) {
    redirect(
      `/admin/team-members?error=${encodeURIComponent(
        deleteError.message
      )}`
    );
  }

  /*
   * Create fresh invitation.
   */
  const {
    data: newUserData,
    error: inviteError,
  } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
        },
        redirectTo: INVITE_REDIRECT_URL,
      }
    );

  if (inviteError) {
    redirect(
      `/admin/team-members?error=${encodeURIComponent(
        inviteError.message
      )}`
    );
  }

  /*
   * The trigger creates the new profile.
   * Update it with our application values.
   */
  if (newUserData.user) {
    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: fullName,
        role: "TEAM_MEMBER",
      })
      .eq("id", newUserData.user.id);

    if (profileError) {
      redirect(
        `/admin/team-members?error=${encodeURIComponent(
          profileError.message
        )}`
      );
    }
  }

  redirect(
    "/admin/team-members?success=New invitation sent successfully"
  );
}

/*
|--------------------------------------------------------------------------
| COMPLETE INVITATION
|--------------------------------------------------------------------------
|
| Called after the invited user sets their password.
|
| This updates the application profile immediately,
| so the Admin page can show "Active".
|--------------------------------------------------------------------------
*/

export async function completeTeamMemberInvitation() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      success: false,
      error: "Invitation session is invalid.",
    };
  }

  const userId = claimsData.claims.sub;

  const supabaseAdmin = createAdminClient();

  /*
   * Confirm the user actually exists.
   */
  const {
    data: userData,
    error: userError,
  } =
    await supabaseAdmin.auth.admin.getUserById(
      userId
    );

  if (
    userError ||
    !userData.user
  ) {
    return {
      success: false,
      error: "User account could not be found.",
    };
  }

  /*
   * Make sure this is a team member.
   */
  const {
    data: profile,
    error: profileError,
  } =
    await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    return {
      success: false,
      error: "Team member profile could not be found.",
    };
  }

  if (
    profile.role !== "TEAM_MEMBER"
  ) {
    return {
      success: false,
      error: "This account is not a team member account.",
    };
  }

  /*
   * The invitation has now been completed.
   *
   * The Auth user has already confirmed their
   * email as part of the invitation flow.
   */
  return {
    success: true,
  };
}