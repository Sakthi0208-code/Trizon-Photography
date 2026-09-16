"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createEvent(
  formData: FormData
) {
  // =========================================================
  // AUTHENTICATED USER
  // =========================================================

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // ADMIN CHECK
  // =========================================================

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

  const admin =
    createAdminClient();

  // =========================================================
  // FORM DATA
  // =========================================================

  const name = formData
    .get("name")
    ?.toString()
    .trim();

  const description = formData
    .get("description")
    ?.toString()
    .trim();

  const eventDate = formData
    .get("event_date")
    ?.toString()
    .trim();

  const location = formData
    .get("location")
    ?.toString()
    .trim();

  const selectedMemberIds =
    formData
      .getAll("team_member_ids")
      .map((value) =>
        value.toString().trim()
      )
      .filter(Boolean);

  // Remove duplicates
  const uniqueMemberIds = [
    ...new Set(
      selectedMemberIds
    ),
  ];

  // =========================================================
  // VALIDATION
  // =========================================================

  if (!name) {
    redirect(
      "/admin/events/create?error=Event name is required"
    );
  }

  if (!eventDate) {
    redirect(
      "/admin/events/create?error=Event date is required"
    );
  }

  // =========================================================
  // VERIFY TEAM MEMBERS
  // =========================================================

  if (uniqueMemberIds.length > 0) {
    const {
      data: validMembers,
      error: membersError,
    } = await admin
      .from("profiles")
      .select("id, role")
      .in(
        "id",
        uniqueMemberIds
      )
      .eq(
        "role",
        "TEAM_MEMBER"
      );

    if (membersError) {
      redirect(
        `/admin/events/create?error=${encodeURIComponent(
          membersError.message
        )}`
      );
    }

    const validIds =
      new Set(
        (validMembers ?? []).map(
          (member) => member.id
        )
      );

    const hasInvalidMember =
      uniqueMemberIds.some(
        (memberId) =>
          !validIds.has(memberId)
      );

    if (hasInvalidMember) {
      redirect(
        "/admin/events/create?error=One or more selected team members are invalid"
      );
    }
  }

  // =========================================================
  // CREATE EVENT
  // =========================================================

  const {
    data: event,
    error: eventError,
  } = await admin
    .from("events")
    .insert({
      name,
      description:
        description || null,
      event_date: eventDate,
      location:
        location || null,
      status: "DRAFT",
      created_by: user.id,
    })
    .select(
      "id"
    )
    .single();

  if (
    eventError ||
    !event
  ) {
    console.error(
      "Create event error:",
      eventError
    );

    redirect(
      `/admin/events/create?error=${encodeURIComponent(
        eventError?.message ??
          "Failed to create event"
      )}`
    );
  }

  // =========================================================
  // ASSIGN TEAM MEMBERS
  // =========================================================

  if (
    uniqueMemberIds.length > 0
  ) {
    const assignments =
      uniqueMemberIds.map(
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
      .insert(assignments);

    if (assignmentError) {
      console.error(
        "Team assignment error:",
        assignmentError
      );

      // Roll back event if assignment failed.
      await admin
        .from("events")
        .delete()
        .eq(
          "id",
          event.id
        );

      redirect(
        `/admin/events/create?error=${encodeURIComponent(
          "Event created but team assignment failed. Please try again."
        )}`
      );
    }
  }

  // =========================================================
  // GO TO EVENT
  // =========================================================

  redirect(
    `/admin/events/${event.id}`
  );
}