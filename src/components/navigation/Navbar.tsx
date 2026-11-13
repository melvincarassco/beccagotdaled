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
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check client-side stored guest session if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("becca_dale_guest_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName) {
          setGuestName(parsed.fullName);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Close mobile drawer upon route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "The Celebration", href: "/#celebration" },
    { label: "Our Story", href: "/#story" },
    { label: "Gallery", href: "/gallery" },
    { label: "Favourites", href: "/favourites" },
    { label: "Upload", href: "/upload" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-[#FAF7F2]/95 backdrop-blur-md shadow-[0_1px_12px_rgba(34,32,30,0.06)] py-3 border-b border-[#EAE3D9]"
            : "bg-transparent py-5 sm:py-7"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Logo / Monogram */}
          <Link
            href="/"
            className="group flex flex-col items-start transition-opacity hover:opacity-90"
          >
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.18em] text-[#22201E] font-medium uppercase leading-none">
              Becca & Dale
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C5A059] font-sans mt-1">
              #beccagotdaled
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
                    "text-xs tracking-[0.18em] uppercase transition-colors duration-200 py-1 relative",
                    isActive
                      ? "text-[#C5A059] font-medium"
                      : "text-[#22201E]/80 hover:text-[#22201E]"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C5A059]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/gallery"
              className="text-xs tracking-[0.16em] uppercase text-[#746E65] hover:text-[#22201E] transition-colors p-2"
              title="View Favourites"
            >
              <Heart className="w-4 h-4 text-[#746E65] hover:text-[#C5A059] transition-colors" />
            </Link>

            {guestName ? (
              <Link
                href="/guest-login"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#C5A059] border border-[#C5A059]/40 px-3.5 py-1.5 hover:bg-[#C5A059]/10 transition-colors"
              >
                <User className="w-3 h-3 text-[#C5A059]" />
                <span className="max-w-[120px] truncate">{guestName}</span>
              </Link>
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
            className="lg:hidden p-2 text-[#22201E] hover:text-[#C5A059] focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-[#FAF7F2] lg:hidden flex flex-col pt-24 px-8 pb-10 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center space-y-6 flex-1 justify-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A059]">
              #beccagotdaled
            </p>
            <h2 className="font-serif text-3xl tracking-[0.12em] text-[#22201E]">
              Becca & Dale
            </h2>
            <div className="w-12 h-[1px] bg-[#C5A059]/40 my-2" />

            <div className="flex flex-col space-y-4 w-full max-w-xs">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm tracking-[0.2em] uppercase text-[#22201E] hover:text-[#C5A059] py-2 border-b border-[#EAE3D9]/60"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="text-xs tracking-[0.2em] uppercase text-[#746E65] hover:text-[#22201E] py-2 flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
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
