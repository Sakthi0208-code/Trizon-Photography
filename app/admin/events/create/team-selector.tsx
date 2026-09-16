"use client";

import { useMemo, useState } from "react";

type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  confirmed: boolean;
};

type Props = {
  teamMembers: TeamMember[];
};

export default function TeamSelector({
  teamMembers,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [
    selectedMembers,
    setSelectedMembers,
  ] = useState<string[]>([]);

  const filteredMembers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return teamMembers;
      }

      return teamMembers.filter(
        (member) =>
          member.full_name
            .toLowerCase()
            .includes(query) ||
          (member.email ?? "")
            .toLowerCase()
            .includes(query)
      );
    }, [search, teamMembers]);

  function toggleMember(
    id: string
  ) {
    setSelectedMembers(
      (current) =>
        current.includes(id)
          ? current.filter(
              (memberId) =>
                memberId !== id
            )
          : [
              ...current,
              id,
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

  function clearSelection() {
    setSelectedMembers([]);
  }

  return (
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
            These are the real Team Members from your database.
          </p>

        </div>

        <p className="text-sm text-zinc-500">
          <span className="text-white">
            {selectedMembers.length}
          </span>{" "}
          selected
        </p>

      </div>

      <input
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        placeholder="Search team members..."
        className="mt-6 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
      />

      <div className="mt-3 flex gap-2">

        <button
          type="button"
          onClick={selectAll}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:text-white"
        >
          Select Available
        </button>

        <button
          type="button"
          onClick={clearSelection}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:text-white"
        >
          Clear
        </button>

      </div>

      <div className="mt-6 space-y-3">

        {filteredMembers.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">

            <p className="text-sm text-zinc-500">
              No Team Members found.
            </p>

          </div>
        ) : (
          filteredMembers.map(
            (member) => {
              const selected =
                selectedMembers.includes(
                  member.id
                );

              return (
                <label
                  key={member.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                    member.confirmed
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  } ${
                    selected
                      ? "border-white/20 bg-white/[0.07]"
                      : "border-white/[0.07] bg-black"
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
                          "No email"}
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
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${
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
        )}

      </div>

    </section>
  );
}