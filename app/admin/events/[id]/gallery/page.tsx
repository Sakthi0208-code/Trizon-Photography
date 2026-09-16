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

  const { data: galleries } = await admin
    .from("galleries")
    .select(`
      id,
      event_id,
      customer_name,
      public_token,
      published,
      created_at,
      events (
        name,
        event_date
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Customer Access
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Galleries
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage published customer galleries.
            </p>
          </div>

          <span className="text-sm text-zinc-600">
            {galleries?.length ?? 0} galleries
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {galleries && galleries.length > 0 ? (
            galleries.map((gallery) => {
              const eventValue = gallery.events;

              const event = Array.isArray(eventValue)
                ? eventValue[0]
                : eventValue;

              return (
                <div
                  key={gallery.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-medium">
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

                      <p className="mt-2 text-sm text-zinc-500">
                        {event?.name ?? "Unknown event"}
                      </p>

                      {event?.event_date && (
                        <p className="mt-1 text-xs text-zinc-700">
                          {event.event_date}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/gallery/${gallery.public_token}`}
                        target="_blank"
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 hover:border-white/20 hover:text-white"
                      >
                        Open Gallery
                      </Link>
                    </div>
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
                Create a gallery from an event after selecting photos.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}