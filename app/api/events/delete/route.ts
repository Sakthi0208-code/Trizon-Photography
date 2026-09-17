import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "event-photos";
const STORAGE_DELETE_CHUNK_SIZE = 1000;

function redirectWithError(
  request: NextRequest,
  eventId: string,
  message: string
) {
  return NextResponse.redirect(
    new URL(
      `/admin/events/${eventId}?error=${encodeURIComponent(
        message
      )}`,
      request.url
    )
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );
    }

    // =========================================================
    // ADMIN CHECK
    // =========================================================

    const admin =
      createAdminClient();

    const {
      data: profile,
      error: profileError,
    } =
      await admin
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(
          "/team-member",
          request.url
        )
      );
    }

    // =========================================================
    // FORM DATA
    // =========================================================

    const formData =
      await request.formData();

    const eventId =
      formData
        .get("event_id")
        ?.toString()
        .trim();

    if (!eventId) {
      return NextResponse.redirect(
        new URL(
          "/admin/events?error=Event ID is required",
          request.url
        )
      );
    }

    // =========================================================
    // VERIFY EVENT
    // =========================================================

    const {
      data: event,
      error: eventError,
    } =
      await admin
        .from("events")
        .select(
          "id, name"
        )
        .eq(
          "id",
          eventId
        )
        .single();

    if (
      eventError ||
      !event
    ) {
      return redirectWithError(
        request,
        eventId,
        "Event not found."
      );
    }

    // =========================================================
    // LOAD STORAGE PATHS
    //
    // We collect them before deleting the database records
    // because the photo rows will be removed through the
    // event's cascading relationships.
    // =========================================================

    const {
      data: photos,
      error: photosError,
    } =
      await admin
        .from("photos")
        .select(
          "storage_path"
        )
        .eq(
          "event_id",
          eventId
        );

    if (photosError) {
      console.error(
        "Failed to load event photos before deletion:",
        photosError
      );

      return redirectWithError(
        request,
        eventId,
        "Failed to prepare event deletion."
      );
    }

    const storagePaths =
      (photos ?? [])
        .map(
          (photo) =>
            photo.storage_path
        )
        .filter(
          (
            path
          ): path is string =>
            typeof path ===
              "string" &&
            path.length > 0
        );

    // =========================================================
    // DELETE EVENT
    //
    // The database schema uses cascading foreign keys for:
    // - event_members
    // - photos
    // - galleries
    //
    // gallery_photos are also removed through their
    // relationships.
    // =========================================================

    const {
      error: deleteEventError,
    } =
      await admin
        .from("events")
        .delete()
        .eq(
          "id",
          eventId
        );

    if (deleteEventError) {
      console.error(
        "Event deletion error:",
        deleteEventError
      );

      return redirectWithError(
        request,
        eventId,
        deleteEventError.message ||
          "Failed to delete event."
      );
    }

    // =========================================================
    // REMOVE STORED PHOTOS
    //
    // Supabase Storage deletion is handled after the database
    // deletion. If storage cleanup fails, the event is still
    // successfully deleted, but the error is logged.
    // =========================================================

    let storageCleanupFailed =
      false;

    if (
      storagePaths.length > 0
    ) {
      for (
        let start = 0;
        start <
        storagePaths.length;
        start +=
          STORAGE_DELETE_CHUNK_SIZE
      ) {
        const chunk =
          storagePaths.slice(
            start,
            start +
              STORAGE_DELETE_CHUNK_SIZE
          );

        const {
          error: storageError,
        } =
          await admin.storage
            .from(
              STORAGE_BUCKET
            )
            .remove(chunk);

        if (storageError) {
          storageCleanupFailed =
            true;

          console.error(
            "Failed to remove some event photos from storage:",
            storageError
          );

          break;
        }
      }
    }

    // =========================================================
    // REDIRECT
    // =========================================================

    const eventName =
      encodeURIComponent(
        event.name
      );

    const targetUrl =
      `/admin/events?deleted=${eventName}`;

    const response =
      NextResponse.redirect(
        new URL(
          storageCleanupFailed
            ? `${targetUrl}&storageWarning=1`
            : targetUrl,
          request.url
        )
      );

    return response;
  } catch (error) {
    console.error(
      "Delete event API error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        `/admin/events?error=${encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Unexpected error while deleting event."
        )}`,
        request.url
      )
    );
  }
}