import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type TeamMember = {
  id: string;
  full_name: string;
  role: string;
};

type Photo = {
  id: string;
  file_name: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
};

type Gallery = {
  id: string;
  event_id: string;
  customer_name: string;
  public_token: string;
  pin: string | null;
  published: boolean;
  created_at: string;
};

export default async function AdminEventDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

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
  // EVENT
  // =========================================================

  const {
    data: event,
    error: eventError,
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
    .eq("id", id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // =========================================================
  // TEAM MEMBERS
  // =========================================================

  const { data: assignments } =
    await admin
      .from("event_members")
      .select("user_id")
      .eq("event_id", id);

  const assignedUserIds =
    assignments?.map(
      (item) => item.user_id
    ) ?? [];

  let teamMembers: TeamMember[] = [];

  if (assignedUserIds.length > 0) {
    const { data: members } =
      await admin
        .from("profiles")
        .select(
          "id, full_name, role"
        )
        .in(
          "id",
          assignedUserIds
        )
        .eq(
          "role",
          "TEAM_MEMBER"
        );

    teamMembers =
      (members ?? []) as TeamMember[];
  }

  // =========================================================
  // PHOTOS
  // =========================================================

  const {
    data: photosData,
    error: photosError,
  } = await admin
    .from("photos")
    .select(`
      id,
      file_name,
      storage_path,
      uploaded_by,
      created_at
    `)
    .eq(
      "event_id",
      id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (photosError) {
    console.error(
      "Failed to load photos:",
      photosError
    );
  }

  const photos: Photo[] =
    (photosData as Photo[] | null) ??
    [];

  const totalPhotos =
    photos.length;

  // =========================================================
  // ALL GALLERIES
  // =========================================================

  const {
    data: galleriesData,
    error: galleriesError,
  } = await admin
    .from("galleries")
    .select(`
      id,
      event_id,
      customer_name,
      public_token,
      pin,
      published,
      created_at
    `)
    .eq(
      "event_id",
      id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (galleriesError) {
    console.error(
      "Failed to load galleries:",
      galleriesError
    );
  }

  const galleries: Gallery[] =
    (galleriesData as Gallery[] | null) ??
    [];

  // =========================================================
  // SELECTED PHOTO COUNT
  // =========================================================

  let selectedPhotoCount = 0;

  if (galleries.length > 0) {
    const galleryIds =
      galleries.map(
        (gallery) => gallery.id
      );

    const { count } =
      await admin
        .from("gallery_photos")
        .select(
          "photo_id",
          {
            count: "exact",
            head: true,
          }
        )
        .in(
          "gallery_id",
          galleryIds
        );

    selectedPhotoCount =
      count ?? 0;
  }

  // =========================================================
  // GALLERY STATS
  // =========================================================

  const publishedGalleryCount =
    galleries.filter(
      (gallery) =>
        gallery.published
    ).length;

  const draftGalleryCount =
    galleries.filter(
      (gallery) =>
        !gallery.published
    ).length;

  const photosUploaded =
    totalPhotos > 0;

  const photosCurated =
    selectedPhotoCount > 0;

  // =========================================================
  // WORKFLOW
  // =========================================================

  let workflowProgress = 25;

  if (photosUploaded) {
    workflowProgress = 50;
  }

  if (photosCurated) {
    workflowProgress = 75;
  }

  if (publishedGalleryCount > 0) {
    workflowProgress = 100;
  }

  // =========================================================
  // SIGNED URLS
  // =========================================================

  const recentPhotos =
    photos.slice(0, 4);

  const recentPhotosWithUrls =
    await Promise.all(
      recentPhotos.map(
        async (photo) => {
          const {
            data,
            error,
          } = await admin.storage
            .from(
              "event-photos"
            )
            .createSignedUrl(
              photo.storage_path,
              60 * 60
            );

          return {
            ...photo,
            signedUrl:
              error
                ? null
                : data?.signedUrl ??
                  null,
          };
        }
      )
    );

  return (
    <main className="min-h-screen bg-[#07090c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* ===================================================
            BACK
        ==================================================== */}

        <Link
          href="/admin/events"
          className="text-xs text-zinc-600 hover:text-white"
        >
          ← Back to events
        </Link>

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="mt-8 flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end">

          <div>

            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Event
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              {event.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-5 text-xs text-zinc-500">

              <span>
                {event.event_date}
              </span>

              {event.location && (
                <span>
                  {event.location}
                </span>
              )}

              <span>
                {teamMembers.length}{" "}
                {teamMembers.length === 1
                  ? "photographer"
                  : "photographers"}
              </span>

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href={`/admin/events/${event.id}/photos`}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:border-white/20 hover:text-white"
            >
              Review Photos
            </Link>

            <Link
              href={`/admin/events/${event.id}/gallery/create`}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              + Create Gallery
            </Link>

          </div>

        </div>

        {/* ===================================================
            STATUS
        ==================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">

          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-zinc-400">
            {event.status}
          </span>

          {publishedGalleryCount > 0 && (
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-green-400">
              {publishedGalleryCount} Published
            </span>
          )}

          {draftGalleryCount > 0 && (
            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-yellow-400">
              {draftGalleryCount} Draft
            </span>
          )}

        </div>

        {/* ===================================================
            DETAILS + STATS
        ==================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">

          <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Event Details
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              {event.name}
            </h2>

            {event.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                {event.description}
              </p>
            ) : (
              <p className="mt-4 text-sm text-zinc-600">
                No event description provided.
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">

                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Event Date
                </p>

                <p className="mt-2 text-sm font-medium">
                  {event.event_date}
                </p>

              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">

                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Location
                </p>

                <p className="mt-2 text-sm font-medium">
                  {event.location ||
                    "Not specified"}
                </p>

              </div>

            </div>

          </div>

          <div className="space-y-4">

            <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

              <p className="text-xs text-zinc-600">
                Uploaded photos
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {totalPhotos}
              </p>

            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

              <p className="text-xs text-zinc-600">
                Selected photos
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {selectedPhotoCount}
              </p>

            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

              <p className="text-xs text-zinc-600">
                Customer galleries
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {galleries.length}
              </p>

              <p className="mt-2 text-xs text-zinc-700">
                {publishedGalleryCount} published
                {draftGalleryCount > 0
                  ? ` · ${draftGalleryCount} draft`
                  : ""}
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            WORKFLOW
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Workflow
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Photography progress
              </h2>

            </div>

            <span className="text-xs text-zinc-600">
              {workflowProgress}%
            </span>

          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white"
              style={{
                width: `${workflowProgress}%`,
              }}
            />
          </div>

        </section>

        {/* ===================================================
            TEAM
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Team
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Photography team
              </h2>

            </div>

            <Link
              href="/admin/team-members"
              className="text-xs text-zinc-600 hover:text-white"
            >
              Manage team →
            </Link>

          </div>

          {teamMembers.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

              {teamMembers.map(
                (member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                        {member.full_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium">
                          {member.full_name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Team Member
                        </p>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center">

              <p className="text-sm text-zinc-500">
                No photographers assigned to this event.
              </p>

            </div>
          )}

        </section>

        {/* ===================================================
            CUSTOMER GALLERIES
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Customer Galleries
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Galleries for this event
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Each customer can have a separate gallery.
              </p>

            </div>

            <Link
              href={`/admin/events/${event.id}/gallery/create`}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              + Create New Gallery
            </Link>

          </div>

          {galleries.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {galleries.map(
                (gallery) => (
                  <div
                    key={gallery.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0b0d10] p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="truncate text-lg font-medium">
                          {gallery.customer_name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          Created{" "}
                          {new Date(
                            gallery.created_at
                          ).toLocaleDateString()}
                        </p>

                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
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

                    {/* PIN */}
                    <div className="mt-5 rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.035] p-5">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-500/70">
                        Customer PIN
                      </p>

                      <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.3em] text-white">
                        {gallery.pin ??
                          "Unavailable"}
                      </p>

                    </div>

                    {/* URL */}
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                        Customer URL
                      </p>

                      <p className="mt-2 break-all text-xs text-zinc-500">
                        /gallery/
                        {gallery.public_token}
                      </p>

                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap gap-2">

                      <Link
                        href={`/admin/events/${event.id}/gallery/create?galleryId=${gallery.id}`}
                        className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-300 hover:border-white/20 hover:text-white"
                      >
                        Edit Gallery
                      </Link>

                      {gallery.published && (
                        <Link
                          href={`/gallery/${gallery.public_token}`}
                          target="_blank"
                          className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-black hover:bg-zinc-200"
                        >
                          Open Gallery
                        </Link>
                      )}

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">

              <p className="text-sm text-zinc-500">
                No galleries created for this event yet.
              </p>

              <Link
                href={`/admin/events/${event.id}/gallery/create`}
                className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
              >
                Create First Gallery
              </Link>

            </div>
          )}

        </section>

        {/* ===================================================
            RECENT PHOTOS
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Photos
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Recent uploads
              </h2>

            </div>

            {totalPhotos > 0 && (
              <Link
                href={`/admin/events/${event.id}/photos`}
                className="text-xs text-zinc-600 hover:text-white"
              >
                Review all →
              </Link>
            )}

          </div>

          {recentPhotosWithUrls.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

              {recentPhotosWithUrls.map(
                (photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black"
                  >

                    <div className="aspect-square bg-zinc-900">

                      {photo.signedUrl ? (
                        <img
                          src={photo.signedUrl}
                          alt={photo.file_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          Image unavailable
                        </div>
                      )}

                    </div>

                    <div className="p-3">

                      <p className="truncate text-xs text-zinc-300">
                        {photo.file_name}
                      </p>

                      <p className="mt-1 text-[10px] text-zinc-600">
                        {new Date(
                          photo.created_at
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center">

              <p className="text-sm text-zinc-500">
                No photos have been uploaded yet.
              </p>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}