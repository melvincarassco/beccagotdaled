"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Camera, Check, X, Bug } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openIssueTracker } from "./ReportIssueModal";

export function LoginTroubleNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState<string>("");

  useEffect(() => {
    // Check if user is logged in and hasn't seen the notice in this session
    const checkLoginStatus = () => {
      try {
        const hasSeen = sessionStorage.getItem("becca_seen_upload_help");
        if (hasSeen) return;

        const sessionStr = localStorage.getItem("becca_dale_guest_session");
        if (!sessionStr) return;

        const session = JSON.parse(sessionStr);
        if (session?.fullName) {
          setGuestName(session.fullName.split(" ")[0] || session.fullName);
          // Show notice with a slight delay for smooth transition
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1200);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore session parsing errors
      }
    };

    checkLoginStatus();

    // Also listen for immediate login events
    const handleLoginEvent = () => {
      checkLoginStatus();
    };

    window.addEventListener("guest-logged-in", handleLoginEvent);
    return () => window.removeEventListener("guest-logged-in", handleLoginEvent);
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("becca_seen_upload_help", "true");
    } catch {}
    setIsOpen(false);
  };

  const handleOpenTracker = () => {
    handleDismiss();
    // Open the Issue Tracker modal
    openIssueTracker();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FEFDF6] border border-[#DCD9C9] max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[#545454] hover:text-[#02084B] p-1 transition-colors"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Tag */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
            Guest Notice
          </span>
        </div>

        {/* Heading */}
        <h3 className="font-serif text-xl sm:text-2xl text-[#02084B] uppercase leading-tight mb-2">
          {guestName ? `Welcome, ${guestName}!` : "Welcome to the Wedding Gallery!"}
        </h3>

        {/* Notice Message */}
        <p className="text-xs sm:text-[13px] text-[#545454] leading-relaxed mb-4">
          Having any trouble uploading your pictures or noticing images not appearing properly?
          Dale &amp; Rebecca have an active <strong>Live Tracker</strong>. If anything gets stuck,
          simply let us know what happened and we will fix it immediately!
        </p>

        {/* Reassuring note */}
        <div className="p-2.5 bg-white border border-[#E8E0D3] rounded text-[11px] text-[#545454] mb-5 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>No technical knowledge needed — your page and device info are auto-detected.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenTracker}
            className="w-full sm:flex-1 gap-2 bg-[#02084B] hover:bg-[#304254] text-white"
          >
            <Bug className="w-3.5 h-3.5 text-amber-300" />
            <span>I Have Trouble / Report</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="w-full sm:w-auto text-xs uppercase tracking-wider text-[#545454] border-[#DCD9C9]"
          >
            All Good
          </Button>
        </div>
      </div>
    </div>
  );
}
