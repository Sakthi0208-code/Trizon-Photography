"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.28em]"
          >
            TRIZEN
          </Link>

          <Link
            href="/"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Contact Trizen
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
            Let's talk
            <br />
            <span className="text-zinc-500">
              photography.
            </span>
          </h1>

          <p className="mt-7 max-w-lg leading-7 text-zinc-500">
            Interested in using Trizen for your photography team?
            Send us a message and we'll get back to you.
          </p>

          <div className="mt-10 space-y-5 text-sm">
            <div>
              <p className="text-zinc-600">Email</p>
              <p className="mt-1 text-zinc-300">
                talent@trizen-ai.com
              </p>
            </div>

            <div>
              <p className="text-zinc-600">Platform</p>
              <p className="mt-1 text-zinc-300">
                Event Photography Management
              </p>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-7 sm:p-9"
        >
          {submitted ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20">
                ✓
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                Message received
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                Thank you for reaching out to Trizen.
              </p>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-7 text-sm text-zinc-300 underline underline-offset-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                Send us a message
              </h2>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Name
                  </label>

                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/30"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Email
                  </label>

                  <input
                    required
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/30"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Message
                  </label>

                  <textarea
                    required
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/30"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Send Message →
                </button>
              </div>
            </>
          )}
        </motion.form>
      </div>
    </main>
  );
}