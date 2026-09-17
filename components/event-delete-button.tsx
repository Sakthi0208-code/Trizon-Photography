"use client";

import { useState } from "react";

type EventDeleteButtonProps = {
  eventId: string;
  eventName: string;
};

export default function EventDeleteButton({
  eventId,
  eventName,
}: EventDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      `Delete "${eventName}"?\n\nThis will permanently delete the event, its assignments, galleries, gallery selections, photo metadata, and stored event photos. This action cannot be undone.`
    );

    if (!confirmed) {
      event.preventDefault();
      return;
    }

    setDeleting(true);
  }

  return (
    <form
      action="/api/events/delete"
      method="POST"
      onSubmit={handleSubmit}
    >
      <input
        type="hidden"
        name="event_id"
        value={eventId}
      />

      <button
        type="submit"
        disabled={deleting}
        className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-3 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete Event"}
      </button>
    </form>
  );
}