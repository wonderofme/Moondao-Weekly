"use client";

import { useMemo, useState } from "react";

const initialStatus = {
  label: "Idle",
  tone: "neutral",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [useManualTranscript, setUseManualTranscript] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const statusClasses = useMemo(() => {
    if (status.tone === "success") {
      return "text-emerald-300";
    }
    if (status.tone === "error") {
      return "text-orange-300";
    }
    if (status.tone === "active") {
      return "text-blue-300";
    }
    return "text-blue-200";
  }, [status]);

  const handleUnlock = (event) => {
    event.preventDefault();
    if (!password.trim()) {
      setStatus({ label: "Enter your admin password to continue.", tone: "error" });
      return;
    }
    setIsUnlocked(true);
    setStatus(initialStatus);
  };

  const handleSummaryGeneration = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      setStatus({ label: "Password cannot be empty.", tone: "error" });
      return;
    }
    if (useManualTranscript) {
      if (!manualTranscript.trim()) {
        setStatus({
          label: "Paste the transcript text before summarizing.",
          tone: "error",
        });
        return;
      }
    } else if (!youtubeUrl.trim()) {
      setStatus({ label: "Please paste a YouTube URL.", tone: "error" });
      return;
    }

    setIsProcessing(true);
    setSummaryPreview("");
    setStatus({
      label: useManualTranscript
        ? "Summarizing manual transcript..."
        : "Sending request to mission control...",
      tone: "active",
    });

    try {
      const payload = {
        password: password.trim(),
        preview: true, // Always use preview mode now
      };

      if (!useManualTranscript) {
        const trimmedUrl = youtubeUrl.trim();
        if (trimmedUrl) {
          payload.youtube_url = trimmedUrl;
        }
      }

      if (useManualTranscript) {
        const trimmedTranscript = manualTranscript.trim();
        if (trimmedTranscript) {
          payload.manual_transcript = trimmedTranscript;
        }
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.error || "The automation failed. Check the Vercel logs for details.";
        setStatus({ label: errorMessage, tone: "error" });
        return;
      }

      // Store transcript and summary, enter preview mode
      setOriginalTranscript(data.transcript || "");
      setSummaryPreview(data.summary || "");
      setIsPreviewMode(true);
      setStatus({
        label: "Summary generated! Review and edit before sending.",
        tone: "success",
      });

      // Clear input fields
      if (useManualTranscript) {
        setManualTranscript("");
      } else {
        setYoutubeUrl("");
      }
    } catch (error) {
      setStatus({
        label: error?.message || "An unexpected error occurred.",
        tone: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async (event) => {
    event.preventDefault();
    if (!regeneratePrompt.trim()) {
      setStatus({
        label: "Enter a prompt to regenerate the summary.",
        tone: "error",
      });
      return;
    }

    setIsRegenerating(true);
    setStatus({
      label: "Regenerating summary with your prompt...",
      tone: "active",
    });

    try {
      const response = await fetch("/api/summarize/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password.trim(),
          original_transcript: originalTranscript,
          user_prompt: regeneratePrompt.trim(),
          current_summary: summaryPreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.error || "Failed to regenerate summary. Check the Vercel logs for details.";
        setStatus({ label: errorMessage, tone: "error" });
        return;
      }

      setSummaryPreview(data.summary || "");
      setRegeneratePrompt("");
      setStatus({
        label: "Summary regenerated! Review the changes.",
        tone: "success",
      });
    } catch (error) {
      setStatus({
        label: error?.message || "An unexpected error occurred.",
        tone: "error",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!summaryPreview.trim()) {
      setStatus({
        label: "Summary is empty. Generate a summary first.",
        tone: "error",
      });
      return;
    }

    setIsSending(true);
    setStatus({
      label: "Sending summary to all subscribers...",
      tone: "active",
    });

    try {
      const response = await fetch("/api/summarize/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password.trim(),
          summary: summaryPreview.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.error || "Failed to send summary. Check the Vercel logs for details.";
        setStatus({ label: errorMessage, tone: "error" });
        return;
      }

      // Reset preview mode
      setIsPreviewMode(false);
      setSummaryPreview("");
      setOriginalTranscript("");
      setRegeneratePrompt("");
      setStatus({
        label: "Success! Summary sent to all subscribers.",
        tone: "success",
      });
    } catch (error) {
      setStatus({
        label: error?.message || "An unexpected error occurred.",
        tone: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelPreview = () => {
    setIsPreviewMode(false);
    setSummaryPreview("");
    setOriginalTranscript("");
    setRegeneratePrompt("");
    setStatus(initialStatus);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* MoonDAO gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#1e1b4b] to-[#312e81]" />
      
      {/* Organic shape overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-800/20 to-purple-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-900/25 to-blue-900/25 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-2xl">🌙</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Mission Control
            </h1>
          </div>
          <p className="mt-2 text-blue-100/90">
            Paste the latest MoonDAO Town Hall stream—or drop in the transcript—to generate and send the weekly recap.
          </p>

          {!isUnlocked ? (
            <form onSubmit={handleUnlock} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium text-blue-200"
                >
                  Admin Password
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-base font-semibold text-white transition hover:from-blue-600 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 shadow-lg shadow-blue-500/25"
              >
                Unlock
              </button>
            </form>
          ) : isPreviewMode ? (
            <div className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="summaryPreview"
                  className="block text-sm font-medium text-blue-200"
                >
                  Summary Preview (editable)
                </label>
                <textarea
                  id="summaryPreview"
                  value={summaryPreview}
                  onChange={(event) => setSummaryPreview(event.target.value)}
                  rows={20}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white font-mono outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                  placeholder="Summary will appear here..."
                />
                <p className="mt-2 text-xs text-slate-400">
                  You can edit the summary directly above, or use the prompt below to regenerate it with AI.
                </p>
              </div>

              <div>
                <label
                  htmlFor="regeneratePrompt"
                  className="block text-sm font-medium text-blue-200"
                >
                  Regenerate with Prompt
                </label>
                <input
                  id="regeneratePrompt"
                  type="text"
                  value={regeneratePrompt}
                  onChange={(event) => setRegeneratePrompt(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="e.g., 'Make it more concise' or 'Add more detail on proposals'"
                  disabled={isRegenerating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && regeneratePrompt.trim()) {
                      e.preventDefault();
                      handleRegenerate(e);
                    }
                  }}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Enter instructions for Gemini to modify the summary. Press Enter to regenerate.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !regeneratePrompt.trim()}
                  className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:from-purple-600 hover:to-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 shadow-lg shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate with Prompt"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={isRegenerating || isSending}
                  className="flex-1 inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-sm px-6 py-3 text-base font-semibold text-blue-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !summaryPreview.trim()}
                  className="w-full inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-base font-semibold text-white transition hover:from-emerald-600 hover:to-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send to Everyone"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSummaryGeneration} className="mt-8 space-y-6">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 bg-slate-900/80 text-sky-400 focus:ring-sky-300"
                  checked={useManualTranscript}
                  onChange={(event) => setUseManualTranscript(event.target.checked)}
                  disabled={isProcessing}
                />
                <span className="text-blue-200">Use manual transcript instead of downloading audio</span>
              </label>

              {!useManualTranscript ? (
                <div>
                  <label
                    htmlFor="youtubeUrl"
                    className="block text-sm font-medium text-blue-200"
                  >
                    MoonDAO Town Hall YouTube URL
                  </label>
                  <input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isProcessing}
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="manualTranscript"
                    className="block text-sm font-medium text-blue-200"
                  >
                    Paste transcript text
                  </label>
                  <textarea
                    id="manualTranscript"
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    rows={12}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/60 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Paste the full meeting transcript here..."
                    disabled={isProcessing}
                  />
                  <p className="mt-2 text-xs text-blue-200/70">
                    Gemini will summarize exactly what you paste above.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-400 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Generating..." : "Generate Summary"}
              </button>
            </form>
          )}

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-300/70">
              Status
            </p>
            <p className={`mt-2 text-lg font-medium ${statusClasses}`}>
              {status.label}
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}

