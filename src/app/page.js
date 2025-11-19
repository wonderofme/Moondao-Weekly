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
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B19]">
      {/* Ambient red/orange glow - bottom 1/4 of background */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-[30vh] z-0">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-[#ea580c]/20 via-[#ea580c]/5 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        {/* Hero Card with Top-to-Bottom Gradient: Lighter Blue/Purple to Darker Blue */}
        <section className="rounded-2xl bg-gradient-to-b from-[#4f46e5] to-[#0f172a] p-10 shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
          {/* MoonDAO branding */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="text-2xl">🌙</span>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 font-semibold">
              MoonDAO Weekly
            </p>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight sm:text-6xl text-white mb-4">
            Get Weekly MoonDAO Summaries
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            AI-powered recaps of the Town Hall, straight to your inbox. Never
            miss a mission update again.
          </p>

          {/* Burnt Orange Temperature Check style warning */}
          <div className="mt-8 rounded-2xl bg-[#ea580c]/20 border border-[#ea580c]/40 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ea580c] text-white text-xs font-bold">!</span>
              <p className="text-sm uppercase tracking-wider font-semibold text-[#ea580c]">
                CHECK YOUR <span className="text-white">SPAM</span> FOLDER
              </p>
            </div>
            <p className="text-sm leading-6 text-white/80 ml-8">
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
              className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-4 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] px-8 py-4 text-base font-semibold text-white transition hover:from-[#7c3aed] hover:to-[#4338ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg"
              style={{ boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)' }}
            >
              {isLoading ? "Joining..." : "Subscribe"}
            </button>
          </form>

          <p
            className="mt-4 text-sm text-white/60 font-mono"
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
