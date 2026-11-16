"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Sparkles, UserCheck, Search, KeyRound, AlertCircle, CheckCircle2, LogOut, UserPlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Suggestion {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  requiresPin: boolean;
}

export default function GuestLoginPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [needsPin, setNeedsPin] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{ fullName: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Request Access Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqFirstName, setReqFirstName] = useState("");
  const [reqLastName, setReqLastName] = useState("");
  const [reqContact, setReqContact] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqFeedback, setReqFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Check current session on mount
  useEffect(() => {
    fetch("/api/guests/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.guest) {
          setActiveSession(data.guest);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live guest suggestions as first name or last name is typed
  useEffect(() => {
    const query = `${firstName} ${lastName}`.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/guests/suggest?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.suggestions) {
            setSuggestions(data.suggestions);
            setShowDropdown(data.suggestions.length > 0);
          }
        })
        .catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [firstName, lastName]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: Suggestion) => {
    setFirstName(item.firstName);
    setLastName(item.lastName);
    setNeedsPin(item.requiresPin);
    setShowDropdown(false);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter both your first name and last name.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/guests/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          pinCode: pinCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresPin) {
          setNeedsPin(true);
        }
        setErrorMessage(data.error || "Unable to sign in. Please verify your details.");
      } else {
        setSuccessMessage(data.message || `Welcome, ${data.guest.fullName}!`);
        setActiveSession(data.guest);

        // Store guest name client-side for immediate navbar refresh
        try {
          localStorage.setItem(
            "becca_dale_guest_session",
            JSON.stringify(data.guest)
          );
        } catch {}

        setTimeout(() => {
          router.push("/gallery");
        }, 1200);
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRequestModal = () => {
    setReqFirstName(firstName.trim());
    setReqLastName(lastName.trim());
    setReqFeedback(null);
    setShowRequestModal(true);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqFeedback(null);

    if (!reqFirstName.trim() || !reqLastName.trim()) {
      setReqFeedback({ type: "error", message: "Please provide both first and last name." });
      return;
    }

    setIsSubmittingReq(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: reqFirstName.trim(),
          lastName: reqLastName.trim(),
          contact: reqContact.trim() || undefined,
          note: reqNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setReqFeedback({
        type: "success",
        message: "Request submitted! Rebecca & Dale have been notified and will approve your access shortly.",
      });

      setTimeout(() => {
        setShowRequestModal(false);
        setReqFeedback(null);
      }, 3000);
    } catch (err: any) {
      setReqFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/guests/logout", { method: "POST" });
    try {
      localStorage.removeItem("becca_dale_guest_session");
    } catch {}
    setActiveSession(null);
    setSuccessMessage("You have been signed out.");
    setFirstName("");
    setLastName("");
    setPinCode("");
    setNeedsPin(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 px-6 sm:px-10 flex items-center justify-center">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#C5A059] mb-4">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Celebration Guest Access</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-[0.06em] uppercase text-[#22201E]">
              Welcome, Wedding Guests
            </h1>
            <p className="text-xs sm:text-sm text-[#746E65] mt-2 font-light leading-relaxed">
              Sign in with your registered name to contribute photographs, favorite moments, and browse high-resolution memories.
            </p>
          </div>

          {/* Active Session Card */}
          {activeSession ? (
            <div className="bg-white border border-[#EAE3D9] p-8 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#C5A059]" />
              </div>
              <h3 className="font-serif text-2xl text-[#22201E] mb-1">
                You are signed in
              </h3>
              <p className="text-xs tracking-[0.2em] uppercase text-[#C5A059] mb-6">
                {activeSession.fullName}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button href="/gallery" variant="primary" size="md">
                  View Photo Gallery
                </Button>
                <Button href="/upload" variant="secondary" size="md">
                  Upload Photos
                </Button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase text-[#746E65] hover:text-red-600 px-4 py-2 border border-dashed border-[#D9CEB2]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="bg-white border border-[#EAE3D9] p-8 sm:p-10 shadow-sm relative" ref={dropdownRef}>
              {/* Alert Messages */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-red-700">Can&apos;t find your name?</span>
                    <button
                      type="button"
                      onClick={handleOpenRequestModal}
                      className="font-semibold text-red-900 underline hover:no-underline"
                    >
                      Request Access &rarr;
                    </button>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Dale"
                      required
                      autoComplete="given-name"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Vance"
                      required
                      autoComplete="family-name"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>
                </div>

                {/* Live Guest Name Auto-suggestions */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="p-3 bg-[#FAF7F2] border border-[#C5A059]/40 shadow-md animate-in fade-in">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#C5A059] font-medium mb-2 flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      <span>Matching Registered Guests (Click to select)</span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-3 py-1.5 bg-white hover:bg-[#F5EFEB] border border-[#EAE3D9] text-xs font-serif text-[#22201E] flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-sm">{item.fullName}</span>
                          {item.requiresPin && (
                            <span className="text-[10px] tracking-wider text-[#C5A059] uppercase font-sans">
                              Requires PIN
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional PIN Field */}
                {needsPin && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Guest PIN Code</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="4-digit PIN (e.g. 2026)"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm text-[#22201E] tracking-widest focus:outline-none focus:border-[#C5A059]"
                    />
                    <span className="text-[11px] text-[#746E65] mt-1 block">
                      A PIN is required for this registered VIP guest entry.
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full gap-2"
                    isLoading={isLoading}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Enter Celebration Gallery</span>
                  </Button>
                </div>
              </form>

              {/* Request Access & Security Notice */}
              <div className="mt-6 pt-5 border-t border-[#EAE3D9] space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF7F2] p-3.5 border border-[#EAE3D9]">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-serif uppercase tracking-wider text-[#22201E] font-medium">
                      Not on the official list?
                    </p>
                    <p className="text-[11px] text-[#746E65]">
                      Request access from Rebecca &amp; Dale
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenRequestModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#C5A059] bg-white text-[10px] tracking-widest uppercase text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Request Access</span>
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-[#746E65] leading-relaxed">
                    Guests are matched against our official celebration register. Only active guests are granted access to download and contribute photographs.
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9CEB2] max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-[#746E65] hover:text-[#22201E] p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#D9CEB2] bg-[#FAF7F2] text-[10px] tracking-[0.2em] uppercase text-[#C5A059] mb-2 font-medium">
                <UserPlus className="w-3 h-3 text-[#C5A059]" />
                <span>Guest Register Entry</span>
              </div>
              <h3 className="font-serif text-2xl text-[#22201E] uppercase">
                Request Access
              </h3>
              <p className="text-xs text-[#746E65] mt-1">
                Enter your details below. Rebecca &amp; Dale will review and approve your access to view and contribute celebration photos.
              </p>
            </div>

            {reqFeedback && (
              <div
                className={`mb-4 p-3 text-xs flex items-start gap-2 ${
                  reqFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {reqFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{reqFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqFirstName}
                    onChange={(e) => setReqFirstName(e.target.value)}
                    placeholder="e.g. Dale"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9CEB2] text-xs text-[#22201E] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqLastName}
                    onChange={(e) => setReqLastName(e.target.value)}
                    placeholder="e.g. Vance"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9CEB2] text-xs text-[#22201E] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1">
                  Contact Number or Email (Optional)
                </label>
                <input
                  type="text"
                  value={reqContact}
                  onChange={(e) => setReqContact(e.target.value)}
                  placeholder="e.g. +44 7123 456789 or email@example.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9CEB2] text-xs text-[#22201E] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1">
                  Relationship / Note for Rebecca &amp; Dale
                </label>
                <textarea
                  rows={2}
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="e.g. Dale's high school friend, or Rebecca's cousin from Canada"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9CEB2] text-xs text-[#22201E] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs tracking-wider uppercase text-[#746E65] hover:text-[#22201E]"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-2"
                  isLoading={isSubmittingReq}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Access Request</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
