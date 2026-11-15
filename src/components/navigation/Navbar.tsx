"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, Upload, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check client-side stored guest session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("becca_dale_guest_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName) {
          setGuestName(parsed.fullName);
        }
        if (parsed?.isAdmin) {
          setIsAdmin(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Gallery", href: "/gallery" },
    { label: "Favourites", href: "/favourites" },
    { label: "Upload", href: "/upload" },
    ...(guestName ? [{ label: "My Snaps", href: "/gallery?source=my_uploads" }] : []),
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-[#FEFDF6]/95 backdrop-blur-md shadow-[0_1px_12px_rgba(2,8,75,0.06)] py-3 border-b border-[#E8E0D3]"
            : "bg-transparent py-5 sm:py-7"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Logo / Monogram matching Canva Invites-Only */}
          <Link
            href="/"
            className="group flex flex-col items-start transition-opacity hover:opacity-90"
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.16em] text-[#02084B] font-normal uppercase leading-none">
                Rebecca &amp; Dale
              </span>
            </div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#304254] font-sans mt-1">
              #beccagotdaled • 14.11.26
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && !item.href.includes("#");

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-xs tracking-[0.2em] uppercase transition-colors duration-200 py-1 relative",
                    isActive
                      ? "text-[#02084B] font-semibold"
                      : "text-[#304254]/80 hover:text-[#02084B]"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#02084B]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/favourites"
              className="text-xs tracking-[0.16em] uppercase text-[#304254] hover:text-[#02084B] transition-colors p-2"
              title="View Favourites"
            >
              <Heart className="w-4 h-4 text-[#304254] hover:text-[#02084B] transition-colors" />
            </Link>

            {guestName ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/gallery?source=my_uploads"
                  className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#02084B] border border-[#02084B]/40 px-3.5 py-1.5 hover:bg-[#02084B]/5 transition-colors"
                  title="View your uploaded photos"
                >
                  <User className="w-3 h-3 text-[#02084B]" />
                  <span className="max-w-[120px] truncate">{guestName}</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase bg-[#02084B] text-white px-3 py-1.5 hover:bg-[#1a237e] transition-colors"
                  >
                    <Shield className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            ) : (
              <Button href="/guest-login" variant="secondary" size="sm">
                Guest Login
              </Button>
            )}

            <Button href="/upload" variant="primary" size="sm" className="gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Share Photos</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-[#02084B] hover:text-[#304254] focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-[#FEFDF6] lg:hidden flex flex-col pt-24 px-8 pb-10 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#304254]">
              #beccagotdaled
            </p>
            <h2 className="font-serif text-3xl tracking-[0.12em] text-[#02084B]">
              Rebecca &amp; Dale
            </h2>
            <div className="w-12 h-[1px] bg-[#02084B]/30 my-2" />

            <div className="flex flex-col space-y-4 w-full max-w-xs">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm tracking-[0.2em] uppercase text-[#02084B] hover:text-[#304254] py-2 border-b border-[#E8E0D3]"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-xs tracking-[0.2em] uppercase text-[#02084B] font-semibold py-2 flex items-center justify-center gap-1.5 bg-[#02084B]/5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Admin Suite</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-3 w-full max-w-xs mx-auto mt-6">
            <Button
              href="/upload"
              variant="primary"
              size="md"
              className="w-full gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Upload className="w-4 h-4" />
              <span>Share Guest Photos</span>
            </Button>

            <Button
              href="/guest-login"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              {guestName ? `Signed In as ${guestName}` : "Guest Login"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
