import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Photo = {
  id: string;
  file_name: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
};

export default async function AdminPhotosPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // -----------------------------
  // 1. Authentication
  // -----------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // -----------------------------
  // 2. ADMIN role check
  // -----------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  // -----------------------------
  // 3. Get event
  // -----------------------------
  const { data: event, error: eventError } =
    await supabase
      .from("events")
      .select(`
        id,
        name,
        description,
        event_date,
        location,
        status
      `)
      .eq("id", id)
      .single();

  if (eventError || !event) {
    notFound();
  }

  // -----------------------------
  // 4. Get all photos
  // -----------------------------
  const { data: photosData, error: photosError } =
    await supabase
      .from("photos")
      .select(`
        id,
        file_name,
        storage_path,
        uploaded_by,
        created_at
      `)
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

  if (photosError) {
    console.error(
      "Failed to load photos:",
      photosError
    );
  }

  const photos: Photo[] =
    (photosData as Photo[] | null) ?? [];

  // -----------------------------
  // 5. Generate private signed URLs
  // -----------------------------
  const admin = createAdminClient();

  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await admin.storage
        .from("event-photos")
        .createSignedUrl(
          photo.storage_path,
          60 * 60
        );

      if (signedUrlError) {
        console.error(
          `Signed URL failed for ${photo.file_name}:`,
          signedUrlError
        );

        return {
          ...photo,
          signedUrl: null,
        };
      }

      return {
        ...photo,
        signedUrl:
          signedUrlData?.signedUrl ?? null,
      };
    })
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-8 py-12">

        {/* Back */}
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to Event
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-600">
              Photo Review
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              {event.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
              <span>
                {event.event_date}
              </span>

              {event.location && (
                <>
                  <span>•</span>
                  <span>
                    {event.location}
                  </span>
                </>
              )}

              <span>•</span>

              <span>
                {photosWithUrls.length} photos
              </span>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.15em] text-zinc-400">
            Administrator
          </div>
        </div>

        {/* Review Controls */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-lg font-medium">
                Review uploaded photos
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Select the photos you want to include in the
                customer gallery.
              </p>
            </div>

            <Link
              href={`/admin/events/${event.id}/gallery/create`}
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Create Customer Gallery
            </Link>
          </div>
        </div>

        {/* Photo Grid */}
        {photosWithUrls.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {photosWithUrls.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-square bg-zinc-900">
                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt={photo.file_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-red-400">
                      Image unavailable
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {photo.file_name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Uploaded{" "}
                    {new Date(
                      photo.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <p className="text-lg font-medium">
              No photos uploaded yet
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Team Members need to upload photos before they can
              be reviewed.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}