"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-6 sm:px-10 overflow-hidden bg-[#FAF7F2]">
      {/* Subtle Luxury Pattern / Ambient Grain background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Decorative Champagne Radiance */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#DFC697]/20 via-[#F5EFEB]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto w-full flex flex-col items-center text-center z-10">
        {/* Monogram / Top Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#D9CEB2] bg-[#FDFBF7]/80 backdrop-blur-sm mb-6 sm:mb-8">
          <Sparkles className="w-3 h-3 text-[#C5A059]" />
          <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#746E65]">
            The Wedding Celebration
          </span>
          <span className="text-[#C5A059]">•</span>
          <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#C5A059] font-medium">
            #beccagotdaled
          </span>
        </div>

        {/* Main Editorial Names */}
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.08em] uppercase text-[#22201E] font-normal leading-[1.05] sm:leading-[0.98] mb-6">
          Becca <span className="font-serif italic text-[#C5A059] lowercase text-4xl sm:text-6xl md:text-7xl font-light">&amp;</span> Dale
        </h1>

        {/* Date & Location Editorial Subtext */}
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm tracking-[0.22em] uppercase text-[#746E65] font-light max-w-xl mx-auto mb-10 pb-2 border-b border-[#EAE3D9]">
          <span>November 14, 2026</span>
          <span className="text-[#C5A059]">•</span>
          <span>The Glasshouse Estate</span>
          <span className="text-[#C5A059]">•</span>
          <span>Surrey</span>
        </div>

        {/* Featured Editorial Photo Showcase with Watermark */}
        <div className="w-full max-w-4xl relative mb-12 group">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden shadow-[0_20px_50px_rgba(34,32,30,0.12)] border-[8px] sm:border-[14px] border-[#FDFBF7] bg-[#F5EFEB]">
            <Image
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85"
              alt="Becca and Dale Wedding Celebration"
              fill
              priority
              className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            {/* Soft Editorial Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

            {/* Cinematic Overlay Badge */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 text-left text-white z-10">
              <span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-[#DFC697] font-medium block">
                Official Collection
              </span>
              <p className="font-serif text-lg sm:text-2xl italic font-light drop-shadow">
                The Golden Hour in Surrey
              </p>
            </div>

            {/* Official #beccagotdaled Watermark Overlay */}
            <WatermarkBadge size="md" className="bottom-4 right-4 sm:bottom-6 sm:right-6" />
          </div>

          {/* Luxury Frame Accents */}
          <div className="absolute -inset-2 border border-[#C5A059]/30 pointer-events-none -z-10" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Button href="/gallery" variant="primary" size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
            <Heart className="w-4 h-4 fill-white/20" />
            <span>Explore Photo Gallery</span>
          </Button>

          <Button href="/upload" variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
            <Camera className="w-4 h-4 text-[#C5A059]" />
            <span>Upload Your Photos</span>
          </Button>
        </div>


      </div>
    </section>
  );
}
