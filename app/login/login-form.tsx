"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { login } from "./actions";

interface LoginFormProps {
  error?: string;
}

export default function LoginForm({ error }: LoginFormProps) {
  return (
    <main className="flex min-h-screen bg-[#050505] text-white">
      {/* Left panel */}
      <div className="hidden flex-1 flex-col justify-between border-r border-white/[0.07] p-10 lg:flex">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.28em]"
        >
          TRIZEN
        </Link>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-600">
            Event Photography Platform
          </p>

          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
            Everything from
            <br />
            <span className="text-zinc-500">
              capture to delivery.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-6 text-zinc-600">
            Manage events, collaborate with your photography team,
            curate photographs and deliver secure client galleries.
          </p>
        </div>

        <p className="text-xs text-zinc-700">
          © Trizen
        </p>
      </div>

      {/* Login panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Link
              href="/"
              className="text-lg font-semibold tracking-[0.28em]"
            >
              TRIZEN
            </Link>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-zinc-600">
            Internal Access
          </p>

          <h2 className="mt-3 text-3xl font-semibold">
            Sign in to Trizen
          </h2>

          <p className="mt-3 text-sm text-zinc-500">
            Sign in with your authorized team account.
          </p>

          {/* Error message */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Login form */}
          <form
            action={login}
            className="mt-9 space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-zinc-400"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/30"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm text-zinc-400"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs text-zinc-600 transition hover:text-zinc-300"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/30"
              />
            </div>

            {/* Sign in */}
            <button
              type="submit"
              className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Sign In →
            </button>
          </form>

          {/* Customer information */}
          <div className="mt-8 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
            <p className="text-xs leading-5 text-zinc-600">
              Customers don't need an account. Use your gallery
              link and PIN to access a published gallery.
            </p>
          </div>

          {/* Back */}
          <Link
            href="/"
            className="mt-8 block text-center text-sm text-zinc-600 transition hover:text-white"
          >
            ← Back to Trizen
          </Link>
        </motion.div>
      </div>
    </main>
  );
}