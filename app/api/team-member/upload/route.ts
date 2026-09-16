import crypto from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "event-photos";

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const MAX_FILES = 50;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(
  request: NextRequest
) {
  try {
    // =======================================================
    // 1. AUTHENTICATED USER
    // =======================================================

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Please log in again.",
        },
        { status: 401 }
      );
    }

    // =======================================================
    // 2. SERVER-ONLY ADMIN CLIENT
    // =======================================================

    const admin =
      createAdminClient();

    // =======================================================
    // 3. VERIFY TEAM MEMBER
    // =======================================================

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, full_name, role"
      )
      .eq(
        "id",
        user.id
      )
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !==
        "TEAM_MEMBER"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have Team Member upload permission.",
        },
        { status: 403 }
      );
    }

    // =======================================================
    // 4. READ MULTIPART FORM
    // =======================================================

    const formData =
      await request.formData();

    const eventId =
      formData
        .get("event_id")
        ?.toString()
        .trim();

    const files = formData
      .getAll("files")
      .filter(
        (value): value is File =>
          value instanceof File &&
          value.size > 0
      );

    if (!eventId) {
      return NextResponse.json(
        {
          error:
            "Event ID is required.",
        },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            "Please select at least one image.",
        },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          error:
            `You can upload a maximum of ${MAX_FILES} photos at once.`,
        },
        { status: 400 }
      );
    }

    // =======================================================
    // 5. VERIFY EVENT
    // =======================================================

    const {
      data: event,
      error: eventError,
    } = await admin
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
      return NextResponse.json(
        {
          error:
            "Event not found.",
        },
        { status: 404 }
      );
    }

    // =======================================================
    // 6. VERIFY EVENT ASSIGNMENT
    // =======================================================

    const {
      data: assignment,
      error:
        assignmentError,
    } = await admin
      .from("event_members")
      .select(
        "event_id, user_id"
      )
      .eq(
        "event_id",
        eventId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (assignmentError) {
      console.error(
        "Assignment lookup error:",
        assignmentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify event assignment.",
        },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to this event.",
        },
        { status: 403 }
      );
    }

    // =======================================================
    // 7. VALIDATE ALL FILES BEFORE UPLOADING
    // =======================================================

    for (const file of files) {
      if (
        !ALLOWED_TYPES.has(
          file.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              `${file.name} is not supported. ` +
              "Only JPG, PNG and WebP images are allowed.",
          },
          { status: 400 }
        );
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              `${file.name} is larger than 20 MB.`,
          },
          { status: 400 }
        );
      }
    }

    // =======================================================
    // 8. TRACK UPLOADS FOR ROLLBACK
    // =======================================================

    const uploadedPhotos: Array<{
      id: string;
      file_name: string;
      storage_path: string;
      file_size: number;
    }> = [];

    // =======================================================
    // 9. UPLOAD EACH FILE
    // =======================================================

    for (const file of files) {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const storagePath =
        `${eventId}/${user.id}/${crypto.randomUUID()}.${extension}`;

      // -------------------------------------------------------
      // Upload to Storage
      // -------------------------------------------------------

      const arrayBuffer =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );

      const {
        error:
          storageError,
      } = await admin.storage
        .from(
          BUCKET_NAME
        )
        .upload(
          storagePath,
          buffer,
          {
            contentType:
              file.type,
            upsert: false,
          }
        );

      if (storageError) {
        console.error(
          "Storage upload error:",
          storageError
        );

        // Rollback previous uploads
        await rollbackUploads(
          admin,
          uploadedPhotos
        );

        return NextResponse.json(
          {
            error:
              `Failed to upload ${file.name}: ${storageError.message}`,
          },
          { status: 500 }
        );
      }

      // -------------------------------------------------------
      // Save database metadata
      // -------------------------------------------------------

      const {
        data: photo,
        error:
          photoError,
      } = await admin
        .from("photos")
        .insert({
          event_id:
            eventId,

          uploaded_by:
            user.id,

          storage_path:
            storagePath,

          file_name:
            file.name,

          file_size:
            file.size,
        })
        .select(
          `
            id,
            file_name,
            storage_path,
            file_size
          `
        )
        .single();

      if (
        photoError ||
        !photo
      ) {
        console.error(
          "Photo metadata error:",
          photoError
        );

        // Remove current Storage object
        await admin.storage
          .from(
            BUCKET_NAME
          )
          .remove([
            storagePath,
          ]);

        // Rollback previous uploads
        await rollbackUploads(
          admin,
          uploadedPhotos
        );

        return NextResponse.json(
          {
            error:
              `Failed to save ${file.name}: ${
                photoError?.message ??
                "Unknown database error."
              }`,
          },
          { status: 500 }
        );
      }

      uploadedPhotos.push({
        id: photo.id,
        file_name:
          photo.file_name,
        storage_path:
          photo.storage_path,
        file_size:
          photo.file_size,
      });
    }

    // =======================================================
    // 10. SUCCESS
    // =======================================================

    return NextResponse.json({
      success: true,

      event: {
        id: event.id,
        name: event.name,
      },

      uploaded:
        uploadedPhotos.length,

      photos:
        uploadedPhotos,
    });
  } catch (error) {
    console.error(
      "Unexpected photo upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected upload error.",
      },
      { status: 500 }
    );
  }
}

// ===========================================================
// ROLLBACK HELPER
// ===========================================================

async function rollbackUploads(
  admin: ReturnType<
    typeof createAdminClient
  >,
  uploadedPhotos: Array<{
    id: string;
    storage_path: string;
  }>
) {
  if (
    uploadedPhotos.length ===
    0
  ) {
    return;
  }

  const storagePaths =
    uploadedPhotos.map(
      (photo) =>
        photo.storage_path
    );

  const photoIds =
    uploadedPhotos.map(
      (photo) =>
        photo.id
    );

  await admin.storage
    .from(BUCKET_NAME)
    .remove(storagePaths);

  await admin
    .from("photos")
    .delete()
    .in(
      "id",
      photoIds
    );
}