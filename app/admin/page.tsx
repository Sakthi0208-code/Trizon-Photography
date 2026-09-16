import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Event = {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
};

type Photo = {
  id: string;
  event_id: string;
};

type Gallery = {
  id: string;
  event_id: string;
  published: boolean;
};

type GalleryPhoto = {
  gallery_id: string;
  photo_id: string;
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  const admin = createAdminClient();

  // =========================================================
  // RUN IN PARALLEL
  // =========================================================

  const [
    eventsResult,
    photosResult,
    galleriesResult,
    galleryPhotosResult,
    totalEventsResult,
    publishedGalleriesResult,
  ] = await Promise.all([
    admin
      .from("events")
      .select(`
        id,
        name,
        event_date,
        location,
        status,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    admin
      .from("photos")
      .select("id, event_id"),

    admin
      .from("galleries")
      .select("id, event_id, published"),

    admin
      .from("gallery_photos")
      .select("gallery_id, photo_id"),

    admin
      .from("events")
      .select("id", {
        count: "exact",
        head: true,
      }),

    admin
      .from("galleries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("published", true),
  ]);

  const events =
    (eventsResult.data as Event[] | null) ?? [];

  const photos =
    (photosResult.data as Photo[] | null) ?? [];

  const galleries =
    (galleriesResult.data as Gallery[] | null) ?? [];

  const galleryPhotos =
    (galleryPhotosResult.data as GalleryPhoto[] | null) ?? [];

  // =========================================================
  // TOTALS
  // =========================================================

  const totalEvents =
    totalEventsResult.count ?? 0;

  const totalPhotos =
    photos.length;

  const publishedGalleries =
    publishedGalleriesResult.count ?? 0;

  // =========================================================
  // COUNTS IN MEMORY
  // =========================================================

  const photoCountByEvent =
    new Map<string, number>();

  for (const photo of photos) {
    photoCountByEvent.set(
      photo.event_id,
      (photoCountByEvent.get(
        photo.event_id
      ) ?? 0) + 1
    );
  }

  const galleryCountByEvent =
    new Map<string, number>();

  const publishedGalleryCountByEvent =
    new Map<string, number>();

  for (const gallery of galleries) {
    galleryCountByEvent.set(
      gallery.event_id,
      (galleryCountByEvent.get(
        gallery.event_id
      ) ?? 0) + 1
    );

    if (gallery.published) {
      publishedGalleryCountByEvent.set(
        gallery.event_id,
        (publishedGalleryCountByEvent.get(
          gallery.event_id
        ) ?? 0) + 1
      );
    }
  }

  const galleryToEvent =
    new Map<string, string>();

  for (const gallery of galleries) {
    galleryToEvent.set(
      gallery.id,
      gallery.event_id
    );
  }

  const selectedCountByEvent =
    new Map<string, number>();

  for (const item of galleryPhotos) {
    const eventId =
      galleryToEvent.get(
        item.gallery_id
      );

    if (!eventId) continue;

    selectedCountByEvent.set(
      eventId,
      (selectedCountByEvent.get(
        eventId
      ) ?? 0) + 1
    );
  }

  const totalSelected =
    galleryPhotos.length;

  const selectionRate =
    totalPhotos > 0
      ? Math.round(
          (totalSelected /
            totalPhotos) *
            100
        )
      : 0;

  // =========================================================
  // EVENT STATS
  // =========================================================

  const eventsWithStats =
    events.map((event) => ({
      ...event,

      photoCount:
        photoCountByEvent.get(
          event.id
        ) ?? 0,

      selectedCount:
        selectedCountByEvent.get(
          event.id
        ) ?? 0,

      galleryCount:
        galleryCountByEvent.get(
          event.id
        ) ?? 0,

      publishedGalleryCount:
        publishedGalleryCountByEvent.get(
          event.id
        ) ?? 0,
    }));

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101317] p-7 md:p-9">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.04] blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-600">
                Overview
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Welcome, {profile.full_name}.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                Manage events, photographers, photo selection and customer galleries.
              </p>
            </div>

            <Link
              href="/admin/events/create"
              className="inline-flex w-fit rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              + Create Event
            </Link>

          </div>

        </section>

        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardStat
            label="Total Events"
            value={totalEvents}
          />

          <DashboardStat
            label="Photos Uploaded"
            value={totalPhotos}
          />

          <DashboardStat
            label="Photos Selected"
            value={totalSelected}
            footer={`${selectionRate}% selection rate`}
          />

          <DashboardStat
            label="Published Galleries"
            value={publishedGalleries}
          />

        </section>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mt-6 grid gap-4 lg:grid-cols-3">

          <QuickAction
            href="/admin/events/create"
            icon="+"
            title="Create Event"
            description="Start a new photography project"
          />

          <QuickAction
            href="/admin/team-members"
            icon="♙"
            title="Manage Team"
            description="Assign photographers to events"
          />

          <QuickAction
            href="/admin/galleries"
            icon="▧"
            title="Manage Galleries"
            description="View customer galleries and PINs"
          />

        </section>

        {/* =====================================================
            RECENT EVENTS
        ====================================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
                Workspace
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Recent Events
              </h2>
            </div>

            <Link
              href="/admin/events"
              className="text-xs text-zinc-600 hover:text-white"
            >
              View all →
            </Link>

          </div>

          <div className="mt-6 space-y-4">

            {eventsWithStats.map(
              (event) => {
                let statusLabel: string =
                  event.status;

                if (
                  event.publishedGalleryCount >
                  0
                ) {
                  statusLabel =
                    "Published";
                } else if (
                  event.selectedCount > 0
                ) {
                  statusLabel =
                    "Ready to Publish";
                } else if (
                  event.photoCount > 0
                ) {
                  statusLabel =
                    "Needs Review";
                }

                return (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#101317] p-5 transition hover:border-white/[0.14]"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="truncate text-lg font-medium">
                            {event.name}
                          </h3>

                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
                            {statusLabel}
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

                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-7">

                        <MiniStat
                          label="Photos"
                          value={event.photoCount}
                        />

                        <MiniStat
                          label="Selected"
                          value={event.selectedCount}
                        />

                        <MiniStat
                          label="Galleries"
                          value={event.galleryCount}
                        />

                        <Link
                          href={`/admin/events/${event.id}`}
                          className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 hover:border-white/20 hover:text-white"
                        >
                          Manage →
                        </Link>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

      </div>
    </main>
  );
}

function DashboardStat({
  label,
  value,
  footer,
}: {
  label: string;
  value: number;
  footer?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

      <p className="text-xs text-zinc-600">
        {label}
      </p>

      <p className="mt-4 text-3xl font-semibold">
        {value}
      </p>

      {footer ? (
        <p className="mt-2 text-xs text-zinc-700">
          {footer}
        </p>
      ) : (
        <div className="mt-2 h-4" />
      )}

    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-[65px] text-right">

      <p className="text-[10px] uppercase tracking-wider text-zinc-700">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>

    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/[0.08] bg-[#101317] p-5 transition hover:border-white/[0.16] hover:bg-[#13171b]"
    >
      <div className="flex items-center gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-200">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium">
            {title}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {description}
          </p>
        </div>

      </div>
    </Link>
  );
}