"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, User, AlertCircle, Loader2 } from "lucide-react";

interface Suggestion {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  requiresPin: boolean;
}

export function LoginGateModal() {
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");
  // Last name field — only initials required (1-2 chars)
  const [lastInitial, setLastInitial] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [needsPin, setNeedsPin] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Suggestion | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // On mount: check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check localStorage first (fast)
        const stored = localStorage.getItem("becca_dale_guest_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.fullName) return; // Already logged in, don't show gate
        }

        // Double-check with server session
        const res = await fetch("/api/guests/session");
        const data = await res.json();
        if (data.authenticated && data.guest) {
          // Store locally so future checks are instant
          localStorage.setItem(
            "becca_dale_guest_session",
            JSON.stringify(data.guest)
          );
          return;
        }

        // Not logged in — show the gate
        setShow(true);
      } catch {
        setShow(true);
      }
    };

    checkSession();
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!firstName || firstName.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const query = lastInitial
      ? `${firstName.trim()} ${lastInitial.trim()}`
      : firstName.trim();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/guests/suggest?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (data?.suggestions?.length) {
          setSuggestions(data.suggestions);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {}
    }, 250);

    return () => clearTimeout(timer);
  }, [firstName, lastInitial]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectSuggestion = (item: Suggestion) => {
    setSelectedGuest(item);
    setFirstName(item.firstName);
    setLastInitial(item.lastName.charAt(0));
    setNeedsPin(item.requiresPin);
    setShowDropdown(false);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastInitial.trim()) {
      setError("Please enter your first name and last name initial.");
      return;
    }

    setIsLoading(true);

    try {
      // If a guest was selected from suggestions, use their full last name
      const lastNameToSend = selectedGuest
        ? selectedGuest.lastName
        : lastInitial.trim();

      const res = await fetch("/api/guests/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastNameToSend,
          pinCode: pinCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresPin) {
          setNeedsPin(true);
          setError("Please enter your 4-digit PIN code.");
        } else {
          setError(
            data.error ||
              "Name not found on guest list. Contact Becca & Dale."
          );
        }
        return;
      }

      // Success — persist session locally and close gate
      localStorage.setItem(
        "becca_dale_guest_session",
        JSON.stringify(data.guest)
      );
      setShow(false);
      // Reload to refresh navbar guest name
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#02084B]/80 backdrop-blur-sm px-4">
      <div className="bg-[#FEFDF6] border border-[#E8E0D3] shadow-2xl w-full max-w-sm p-8 sm:p-10 relative animate-in fade-in zoom-in-95 duration-300">
        {/* Monogram */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#02084B] flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl text-[#02084B] uppercase tracking-wide text-center mb-1">
          Rebecca & Dale
        </h1>
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#304254] text-center mb-2">
          #beccagotdaled · 14.11.26
        </p>
        <p className="text-xs text-[#545454] text-center leading-relaxed mb-8">
          Welcome! Please sign in with your name from the guest list to view the wedding gallery.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-[#304254] block mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setSelectedGuest(null);
                setError(null);
              }}
              placeholder="e.g. Sarah"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-white border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B] placeholder:text-[#A8A39A]"
            />
          </div>

          {/* Last Name Initial */}
          <div ref={dropdownRef} className="relative">
            <label className="text-[10px] tracking-[0.2em] uppercase text-[#304254] block mb-1.5">
              Last Name Initial
            </label>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={lastInitial}
                onChange={(e) => {
                  // Allow full last name or just initial
                  setLastInitial(e.target.value.slice(0, 20));
                  setSelectedGuest(null);
                  setError(null);
                }}
                placeholder="e.g. M or Mitchell"
                required
                maxLength={20}
                className="flex-1 px-4 py-2.5 bg-white border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B] placeholder:text-[#A8A39A]"
              />
              <div className="flex items-center px-3 bg-[#F5F0EB] border border-[#DCD9C9] text-[10px] text-[#746E65] tracking-wider">
                <User className="w-3.5 h-3.5 text-[#304254]" />
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DCD9C9] shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#02084B] hover:bg-[#FEFDF6] border-b border-[#F0EBE4] last:border-0 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-[#304254] flex-shrink-0" />
                    <span>
                      {s.firstName}{" "}
                      <span className="font-medium">{s.lastName}</span>
                    </span>
                    {s.requiresPin && (
                      <span className="ml-auto text-[10px] tracking-wider uppercase text-[#C5A059]">
                        PIN required
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PIN Code (shown if required) */}
          {needsPin && (
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-[#304254] block mb-1.5">
                4-Digit PIN Code
              </label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                className="w-full px-4 py-2.5 bg-white border border-[#DCD9C9] text-sm text-[#02084B] focus:outline-none focus:border-[#02084B] tracking-widest placeholder:text-[#A8A39A]"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#02084B] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#040D44] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In…</span>
              </>
            ) : (
              <span>Enter the Celebration</span>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-[#A8A39A] mt-6 leading-relaxed">
          Your name must be on the official guest list.
          <br />
          Contact Becca &amp; Dale if you need access.
        </p>
      </div>
    </div>
  );
}
