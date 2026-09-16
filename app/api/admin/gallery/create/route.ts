import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePin(): string {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

function hashPin(pin: string): string {
  const salt = crypto
    .randomBytes(16)
    .toString("hex");

  const hash = crypto
    .pbkdf2Sync(
      pin,
      salt,
      120000,
      64,
      "sha512"
    )
    .toString("hex");

  return `${salt}:${hash}`;
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Only administrators can manage galleries.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const eventId = body.eventId
      ?.toString()
      .trim();

    const customerName = body.customerName
      ?.toString()
      .trim();

    const galleryId =
      body.galleryId
        ?.toString()
        .trim() || null;

    // Normalize photo IDs into a real string[]
    const photoIds: string[] =
      Array.isArray(body.photoIds)
        ? Array.from(
            new Set(
              body.photoIds.filter(
                (
                  id: unknown
                ): id is string =>
                  typeof id === "string" &&
                  id.trim().length > 0
              )
            )
          )
        : [];

    if (!eventId) {
      return NextResponse.json(
        {
          error: "Event ID is required.",
        },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        {
          error:
            "Customer name is required.",
        },
        { status: 400 }
      );
    }

    if (photoIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Select at least one photo.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Verify event
    // ---------------------------------------------------------

    const { data: event } = await admin
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        {
          error: "Event not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Verify selected photos
    // ---------------------------------------------------------

    const { data: photos } = await admin
      .from("photos")
      .select("id")
      .eq("event_id", eventId)
      .in("id", photoIds);

    if (
      !photos ||
      photos.length !== photoIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected photos do not belong to this event.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // EDIT EXISTING GALLERY
    // =========================================================

    if (galleryId) {
      const {
        data: existingGallery,
        error: existingGalleryError,
      } = await admin
        .from("galleries")
        .select(`
          id,
          event_id,
          customer_name,
          public_token,
          pin,
          published
        `)
        .eq("id", galleryId)
        .eq("event_id", eventId)
        .single();

      if (
        existingGalleryError ||
        !existingGallery
      ) {
        return NextResponse.json(
          {
            error: "Gallery not found.",
          },
          { status: 404 }
        );
      }

      const { error: updateError } =
        await admin
          .from("galleries")
          .update({
            customer_name: customerName,
          })
          .eq("id", galleryId);

      if (updateError) {
        return NextResponse.json(
          {
            error: updateError.message,
          },
          { status: 500 }
        );
      }

      // Replace gallery photos
      const { error: removeError } =
        await admin
          .from("gallery_photos")
          .delete()
          .eq("gallery_id", galleryId);

      if (removeError) {
        return NextResponse.json(
          {
            error: removeError.message,
          },
          { status: 500 }
        );
      }

      const rows = photoIds.map(
        (photoId) => ({
          gallery_id: galleryId,
          photo_id: photoId,
        })
      );

      const { error: insertError } =
        await admin
          .from("gallery_photos")
          .insert(rows);

      if (insertError) {
        return NextResponse.json(
          {
            error: insertError.message,
          },
          { status: 500 }
        );
      }

      const siteUrl =
        process.env
          .NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";

      return NextResponse.json({
        success: true,
        mode: "updated",
        galleryId: existingGallery.id,
        customerName,
        publicToken:
          existingGallery.public_token,
        pin: existingGallery.pin,
        published:
          existingGallery.published,
        url:
          `${siteUrl}/gallery/${existingGallery.public_token}`,
        selectedPhotos:
          photoIds.length,
      });
    }

    // =========================================================
    // CREATE NEW GALLERY
    // =========================================================

    const publicToken =
      crypto
        .randomBytes(24)
        .toString("hex");

    const pin = generatePin();

    const pinHash = hashPin(pin);

    const {
      data: gallery,
      error: galleryError,
    } = await admin
      .from("galleries")
      .insert({
        event_id: eventId,
        customer_name:
          customerName,
        public_token:
          publicToken,
        pin,
        pin_hash: pinHash,
        published: false,
      })
      .select(`
        id,
        event_id,
        customer_name,
        public_token,
        pin,
        published
      `)
      .single();

    if (
      galleryError ||
      !gallery
    ) {
      return NextResponse.json(
        {
          error:
            galleryError?.message ??
            "Failed to create gallery.",
        },
        { status: 500 }
      );
    }

    const rows = photoIds.map(
      (photoId) => ({
        gallery_id: gallery.id,
        photo_id: photoId,
      })
    );

    const {
      error: galleryPhotosError,
    } = await admin
      .from("gallery_photos")
      .insert(rows);

    if (galleryPhotosError) {
      await admin
        .from("galleries")
        .delete()
        .eq("id", gallery.id);

      return NextResponse.json(
        {
          error:
            galleryPhotosError.message,
        },
        { status: 500 }
      );
    }

    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    return NextResponse.json({
      success: true,
      mode: "created",
      galleryId: gallery.id,
      customerName:
        gallery.customer_name,
      publicToken:
        gallery.public_token,
      pin: gallery.pin,
      published: false,
      url:
        `${siteUrl}/gallery/${gallery.public_token}`,
      selectedPhotos:
        photoIds.length,
    });
  } catch (error) {
    console.error(
      "Gallery create error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected gallery error.",
      },
      { status: 500 }
    );
  }
}