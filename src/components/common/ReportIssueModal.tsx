"use client";

import React, { useState, useEffect } from "react";
import { Bug, X, Send, CheckCircle2, AlertCircle, Code2, Monitor, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

const COMPONENT_AREAS = [
  "Gallery & Photo Browsing",
  "Photo Upload & Speed",
  "Liking & Favorites / Who Button",
  "Guest Sign In & Access",
  "Mobile Touch / Responsive View",
  "Admin Dashboard & Analytics",
  "Other / Visual Glitch",
];

export function ReportIssueModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [componentOrArea, setComponentOrArea] = useState(COMPONENT_AREAS[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [codeSemantics, setCodeSemantics] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Initialize environment info and guest session
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.pathname + window.location.search);
      const ua = navigator.userAgent;
      const screenInfo = `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`;
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim() || !description.trim()) {
      setFeedback({ type: "error", message: "Please provide both an issue title and description." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim() || undefined,
          guestContact: guestContact.trim() || undefined,
          pageUrl: pageUrl || window.location.pathname,
          componentOrArea,
          title: title.trim(),
          description: description.trim(),
          codeSemantics: codeSemantics.trim() || undefined,
          deviceInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit issue report");
      }

      setFeedback({
        type: "success",
        message: "Issue submitted! Rebecca & Dale and the admin team have logged it with an OPEN status.",
      });

      setTitle("");
      setDescription("");
      setCodeSemantics("");

      setTimeout(() => {
        setIsOpen(false);
        setFeedback(null);
      }, 2500);
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
          setIsOpen(true);
          setPageUrl(window.location.pathname + window.location.search);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#02084B] text-white shadow-lg hover:bg-[#304254] transition-all duration-200 border border-white/20 text-xs tracking-wider uppercase backdrop-blur-sm group hover:scale-105"
        title="Report an issue or bug with code semantics"
        aria-label="Report Issue"
      >
        <Bug className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-sans text-[11px]">Report Issue</span>
      </button>

      {/* Issue Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD9C9] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-[#545454] hover:text-[#02084B] p-1 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-amber-300 bg-amber-50 text-[10px] tracking-[0.2em] uppercase text-amber-800 font-semibold mb-2">
                <Bug className="w-3 h-3 text-amber-600" />
                <span>Guest Bug & Feedback Tracker</span>
              </div>
              <h3 className="font-serif text-2xl text-[#02084B] uppercase">
                Raise An Issue
              </h3>
              <p className="text-xs text-[#545454] mt-1">
                Report a bug or unexpected behavior. You can include exact code semantics, error messages, or selectors so the team can review and resolve it.
              </p>
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
              {/* Reporter Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1">
                    Your Name (Optional)
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
                    Contact Email / Phone
                  </label>
                  <input
                    type="text"
                    value={guestContact}
                    onChange={(e) => setGuestContact(e.target.value)}
                    placeholder="Optional for follow up"
                    className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                  />
                </div>
              </div>

              {/* Area & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1">
                    Feature / Component Area
                  </label>
                  <select
                    value={componentOrArea}
                    onChange={(e) => setComponentOrArea(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs text-[#02084B] focus:outline-none focus:border-[#02084B]"
                  >
                    {COMPONENT_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#545454]" />
                    <span>Exact Page / Route</span>
                  </label>
                  <input
                    type="text"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    placeholder="/gallery"
                    className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs font-mono text-[#545454] focus:outline-none focus:border-[#02084B]"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heart like button is unresponsive on mobile Safari"
                  className="w-full px-3 py-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1">
                  Description / Steps to Reproduce *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you did, what happened, and what you expected to see..."
                  className="w-full p-3 bg-[#FEFDF6] border border-[#DCD9C9] text-xs focus:outline-none focus:border-[#02084B]"
                />
              </div>

              {/* Code Semantics / Exact Place */}
              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-semibold mb-1 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-[#02084B]" />
                  <span>Exact Code Semantics / Error Logs / Selectors (Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={codeSemantics}
                  onChange={(e) => setCodeSemantics(e.target.value)}
                  placeholder={`e.g.\nError: TypeError: Failed to fetch /api/photos/drive/[id]/view\nElement: button.like-toggle-btn\nFunction: togglePhotoLike() failed with 403`}
                  className="w-full p-2.5 bg-slate-900 text-slate-100 font-mono text-[11px] border border-slate-700 focus:outline-none focus:border-amber-400 placeholder:text-slate-500 rounded"
                />
                <span className="text-[10px] text-[#545454] mt-0.5 block">
                  Useful for debugging: console errors, HTML class/id names, API endpoints, or stack traces.
                </span>
              </div>

              {/* Environment diagnostics info */}
              {deviceInfo && (
                <div className="p-2.5 bg-gray-50 border border-gray-200 text-[10px] text-[#545454] flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="truncate">Auto-attached device diagnostics: {deviceInfo.slice(0, 80)}…</span>
                </div>
              )}

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
                  className="gap-2"
                  isLoading={isSubmitting}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Issue Report</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
