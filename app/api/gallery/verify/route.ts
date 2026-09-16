import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";

function verifyPin(
  pin: string,
  storedHash: string
): boolean {
  const separator =
    storedHash.indexOf(":");

  if (separator === -1) {
    return false;
  }

  const salt =
    storedHash.slice(
      0,
      separator
    );

  const expectedHash =
    storedHash.slice(
      separator + 1
    );

  const calculatedHash =
    crypto
      .pbkdf2Sync(
        pin,
        salt,
        120000,
        64,
        "sha512"
      )
      .toString("hex");

  const actual =
    Buffer.from(
      calculatedHash,
      "hex"
    );

  const expected =
    Buffer.from(
      expectedHash,
      "hex"
    );

  if (
    actual.length !==
    expected.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    actual,
    expected
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const publicToken =
      body.publicToken
        ?.toString()
        .trim();

    const pin =
      body.pin
        ?.toString()
        .trim();

    if (!publicToken) {
      return NextResponse.json(
        {
          error:
            "Gallery token is required.",
        },
        { status: 400 }
      );
    }

    if (
      !pin ||
      !/^\d{6}$/.test(pin)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter the 6-digit gallery PIN.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: gallery,
      error:
        galleryError,
    } = await admin
      .from("galleries")
      .select(`
        id,
        event_id,
        customer_name,
        public_token,
        pin_hash,
        published
      `)
      .eq(
        "public_token",
        publicToken
      )
      .single();

    if (
      galleryError ||
      !gallery
    ) {
      return NextResponse.json(
        {
          error:
            "Gallery not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // IMPORTANT: unpublished galleries are private
    // ---------------------------------------------------------

    if (!gallery.published) {
      return NextResponse.json(
        {
          error:
            "This gallery is not published yet.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Verify PIN
    // ---------------------------------------------------------

    if (
      !verifyPin(
        pin,
        gallery.pin_hash
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Incorrect gallery PIN.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Event
    // ---------------------------------------------------------

    const { data: event } =
      await admin
        .from("events")
        .select(`
          id,
          name,
          event_date,
          location
        `)
        .eq(
          "id",
          gallery.event_id
        )
        .single();

    // ---------------------------------------------------------
    // Gallery photos
    // ---------------------------------------------------------

    const {
      data: galleryPhotos,
      error:
        galleryPhotosError,
    } = await admin
      .from("gallery_photos")
      .select("photo_id")
      .eq(
        "gallery_id",
        gallery.id
      );

    if (galleryPhotosError) {
      return NextResponse.json(
        {
          error:
            "Failed to load gallery photos.",
        },
        { status: 500 }
      );
    }

    const photoIds =
      galleryPhotos?.map(
        (item) =>
          item.photo_id
      ) ?? [];

    if (
      photoIds.length === 0
    ) {
      return NextResponse.json({
        success: true,
        customerName:
          gallery.customer_name,
        event:
          event ?? null,
        photos: [],
      });
    }

    // ---------------------------------------------------------
    // Photo metadata
    // ---------------------------------------------------------

    const {
      data: photos,
      error:
        photosError,
    } = await admin
      .from("photos")
      .select(`
        id,
        file_name,
        storage_path,
        created_at
      `)
      .in(
        "id",
        photoIds
      );

    if (photosError) {
      return NextResponse.json(
        {
          error:
            "Failed to load photos.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Signed URLs
    // ---------------------------------------------------------

    const photosWithUrls =
      await Promise.all(
        (photos ?? []).map(
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
              id: photo.id,
              file_name:
                photo.file_name,
              created_at:
                photo.created_at,
              signedUrl:
                error
                  ? null
                  : data?.signedUrl ??
                    null,
            };
          }
        )
      );

    return NextResponse.json({
      success: true,
      customerName:
        gallery.customer_name,
      event:
        event ?? null,
      photos:
        photosWithUrls,
    });
  } catch (error) {
    console.error(
      "Gallery verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open gallery.",
      },
      { status: 500 }
    );
  }
}