"use client";

import { useState } from "react";
import { completeInvitation } from "./actions";

type Props = {
  tokenHash?: string;
  error?: string;
};

export default function AcceptInviteForm({
  tokenHash,
  error: initialError,
}: Props) {
  const [error, setError] =
    useState(initialError || "");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
   * No token = invalid invitation.
   */
  if (!tokenHash) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            TRIZEN
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            Invitation unavailable
          </h1>

          <p className="mt-4 text-zinc-500">
            This invitation link is invalid or
            has already been used.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          TRIZEN
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          Complete your account
        </h1>

        <p className="mt-3 text-zinc-500">
          You've been invited to join the
          TRIZEN photography team.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          action={async (formData) => {
            setLoading(true);
            setError("");

            await completeInvitation(
              formData
            );
          }}
          className="mt-8 space-y-5"
        >
          <input
            type="hidden"
            name="token_hash"
            value={tokenHash}
          />

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Confirm password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Activating account..."
              : "Activate account"}
          </button>
        </form>
      </div>
    </main>
  );
}