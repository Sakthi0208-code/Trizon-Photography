"use client";

import { useState } from "react";

import { createEvent } from "./actions";

type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  confirmed: boolean;
};

type Props = {
  teamMembers: TeamMember[];
  error?: string;
};

export default function EventCreateForm({
  teamMembers,
  error,
}: Props) {
  const [
    selectedMembers,
    setSelectedMembers,
  ] = useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const filteredMembers =
    teamMembers.filter(
      (member) => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          member.full_name
            .toLowerCase()
            .includes(query) ||
          (member.email ?? "")
            .toLowerCase()
            .includes(query)
        );
      }
    );

  function toggleMember(
    memberId: string
  ) {
    setSelectedMembers(
      (current) =>
        current.includes(
          memberId
        )
          ? current.filter(
              (id) =>
                id !== memberId
            )
          : [
              ...current,
              memberId,
            ]
    );
  }

  function selectAll() {
    setSelectedMembers(
      filteredMembers
        .filter(
          (member) =>
            member.confirmed
        )
        .map(
          (member) =>
            member.id
        )
    );
  }

  function clearAll() {
    setSelectedMembers([]);
  }

  return (
    <form
      action={createEvent}
      className="space-y-8"
    >

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* =====================================================
          EVENT INFORMATION
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6 md:p-7">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
            Event Information
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Create a photography event
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Enter the basic details for this photography project.
          </p>
        </div>

        <div className="mt-7 grid gap-5">

          {/* Event name */}
          <div>
            <label
              htmlFor="name"
              className="text-sm text-zinc-300"
            >
              Event name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Sakthi & Kaviya Event"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
            />
          </div>

          {/* Date / Location */}
          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label
                htmlFor="event_date"
                className="text-sm text-zinc-300"
              >
                Event date
              </label>

              <input
                id="event_date"
                name="event_date"
                type="date"
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="text-sm text-zinc-300"
              >
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Coimbatore"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
              />
            </div>

          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="text-sm text-zinc-300"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Describe the photography project..."
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
            />
          </div>

        </div>

      </section>

      {/* =====================================================
          TEAM
      ====================================================== */}

      <section className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6 md:p-7">

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
              Photography Team
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Assign photographers
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Only assigned team members will be able to view and upload photos for this event.
            </p>

          </div>

          <div className="text-sm text-zinc-500">
            <span className="text-white">
              {selectedMembers.length}
            </span>{" "}
            selected
          </div>

        </div>

        {/* Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search team members..."
            className="flex-1 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
          />

          <button
            type="button"
            onClick={selectAll}
            className="rounded-xl border border-white/10 px-4 py-3 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Select Available
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-white/10 px-4 py-3 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Clear
          </button>

        </div>

        {/* Team members */}
        {teamMembers.length > 0 ? (
          <div className="mt-6 space-y-3">

            {filteredMembers.length > 0 ? (
              filteredMembers.map(
                (member) => {

                  const selected =
                    selectedMembers.includes(
                      member.id
                    );

                  return (
                    <label
                      key={member.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                        selected
                          ? "border-white/20 bg-white/[0.07]"
                          : "border-white/[0.07] bg-black hover:border-white/[0.14]"
                      } ${
                        !member.confirmed
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                          {member.full_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-white">
                            {member.full_name}
                          </p>

                          <p className="mt-1 truncate text-xs text-zinc-600">
                            {member.email ??
                              "Team Member"}
                          </p>

                          {!member.confirmed && (
                            <p className="mt-1 text-[10px] text-yellow-500/70">
                              Invitation pending
                            </p>
                          )}

                        </div>

                      </div>

                      <div className="ml-4 shrink-0">

                        <input
                          type="checkbox"
                          name="team_member_ids"
                          value={member.id}
                          checked={selected}
                          disabled={
                            !member.confirmed
                          }
                          onChange={() =>
                            toggleMember(
                              member.id
                            )
                          }
                          className="sr-only"
                        />

                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                            selected
                              ? "border-white bg-white text-black"
                              : "border-white/15 text-transparent"
                          }`}
                        >
                          ✓
                        </div>

                      </div>

                    </label>
                  );
                }
              )
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No team members match your search.
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">

            <p className="text-sm text-zinc-500">
              No Team Members are available.
            </p>

            <p className="mt-2 text-xs text-zinc-700">
              Invite a Team Member before creating this event.
            </p>

          </div>
        )}

        {/* hidden selected IDs are provided by the checkboxes */}

      </section>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">

        <a
          href="/admin/events"
          className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          Cancel
        </a>

        <button
          type="submit"
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Create Event →
        </button>

      </div>

    </form>
  );
}