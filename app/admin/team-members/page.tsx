import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  inviteTeamMember,
  deleteTeamMember,
  resendTeamMemberInvitation,
} from "./actions";

export default async function TeamMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;

  /*
   * Verify current session.
   */
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    redirect("/login");
  }

  const currentUserId =
    claimsData.claims.sub;

  /*
   * Verify ADMIN role.
   */
  const {
    data: currentProfile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", currentUserId)
    .single();

  if (
    profileError ||
    !currentProfile ||
    currentProfile.role !== "ADMIN"
  ) {
    redirect("/admin");
  }

  /*
   * Admin client is SERVER ONLY.
   *
   * Used here to retrieve Auth information such as:
   * - email
   * - email_confirmed_at
   * - last_sign_in_at
   */
  const supabaseAdmin = createAdminClient();

  const {
    data: usersData,
    error: usersError,
  } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (usersError) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-semibold">
          Team Members
        </h1>

        <p className="mt-4 text-red-400">
          Unable to load team members:{" "}
          {usersError.message}
        </p>
      </main>
    );
  }

  /*
   * Get all team-member profiles.
   */
  const {
    data: profiles,
    error: profilesError,
  } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, role, created_at"
    )
    .eq("role", "TEAM_MEMBER")
    .order("created_at", {
      ascending: false,
    });

  if (profilesError) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-semibold">
          Team Members
        </h1>

        <p className="mt-4 text-red-400">
          Unable to load team profiles:{" "}
          {profilesError.message}
        </p>
      </main>
    );
  }

  /*
   * Combine profiles + Auth users.
   */
  const teamMembers =
    (profiles ?? [])
      .map((profile) => {
        const authUser =
          usersData.users.find(
            (user) =>
              user.id === profile.id
          );

        if (!authUser) {
          return null;
        }

        const isActive =
          Boolean(
            authUser.email_confirmed_at
          );

        return {
          id: profile.id,
          fullName: profile.full_name,
          email:
            authUser.email ??
            "No email",
          createdAt:
            profile.created_at,
          isActive,
          emailConfirmedAt:
            authUser.email_confirmed_at,
          lastSignInAt:
            authUser.last_sign_in_at,
        };
      })
      .filter(
        (
          member
        ): member is NonNullable<
          typeof member
        > => Boolean(member)
      );

  return (
    <main className="p-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">
          Team Members
        </h1>

        <p className="mt-2 text-zinc-500">
          Manage your photography team.
        </p>
      </div>

      {/* MESSAGES */}
      {params.error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {params.error}
        </div>
      )}

      {params.success && (
        <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {params.success}
        </div>
      )}

      {/* INVITE */}
      <section className="mt-10 max-w-xl">
        <h2 className="text-xl font-medium">
          Add Team Member
        </h2>

        <form
          action={inviteTeamMember}
          className="mt-5 space-y-4"
        >
          <input
            name="fullName"
            type="text"
            required
            placeholder="Full name"
            className="w-full rounded-lg border border-white/10 bg-black p-3 text-white outline-none focus:border-white/30"
          />

          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="w-full rounded-lg border border-white/10 bg-black p-3 text-white outline-none focus:border-white/30"
          />

          <button
            type="submit"
            className="rounded-lg bg-white px-5 py-3 text-black transition hover:bg-zinc-200"
          >
            Send Invitation
          </button>
        </form>
      </section>

      {/* TEAM */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">
              Current Team
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {teamMembers.length}{" "}
              {teamMembers.length === 1
                ? "member"
                : "members"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {teamMembers.map(
            (member) => (
              <div
                key={member.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* MEMBER INFORMATION */}
                  <div>
                    <p className="text-lg font-medium text-white">
                      {member.fullName}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {member.email}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {/* STATUS */}
                      {member.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-yellow-400" />
                          Pending Invitation
                        </span>
                      )}

                      <span className="text-xs text-zinc-600">
                        Team Member
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2">
                    {/* RESEND */}
                    {!member.isActive && (
                      <form
                        action={
                          resendTeamMemberInvitation
                        }
                      >
                        <input
                          type="hidden"
                          name="userId"
                          value={member.id}
                        />

                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
                        >
                          Resend Invitation
                        </button>
                      </form>
                    )}

                    {/* DELETE */}
                    <form
                      action={
                        deleteTeamMember
                      }
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={member.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          )}

          {teamMembers.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-zinc-400">
                No team members yet.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Send your first invitation above.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}