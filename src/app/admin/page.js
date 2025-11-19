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
      return "text-[#ea580c]";
    }
    if (status.tone === "active") {
      return "text-[#8b5cf6]";
    }
    return "text-white/80";
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
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B19]">
      {/* Ambient red/orange glow - bottom 1/4 of background */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-[30vh] z-0">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-[#ea580c]/20 via-[#ea580c]/5 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        {/* Hero Card with Top-to-Bottom Gradient */}
        <section className="rounded-2xl bg-gradient-to-b from-[#4f46e5] to-[#0f172a] p-10 shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="text-2xl">🌙</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Mission Control
            </h1>
          </div>
          <p className="mt-2 text-white/90">
            Paste the latest MoonDAO Town Hall stream—or drop in the transcript—to generate and send the weekly recap.
          </p>

          {!isUnlocked ? (
            <form onSubmit={handleUnlock} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium text-white/90"
                >
                  Admin Password
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#4f46e5] px-6 py-3 text-base font-semibold text-white transition hover:from-[#7c3aed] hover:to-[#4338ca] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b5cf6] shadow-lg"
                  style={{ boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)' }}
              >
                Unlock
              </button>
            </form>
          ) : isPreviewMode ? (
            <div className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="summaryPreview"
                  className="block text-sm font-medium text-white/90"
                >
                  Summary Preview (editable)
                </label>
                <textarea
                  id="summaryPreview"
                  value={summaryPreview}
                  onChange={(event) => setSummaryPreview(event.target.value)}
                  rows={20}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white font-mono outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40"
                  placeholder="Summary will appear here..."
                />
                <p className="mt-2 text-xs text-slate-400">
                  You can edit the summary directly above, or use the prompt below to regenerate it with AI.
                </p>
              </div>

              <div>
                <label
                  htmlFor="regeneratePrompt"
                  className="block text-sm font-medium text-white/90"
                >
                  Regenerate with Prompt
                </label>
                <input
                  id="regeneratePrompt"
                  type="text"
                  value={regeneratePrompt}
                  onChange={(event) => setRegeneratePrompt(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="flex-1 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] px-6 py-3 text-base font-semibold text-white transition hover:from-[#7c3aed] hover:to-[#5b21b6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b5cf6] shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)' }}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate with Prompt"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={isRegenerating || isSending}
                  className="flex-1 inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/5 backdrop-blur-sm px-6 py-3 text-base font-semibold text-white/80 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !summaryPreview.trim()}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-base font-semibold text-white transition hover:from-emerald-600 hover:to-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}
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
                <span className="text-white/90">Use manual transcript instead of downloading audio</span>
              </label>

              {!useManualTranscript ? (
                <div>
                  <label
                    htmlFor="youtubeUrl"
                    className="block text-sm font-medium text-white/90"
                  >
                    MoonDAO Town Hall YouTube URL
                  </label>
                  <input
                    id="youtubeUrl"
                    type="url"
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isProcessing}
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="manualTranscript"
                    className="block text-sm font-medium text-white/90"
                  >
                    Paste transcript text
                  </label>
                  <textarea
                    id="manualTranscript"
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    rows={12}
                    className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/40 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Paste the full meeting transcript here..."
                    disabled={isProcessing}
                  />
                  <p className="mt-2 text-xs text-white/60 font-mono">
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

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6" style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
            <p className="text-sm uppercase tracking-[0.25em] text-white/60 font-mono">
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

