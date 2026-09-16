import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const admin =
      createAdminClient();

    const { data: profile } =
      await admin
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      !profile ||
      profile.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only administrators can publish galleries.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const galleryId =
      body.galleryId
        ?.toString()
        .trim();

    const published =
      body.published === true;

    if (!galleryId) {
      return NextResponse.json(
        {
          error:
            "Gallery ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: gallery } =
      await admin
        .from("galleries")
        .select(
          "id, customer_name"
        )
        .eq(
          "id",
          galleryId
        )
        .single();

    if (!gallery) {
      return NextResponse.json(
        {
          error:
            "Gallery not found.",
        },
        { status: 404 }
      );
    }

    if (published) {
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
          .eq(
            "gallery_id",
            galleryId
          );

      if (!count || count < 1) {
        return NextResponse.json(
          {
            error:
              "Select at least one photo before publishing.",
          },
          { status: 400 }
        );
      }
    }

    const {
      data: updatedGallery,
      error,
    } = await admin
      .from("galleries")
      .update({
        published,
      })
      .eq(
        "id",
        galleryId
      )
      .select(`
        id,
        customer_name,
        public_token,
        pin,
        published
      `)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gallery:
        updatedGallery,
    });
  } catch (error) {
    console.error(
      "Gallery status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update gallery status.",
      },
      { status: 500 }
    );
  }
}