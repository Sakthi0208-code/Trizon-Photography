import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function TeamMemberDashboard() {
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

  if (
    !profile ||
    profile.role !== "TEAM_MEMBER"
  ) {
    redirect("/admin");
  }

  const { data: assignments } =
    await supabase
      .from("event_members")
      .select(`
        event_id,
        assigned_at,
        events (
          id,
          name,
          description,
          event_date,
          location,
          status
        )
      `)
      .eq("user_id", user.id)
      .order("assigned_at", {
        ascending: false,
      });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-8 py-12">

        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          Team Member Workspace
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          Welcome, {profile.full_name}
        </h1>

        <p className="mt-3 text-zinc-500">
          View your assigned photography events and upload photos.
        </p>

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Workspace
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Your Assigned Events
              </h2>
            </div>

            <p className="text-sm text-zinc-500">
              {assignments?.length ?? 0} events
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {assignments &&
            assignments.length > 0 ? (
              assignments.map(
                (assignment) => {
                  const eventValue =
                    assignment.events;

                  const event =
                    Array.isArray(eventValue)
                      ? eventValue[0]
                      : eventValue;

                  if (!event) {
                    return null;
                  }

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div>
                          <h3 className="text-xl font-medium">
                            {event.name}
                          </h3>

                          <p className="mt-2 text-sm text-zinc-500">
                            {event.event_date}

                            {event.location
                              ? ` · ${event.location}`
                              : ""}
                          </p>

                          {event.description && (
                            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <a
                          href={`/team-member/events/${event.id}`}
                          className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                        >
                          View Event
                        </a>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <h3 className="text-lg font-medium">
                  No events assigned yet
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Your administrator will assign photography events
                  to you.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}