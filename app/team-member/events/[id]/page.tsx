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

export default async function TeamMemberEventPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // -----------------------------
  // 1. Check authentication
  // -----------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // -----------------------------
  // 2. Check Team Member role
  // -----------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "TEAM_MEMBER") {
    redirect("/admin");
  }

  // -----------------------------
  // 3. Verify assignment
  // -----------------------------
  const { data: assignment, error: assignmentError } =
    await supabase
      .from("event_members")
      .select("event_id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (assignmentError || !assignment) {
    notFound();
  }

  // -----------------------------
  // 4. Get event
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
  // 5. Get this Team Member's photos
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
      .eq("uploaded_by", user.id)
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
  // 6. Generate signed URLs
  //    using the server-only Admin client
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
          href="/team-member"
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← My Events
        </Link>

        {/* Event Header */}
        <div className="mt-8 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-600">
              Assigned Event
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
                {event.status}
              </span>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.15em] text-zinc-400">
            Team Member
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <section className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
              Event Details
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              {event.description}
            </p>
          </section>
        )}

        {/* Upload Section */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                Photography
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Upload Photos
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Upload photos captured for this event.
              </p>
            </div>

            <Link
              href={`/team-member/events/${event.id}/upload`}
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Upload Photos
            </Link>
          </div>
        </section>

        {/* Photos */}
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                Event Photos
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Your Uploads
              </h2>
            </div>

            <p className="text-sm text-zinc-500">
              {photosWithUrls.length} photos
            </p>
          </div>

          {photosWithUrls.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photosWithUrls.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  {/* Actual image */}
                  <div className="aspect-square bg-zinc-900">
                    {photo.signedUrl ? (
                      <img
                        src={photo.signedUrl}
                        alt={photo.file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-red-400">
                        Image unavailable
                      </div>
                    )}
                  </div>

                  {/* File information */}
                  <div className="p-3">
                    <p className="truncate text-sm text-zinc-300">
                      {photo.file_name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(
                        photo.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-lg font-medium">
                No photos uploaded yet
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Upload your event photos to get started.
              </p>

              <Link
                href={`/team-member/events/${event.id}/upload`}
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Upload Photos
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}