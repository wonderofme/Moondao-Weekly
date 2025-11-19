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
    <div className="relative min-h-screen overflow-hidden">
      {/* MoonDAO gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1e1b4b] to-[#312e81]" />
      
      {/* Organic shape overlay similar to MoonDAO proposal pages */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-800/20 to-purple-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-900/25 to-blue-900/25 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-10 shadow-2xl backdrop-blur-xl">
          {/* MoonDAO branding */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-2xl">🌙</span>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-300 font-semibold">
              MoonDAO Weekly
            </p>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight sm:text-6xl bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Get Weekly MoonDAO Summaries
          </h1>
          <p className="mt-4 text-xl text-blue-100/90">
            AI-powered recaps of the Town Hall, straight to your inbox. Never
            miss a mission update again.
          </p>

          <div className="mt-8 rounded-2xl border border-orange-500/60 bg-gradient-to-r from-orange-500/20 to-orange-600/10 px-6 py-4 text-orange-100">
            <p className="text-base font-semibold tracking-wide flex items-center gap-2">
              <span className="text-orange-400">⚠️</span>
              CHECK YOUR <span className="text-orange-200 font-bold">SPAM</span> FOLDER
            </p>
            <p className="mt-2 text-sm leading-6 text-orange-50/90">
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
              className="w-full rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-4 text-base text-white placeholder:text-white/60 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-base font-semibold text-white transition hover:from-blue-600 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? "Joining..." : "Subscribe"}
            </button>
          </form>

          <p
            className="mt-4 text-sm text-blue-200/80"
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
