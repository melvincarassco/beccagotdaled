"use client";

import React, { useState, useEffect } from "react";
import { Bug, X, Send, CheckCircle2, AlertCircle, Monitor, MapPin, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function openIssueTracker() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-issue-tracker"));
  }
}

function detectAreaFromPath(pathname: string): string {
  if (pathname.startsWith("/upload")) return "Photo Upload & Speed";
  if (pathname.startsWith("/gallery")) return "Gallery & Photo Browsing";
  if (pathname.startsWith("/favourites") || pathname.startsWith("/favorites"))
    return "Liking & Favorites / Who Button";
  if (pathname.startsWith("/guest-login")) return "Guest Sign In & Access";
  if (pathname.startsWith("/admin")) return "Admin Dashboard & Analytics";
  return "General / Experience";
}

export function ReportIssueModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");

  // Auto-captured fields
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [detectedArea, setDetectedArea] = useState("General / Experience");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [screenSummary, setScreenSummary] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Capture context whenever modal opens or route changes
  const captureEnvironment = () => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname + window.location.search;
    setPageUrl(currentPath);
    setPageTitle(document.title || "Wedding Photo Platform");
    setDetectedArea(detectAreaFromPath(window.location.pathname));

    const ua = navigator.userAgent;
    const screenInfo = `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`;
    setScreenSummary(screenInfo);
    setDeviceInfo(`${ua} | Screen: ${screenInfo}`);

    try {
      const stored = localStorage.getItem("becca_dale_guest_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName) {
          setGuestName(parsed.fullName);
        }
      }
    } catch {}
  };

  useEffect(() => {
    captureEnvironment();

    const handleOpen = () => {
      captureEnvironment();
      setIsOpen(true);
    };

    window.addEventListener("open-issue-tracker", handleOpen);
    return () => window.removeEventListener("open-issue-tracker", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setFeedback({ type: "error", message: "Please describe the issue you encountered." });
      return;
    }

    // Auto-generate title from the first sentence or first 60 chars of description
    const firstLine = trimmedDesc.split("\n")[0].trim();
    const autoTitle = firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;

    // Auto-compile rich technical code semantics for admin debugging
    const generatedSemantics = [
      `Route: ${pageUrl || window.location.pathname}`,
      `Page Title: ${pageTitle || document.title}`,
      `Referrer: ${document.referrer || "Direct"}`,
      `Online: ${navigator.onLine ? "Yes" : "No"}`,
      `Screen: ${screenSummary || `${window.innerWidth}x${window.innerHeight}`}`,
      `Timestamp: ${new Date().toISOString()}`,
      `User-Agent: ${navigator.userAgent}`,
    ].join("\n");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim() || undefined,
          guestContact: guestContact.trim() || undefined,
          pageUrl: pageUrl || window.location.pathname,
          componentOrArea: detectedArea,
          title: autoTitle,
          description: trimmedDesc,
          codeSemantics: generatedSemantics,
          deviceInfo: deviceInfo || navigator.userAgent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit issue report");
      }

      setFeedback({
        type: "success",
        message: "Thank you! Your issue and location have been logged for Rebecca & Dale with an OPEN status.",
      });

      setDescription("");

      setTimeout(() => {
        setIsOpen(false);
        setFeedback(null);
      }, 2200);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An error occurred while submitting." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Report Issue Trigger Button */}
      <button
        onClick={() => {
          captureEnvironment();
          setIsOpen(true);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#02084B] text-white shadow-lg hover:bg-[#304254] transition-all duration-200 border border-white/20 text-xs tracking-wider uppercase backdrop-blur-sm group hover:scale-105"
        title="Report an issue or upload trouble"
        aria-label="Report Issue"
      >
        <Bug className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-sans text-[11px]">Report Issue</span>
      </button>

      {/* Issue Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD9C9] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-[#545454] hover:text-[#02084B] p-1 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-amber-300 bg-amber-50 text-[10px] tracking-[0.2em] uppercase text-amber-800 font-semibold mb-2">
                <Bug className="w-3 h-3 text-amber-600" />
                <span>Guest Bug &amp; Feedback Tracker</span>
              </div>
              <h3 className="font-serif text-2xl text-[#02084B] uppercase">
                Report An Issue
              </h3>
              <p className="text-xs text-[#545454] mt-1 leading-relaxed">
                Having trouble uploading pictures, viewing photos, or seeing a glitch? Simply describe what happened below.
              </p>
            </div>

            {/* Auto-Captured Details Badge Banner */}
            <div className="mb-5 p-3 bg-[#FEFDF6] border border-[#E8E0D3] rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#02084B] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Auto-Captured Diagnostics
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-normal">
                  ✓ Location Attached
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#545454]">
                <div className="flex items-center gap-1 font-mono truncate">
                  <MapPin className="w-3 h-3 text-[#545454] flex-shrink-0" />
                  <span className="truncate">Page: {pageUrl || "/"}</span>
                </div>
                <div className="flex items-center gap-1 font-mono truncate">
                  <Monitor className="w-3 h-3 text-[#545454] flex-shrink-0" />
                  <span className="truncate">{detectedArea}</span>
                </div>
              </div>
            </div>

            {/* Feedback Alerts */}
            {feedback && (
              <div
                className={`mb-5 p-3 text-xs flex items-start gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Primary User Input: Only mention your issue */}
              <div>
                <label className="block text-[11px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1.5">
                  What happened? *
                </label>
                <textarea
                  rows={4}
                  required
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. My picture upload gets stuck at 90%, or the image doesn't appear in the gallery after uploading..."
                  className="w-full p-3 bg-[#FEFDF6] border border-[#DCD9C9] text-xs sm:text-sm focus:outline-none focus:border-[#02084B] placeholder:text-[#888888] leading-relaxed"
                />
              </div>

              {/* Optional Name / Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-[#545454]" />
                    <span>Your Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Dale Vance"
                    className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1">
                    Contact / Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestContact}
                    onChange={(e) => setGuestContact(e.target.value)}
                    placeholder="For resolution updates"
                    className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs tracking-wider uppercase text-[#545454] hover:text-[#02084B]"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-2 bg-[#02084B] hover:bg-[#304254] text-white"
                  isLoading={isSubmitting}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Issue Report</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
