"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Sparkles, UserCheck, Search, KeyRound, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
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
                <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
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

              {/* Informative Security Notice */}
              <div className="mt-6 pt-5 border-t border-[#EAE3D9] text-center">
                <p className="text-[11px] text-[#746E65] leading-relaxed">
                  Guests are matched against our official celebration register. Only active guests are granted access to download and contribute photographs.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
