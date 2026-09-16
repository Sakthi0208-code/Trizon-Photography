import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import GalleryCreateForm from "./gallery-create-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    galleryId?: string;
  }>;
};

type Photo = {
  id: string;
  file_name: string;
  storage_path: string;
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

export default async function CreateGalleryPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

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
      .select("role")
      .eq("id", user.id)
      .single();

  if (
    !profile ||
    profile.role !== "ADMIN"
  ) {
    redirect("/team-member");
  }

  const admin = createAdminClient();

  // =========================================================
  // EVENT
  // =========================================================

  const { data: event } =
    await admin
      .from("events")
      .select(`
        id,
        name,
        event_date,
        location,
        description
      `)
      .eq("id", id)
      .single();

  if (!event) {
    notFound();
  }

  // =========================================================
  // ALL GALLERIES
  // =========================================================

  const { data: galleryData } =
    await admin
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
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

  const galleries =
    (galleryData as Gallery[] | null) ??
    [];

  // =========================================================
  // PHOTOS
  // =========================================================

  const { data: photosData } =
    await admin
      .from("photos")
      .select(`
        id,
        file_name,
        storage_path,
        created_at
      `)
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

  const photos: Photo[] =
    (photosData as Photo[] | null) ??
    [];

  // =========================================================
  // SIGNED URLS
  // =========================================================

  const photosWithUrls =
    await Promise.all(
      photos.map(
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

  // =========================================================
  // EDIT MODE
  // =========================================================

  let editingGallery:
    | Gallery
    | null = null;

  let existingSelectedPhotoIds:
    string[] = [];

  if (query.galleryId) {
    const {
      data: gallery,
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
      .eq("id", query.galleryId)
      .eq("event_id", id)
      .single();

    if (gallery) {
      editingGallery =
        gallery as Gallery;

      const {
        data: selectedPhotos,
      } = await admin
        .from("gallery_photos")
        .select("photo_id")
        .eq(
          "gallery_id",
          gallery.id
        );

      existingSelectedPhotoIds =
        selectedPhotos?.map(
          (item) =>
            item.photo_id
        ) ?? [];
    }
  }

  return (
    <main className="min-h-screen bg-[#07090c] text-white">

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        <Link
          href={`/admin/events/${event.id}`}
          className="text-xs text-zinc-600 hover:text-white"
        >
          ← Back to Event
        </Link>

        <div className="mt-8 border-b border-white/[0.08] pb-8">

          <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
            Customer Galleries
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            {editingGallery
              ? "Edit Gallery"
              : "Gallery Management"}
          </h1>

          <p className="mt-2 text-zinc-500">
            {event.name}
          </p>

        </div>

        {/* Existing gallery chooser */}
        {!editingGallery && (
          <section className="mt-8">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                  Existing Galleries
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Choose an action
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Edit an existing gallery or create a new one.
                </p>
              </div>

              <Link
                href={`/admin/events/${event.id}/gallery/create`}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                + New Gallery
              </Link>

            </div>

            {galleries.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {galleries.map(
                  (gallery) => (
                    <div
                      key={gallery.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#101317] p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="truncate text-lg font-medium">
                            {gallery.customer_name}
                          </h3>

                          <p className="mt-2 text-xs text-zinc-600">
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

                      <div className="mt-5 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.03] p-4">

                        <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-500/70">
                          Customer PIN
                        </p>

                        <p className="mt-2 font-mono text-xl font-semibold tracking-[0.25em]">
                          {gallery.pin ??
                            "Unavailable"}
                        </p>

                      </div>

                      <div className="mt-4 flex gap-2">

                        <Link
                          href={`/admin/events/${event.id}/gallery/create?galleryId=${gallery.id}`}
                          className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-300 hover:border-white/20 hover:text-white"
                        >
                          Edit
                        </Link>

                        {gallery.published && (
                          <Link
                            href={`/gallery/${gallery.public_token}`}
                            target="_blank"
                            className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-black hover:bg-zinc-200"
                          >
                            View
                          </Link>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">

                <p className="text-lg font-medium">
                  No galleries for this event
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Create the first customer gallery below.
                </p>

              </div>
            )}

          </section>
        )}

        <GalleryCreateForm
          eventId={event.id}
          eventName={event.name}
          photos={photosWithUrls}
          editingGallery={editingGallery}
          existingSelectedPhotoIds={
            existingSelectedPhotoIds
          }
        />

      </div>
    </main>
  );
}