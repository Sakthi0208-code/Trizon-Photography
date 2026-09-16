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
      return NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
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
      return NextResponse.redirect(
        new URL(
          "/team-member",
          request.url
        )
      );
    }

    const formData =
      await request.formData();

    const name =
      formData
        .get("name")
        ?.toString()
        .trim();

    const eventDate =
      formData
        .get("event_date")
        ?.toString()
        .trim();

    const location =
      formData
        .get("location")
        ?.toString()
        .trim();

    const description =
      formData
        .get("description")
        ?.toString()
        .trim();

    const teamMemberIds = [
      ...new Set(
        formData
          .getAll(
            "team_member_ids"
          )
          .map((value) =>
            value.toString()
          )
          .filter(Boolean)
      ),
    ];

    if (!name) {
      return NextResponse.redirect(
        new URL(
          "/admin/events/create?error=Event name is required",
          request.url
        )
      );
    }

    if (!eventDate) {
      return NextResponse.redirect(
        new URL(
          "/admin/events/create?error=Event date is required",
          request.url
        )
      );
    }

    // Validate selected users
    if (
      teamMemberIds.length > 0
    ) {
      const {
        data: validMembers,
      } = await admin
        .from("profiles")
        .select("id, role")
        .in(
          "id",
          teamMemberIds
        )
        .eq(
          "role",
          "TEAM_MEMBER"
        );

      const validIds =
        new Set(
          (validMembers ?? []).map(
            (member) =>
              member.id
          )
        );

      const invalid =
        teamMemberIds.some(
          (id) =>
            !validIds.has(id)
        );

      if (invalid) {
        return NextResponse.redirect(
          new URL(
            "/admin/events/create?error=Invalid team member selected",
            request.url
          )
        );
      }
    }

    // Create event
    const {
      data: event,
      error: eventError,
    } = await admin
      .from("events")
      .insert({
        name,
        description:
          description || null,
        event_date:
          eventDate,
        location:
          location || null,
        status:
          "DRAFT",
        created_by:
          user.id,
      })
      .select("id")
      .single();

    if (
      eventError ||
      !event
    ) {
      console.error(
        "Event creation error:",
        eventError
      );

      return NextResponse.redirect(
        new URL(
          `/admin/events/create?error=${encodeURIComponent(
            eventError?.message ??
              "Failed to create event"
          )}`,
          request.url
        )
      );
    }

    // Assign team
    if (
      teamMemberIds.length >
      0
    ) {
      const rows =
        teamMemberIds.map(
          (userId) => ({
            event_id:
              event.id,
            user_id:
              userId,
          })
        );

      const {
        error:
          assignmentError,
      } = await admin
        .from("event_members")
        .insert(rows);

      if (assignmentError) {
        console.error(
          "Assignment error:",
          assignmentError
        );

        await admin
          .from("events")
          .delete()
          .eq(
            "id",
            event.id
          );

        return NextResponse.redirect(
          new URL(
            `/admin/events/create?error=${encodeURIComponent(
              "Failed to assign team members"
            )}`,
            request.url
          )
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        `/admin/events/${event.id}`,
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Create event API error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        `/admin/events/create?error=${encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Unexpected error"
        )}`,
        request.url
      )
    );
  }
}