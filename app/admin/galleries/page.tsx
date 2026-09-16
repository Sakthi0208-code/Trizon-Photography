import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminGalleriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  const admin = createAdminClient();

  const {
    data: galleriesData,
    error,
  } = await admin
    .from("galleries")
    .select(`
      id,
      event_id,
      customer_name,
      public_token,
      pin,
      published,
      created_at,
      events (
        id,
        name,
        event_date,
        location
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load galleries:", error);
  }

  const galleries = galleriesData ?? [];

  return (
    <main className="min-h-screen bg-[#07090c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Customer Access
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Galleries
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Create, edit and manage customer galleries.
            </p>
          </div>

          <p className="text-sm text-zinc-600">
            {galleries.length}{" "}
            {galleries.length === 1
              ? "gallery"
              : "galleries"}
          </p>
        </div>

        {/* Gallery list */}
        <div className="mt-8 space-y-5">
          {galleries.length > 0 ? (
            galleries.map((gallery) => {
              const eventValue = gallery.events;

              const event = Array.isArray(eventValue)
                ? eventValue[0]
                : eventValue;

              return (
                <div
                  key={gallery.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6 transition hover:border-white/[0.14]"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row">
                    <div className="min-w-0 flex-1">

                      {/* Name */}
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-medium">
                          {gallery.customer_name}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                            gallery.published
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {gallery.published
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>

                      {/* Event */}
                      <p className="mt-2 text-sm text-zinc-400">
                        {event?.name ?? "Unknown event"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {event?.event_date ?? ""}

                        {event?.location
                          ? ` · ${event.location}`
                          : ""}
                      </p>

                      {/* PIN */}
                      <div className="mt-5 rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.035] p-5">
                        <div className="flex items-center justify-between gap-5">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-500/70">
                              Customer PIN
                            </p>

                            <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.3em] text-white">
                              {gallery.pin ?? "Unavailable"}
                            </p>
                          </div>

                          <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/[0.05] text-yellow-400 sm:flex">
                            #
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-zinc-600">
                          Keep this PIN with the customer gallery URL.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex content-start flex-wrap gap-3">
                      <Link
                        href={`/admin/events/${gallery.event_id}/gallery/create?galleryId=${gallery.id}`}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 hover:border-white/20 hover:text-white"
                      >
                        Edit
                      </Link>

                      {gallery.published && (
                        <Link
                          href={`/gallery/${gallery.public_token}`}
                          target="_blank"
                          className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-zinc-200"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* URL */}
                  <div className="mt-6 border-t border-white/[0.07] pt-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                      Customer URL
                    </p>

                    <p className="mt-2 break-all text-sm text-zinc-400">
                      /gallery/
                      {gallery.public_token}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-lg font-medium">
                No galleries yet
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Open an event and create a customer gallery.
              </p>

              <Link
                href="/admin/events"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
              >
                Go to Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}