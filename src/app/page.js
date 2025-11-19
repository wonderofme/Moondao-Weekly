"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const isLoading = status.state === "loading";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus({ state: "error", message: "Please enter a valid email." });
      return;
    }

    setStatus({ state: "loading", message: "Adding you to the crew..." });

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "We hit a snag. Try again soon.");
      }

      setStatus({
        state: "success",
        message:
          data?.message ||
          "Success! You're on the list. Check your inbox—and the spam folder—for the verification email and upcoming summaries.",
      });
      setEmail("");
    } catch (error) {
      setStatus({
        state: "error",
        message: error.message || "Something went wrong.",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.28)_1px,_transparent_1px)] bg-[length:5rem_5rem] opacity-25" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            MoonDAO Weekly
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Get Weekly MoonDAO Summaries.
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            AI-powered recaps of the Town Hall, straight to your inbox. Never
            miss a mission update again.
          </p>

          <div className="mt-8 rounded-2xl border border-yellow-400/60 bg-yellow-500/10 px-6 py-4 text-yellow-100">
            <p className="text-base font-semibold tracking-wide">
              CHECK YOUR <span className="text-yellow-200">SPAM</span> FOLDER 🚨
            </p>
            <p className="mt-2 text-sm leading-6">
              At this stage of the project, verification emails and weekly summaries
              will most likely land in SPAM—grab them and move us to your main
              inbox.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="your-email@domain.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-slate-900/80 px-6 py-4 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-400 px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Joining..." : "Subscribe"}
            </button>
          </form>

          <p
            className="mt-4 text-sm text-slate-400"
            aria-live="polite"
            role="status"
          >
            {status.state === "idle" &&
              "A free community project. No spam, ever. Unsubscribe anytime from any summary email."}
            {status.state === "loading" && status.message}
            {status.state === "success" && status.message}
            {status.state === "error" && status.message}
          </p>
        </section>
      </main>
    </div>
  );
}
