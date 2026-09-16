import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Event = {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  created_at: string;
};

type EventWithStats = Event & {
  photoCount: number;
  selectedCount: number;
};

export default async function AdminEventsPage() {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // ADMIN CHECK
  // =========================================================

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  // =========================================================
  // ADMIN CLIENT
  // =========================================================

  const admin = createAdminClient();

  // =========================================================
  // LOAD REAL EVENTS
  // =========================================================

  const {
    data: eventsData,
    error: eventsError,
  } = await admin
    .from("events")
    .select(`
      id,
      name,
      description,
      event_date,
      location,
      status,
      created_at
    `)
    .order("event_date", {
      ascending: false,
    });

  if (eventsError) {
    console.error(
      "Failed to load events:",
      eventsError
    );
  }

  const events =
    (eventsData as Event[] | null) ?? [];

  // =========================================================
  // LOAD STATS
  // =========================================================

  const eventsWithStats: EventWithStats[] =
    await Promise.all(
      events.map(async (event) => {
        const {
          count: photoCount,
        } = await admin
          .from("photos")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("event_id", event.id);

        /*
         * Selected photos are stored through
         * gallery_photos.
         */
        const {
          data: galleries,
        } = await admin
          .from("galleries")
          .select("id")
          .eq("event_id", event.id);

        let selectedCount = 0;

        if (
          galleries &&
          galleries.length > 0
        ) {
          const galleryIds =
            galleries.map(
              (gallery) => gallery.id
            );

          const {
            count,
          } = await admin
            .from("gallery_photos")
            .select("photo_id", {
              count: "exact",
              head: true,
            })
            .in(
              "gallery_id",
              galleryIds
            );

          selectedCount =
            count ?? 0;
        }

        return {
          ...event,
          photoCount:
            photoCount ?? 0,
          selectedCount,
        };
      })
    );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Workspace
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Events
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage photography projects from creation to delivery.
            </p>
          </div>

          <Link
            href="/admin/events/create"
            className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            + Create Event
          </Link>

        </div>

        {/* =====================================================
            EVENTS
        ====================================================== */}

        <section className="mt-8">

          {eventsWithStats.length > 0 ? (
            <div className="space-y-4">

              {eventsWithStats.map(
                (event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-white/20"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                      {/* Event information */}
                      <div className="flex min-w-0 items-center gap-5">

                        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-[10px] uppercase tracking-wider text-zinc-600">
                          Event Photo
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-3">

                            <h2 className="truncate text-lg font-semibold">
                              {event.name}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                                event.status ===
                                "ACTIVE"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : event.status ===
                                      "COMPLETED"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-white/10 text-zinc-400"
                              }`}
                            >
                              {event.status}
                            </span>

                          </div>

                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-600">

                            <span>
                              {event.event_date}
                            </span>

                            {event.location && (
                              <span>
                                {event.location}
                              </span>
                            )}

                            <span>
                              {event.photoCount}{" "}
                              {event.photoCount === 1
                                ? "photo"
                                : "photos"}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* Stats + action */}
                      <div className="flex items-center justify-between gap-8 lg:justify-end">

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-700">
                            Selected
                          </p>

                          <p className="mt-1 text-sm">
                            {event.selectedCount}
                          </p>
                        </div>

                        {/* THIS IS THE IMPORTANT FIX */}
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                        >
                          Manage →
                        </Link>

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">

              <p className="text-lg font-medium">
                No events yet
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Create your first photography event.
              </p>

              <Link
                href="/admin/events/create"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Create Event
              </Link>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}