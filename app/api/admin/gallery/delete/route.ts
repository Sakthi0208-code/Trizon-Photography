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
            "Only administrators can delete galleries.",
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

    if (!galleryId) {
      return NextResponse.json(
        {
          error:
            "Gallery ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: gallery,
      error:
        galleryLookupError,
    } = await admin
      .from("galleries")
      .select(
        "id, customer_name"
      )
      .eq(
        "id",
        galleryId
      )
      .single();

    if (
      galleryLookupError ||
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

    const {
      error:
        relationshipError,
    } = await admin
      .from("gallery_photos")
      .delete()
      .eq(
        "gallery_id",
        galleryId
      );

    if (relationshipError) {
      return NextResponse.json(
        {
          error:
            relationshipError.message,
        },
        { status: 500 }
      );
    }

    const {
      error: deleteError,
    } = await admin
      .from("galleries")
      .delete()
      .eq(
        "id",
        galleryId
      );

    if (deleteError) {
      return NextResponse.json(
        {
          error:
            deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted:
        gallery.customer_name,
    });
  } catch (error) {
    console.error(
      "Delete gallery error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete gallery.",
      },
      { status: 500 }
    );
  }
}