import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import TeamSelector from "./team-selector";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CreateEventPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  const admin = createAdminClient();

  // =========================================================
  // LOAD REAL TEAM MEMBERS FROM DATABASE
  // =========================================================

  const {
    data: teamProfiles,
    error: teamError,
  } = await admin
    .from("profiles")
    .select(`
      id,
      full_name,
      role
    `)
    .eq("role", "TEAM_MEMBER")
    .order("full_name", {
      ascending: true,
    });

  if (teamError) {
    console.error(
      "Failed to load team members:",
      teamError
    );
  }

  // =========================================================
  // LOAD AUTH EMAIL + CONFIRMATION STATUS
  // =========================================================

  const {
    data: authData,
    error: authError,
  } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (authError) {
    console.error(
      "Failed to load auth users:",
      authError
    );
  }

  const authMap = new Map<
    string,
    {
      email: string | null;
      confirmed: boolean;
    }
  >();

  for (const authUser of authData?.users ?? []) {
    authMap.set(authUser.id, {
      email:
        authUser.email ?? null,

      confirmed:
        Boolean(
          authUser.email_confirmed_at
        ),
    });
  }

  const teamMembers =
    (teamProfiles ?? []).map(
      (member) => {
        const auth =
          authMap.get(member.id);

        return {
          id: member.id,
          full_name:
            member.full_name,
          email:
            auth?.email ?? null,
          confirmed:
            auth?.confirmed ?? false,
        };
      }
    );

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <Link
          href="/admin/events"
          className="text-xs text-zinc-600 transition hover:text-white"
        >
          ← Back to Events
        </Link>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
            Workspace
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Create Event
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Create a photography event and assign real Team Members from your TRIZEN workspace.
          </p>
        </div>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {params.error}
          </div>
        )}

        {/* ===================================================
            EVENT INFORMATION
        ==================================================== */}

        <form
          action="/api/admin/events/create"
          method="POST"
          className="mt-8 space-y-6"
        >

          <section className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6 md:p-7">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
              Event Information
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Photography Project
            </h2>

            <div className="mt-7 space-y-5">

              <div>
                <label
                  htmlFor="name"
                  className="text-sm text-zinc-300"
                >
                  Event name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Arjun & Priya Wedding"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="event_date"
                    className="text-sm text-zinc-300"
                  >
                    Event date
                  </label>

                  <input
                    id="event_date"
                    name="event_date"
                    type="date"
                    required
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="text-sm text-zinc-300"
                  >
                    Location
                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Coimbatore"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
                  />
                </div>

              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-sm text-zinc-300"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Add notes about this event..."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
                />
              </div>

            </div>

          </section>

          {/* =================================================
              REAL TEAM MEMBERS
          ================================================== */}

          <TeamSelector
            teamMembers={
              teamMembers
            }
          />

          {/* =================================================
              ACTIONS
          ================================================== */}

          <div className="flex justify-end gap-3">

            <Link
              href="/admin/events"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-400 hover:border-white/20 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Create Event →
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}