"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const workflow = [
  {
    number: "01",
    title: "Create",
    description:
      "The Admin creates an event and assigns the photography team.",
    icon: "＋",
  },
  {
    number: "02",
    title: "Upload",
    description:
      "Team Members collaboratively upload photographs from the event.",
    icon: "↑",
  },
  {
    number: "03",
    title: "Curate",
    description:
      "The Admin reviews the collection and selects photographs for sharing.",
    icon: "◈",
  },
  {
    number: "04",
    title: "Deliver",
    description:
      "The selected collection becomes a secure PIN-protected gallery.",
    icon: "↗",
  },
];

const features = [
  "Team collaboration",
  "Secure galleries",
  "Simple event workflow",
  "PIN-protected delivery",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[15%] top-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.04] blur-[140px]" />
        <div className="absolute right-[5%] top-[30%] h-[600px] w-[600px] rounded-full bg-violet-500/[0.035] blur-[160px]" />
      </div>

      {/* NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.28em]"
          >
            TRIZEN
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a
              href="#home"
              className="transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#features"
              className="transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#workflow"
              className="transition hover:text-white"
            >
              How it works
            </a>

            <Link
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.05]"
            >
              Sign in
            </Link>

            <Link
              href="/login"
              className="hidden rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 sm:block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-24 lg:px-8"
      >
        <div className="grid w-full items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-zinc-500">
              Event Photography Platform
            </p>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              From capture
              <br />
              <span className="text-zinc-500">to gallery.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Trizen helps photography teams manage event photographs,
              curate the final collection, and securely deliver galleries
              to their clients.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="group rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Get Started
                <span className="ml-3 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <a
                href="#workflow"
                className="rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.05]"
              >
                See how it works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-xs text-zinc-500"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[9px]">
                    ✓
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visual composition */}
          <div className="relative h-[520px]">
            {/* Main image-style panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute left-[18%] top-[7%] h-[410px] w-[55%] overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
          >
            <Image
              src="/images/wedding.jpg"
              alt="Wedding photography"
              fill
              priority
              className="object-cover"
            />

            {/* Dark cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            <div className="absolute bottom-7 left-7">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                Weddings
              </p>

              <p className="mt-2 text-2xl font-medium text-white">
                Beautiful moments.
              </p>
            </div>
          </motion.div>

            {/* Left floating card */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 5 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              className="absolute left-0 top-[23%] h-[230px] w-[37%] overflow-hidden rounded-2xl border border-white/10 shadow-xl"
            >
              <Image
                src="/images/event.jpg"
                alt="Event photography"
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute bottom-5 left-5">
                <span className="text-xs text-white/80">
                  Events
                </span>
              </div>
            </motion.div>
            {/* Right floating card */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: -5 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="absolute right-0 top-[35%] h-[220px] w-[36%] overflow-hidden rounded-2xl border border-white/10 shadow-xl"
            >
              <Image
                src="/images/corporate.jpg"
                alt="Corporate event photography"
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

              <div className="absolute bottom-5 left-5">
                <span className="text-xs text-white/80">
                  Corporate
                </span>
              </div>
            </motion.div>
            {/* Floating status */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute bottom-10 left-[12%] rounded-xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Gallery status
              </p>

              <p className="mt-1 text-sm font-medium">
                Ready to deliver
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section
        id="workflow"
        className="border-t border-white/[0.07]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              How Trizen works
            </p>

            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                One workflow.
                <br />
                From event to client.
              </h2>

              <p className="max-w-md text-sm leading-6 text-zinc-500">
                A focused workflow designed for photography teams,
                from the first upload to the final customer gallery.
              </p>
            </div>
          </motion.div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{ y: -5 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    {item.number}
                  </span>

                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-zinc-300 transition group-hover:bg-white group-hover:text-black">
                    {item.icon}
                  </span>
                </div>

                <h3 className="mt-12 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="border-t border-white/[0.07]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Built for the workflow
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight">
                Everything your photography team needs.
              </h2>

              <p className="mt-6 max-w-xl leading-7 text-zinc-500">
                Trizen keeps the entire event photography workflow
                organized in one place, without unnecessary complexity.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Collaborative uploads",
                  text: "Multiple team members can contribute photographs to an assigned event.",
                },
                {
                  title: "Photo curation",
                  text: "Admins review the complete collection and select the final photographs.",
                },
                {
                  title: "Secure delivery",
                  text: "Published galleries are protected behind a gallery-specific PIN.",
                },
                {
                  title: "No customer account",
                  text: "Customers access their gallery directly using the link and PIN.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-white/10 p-6"
                >
                  <div className="mb-8 h-2 w-2 rounded-full bg-white" />

                  <h3 className="font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {feature.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-transparent p-8 sm:p-12"
          >
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />

            <div className="relative flex flex-col justify-between gap-10 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Have questions?
                </p>

                <h2 className="mt-4 text-3xl font-semibold">
                  Let's get in touch.
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
                  Whether you're a photography team exploring Trizen
                  or a potential customer, we'd love to hear from you.
                </p>
              </div>

              <Link
                href="/contact"
                className="group inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Contact Trizen
                <span className="ml-3 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-medium tracking-[0.25em] text-zinc-400">
            TRIZEN
          </span>

          <span>
            Event Photography Platform
          </span>

          <div className="flex gap-6">
            <a
              href="#workflow"
              className="transition hover:text-white"
            >
              How it works
            </a>

            <Link
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}