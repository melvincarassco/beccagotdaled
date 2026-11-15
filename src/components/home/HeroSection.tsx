"use client";

import React from "react";
import Image from "next/image";
import { Camera, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-6 sm:px-10 overflow-hidden bg-[#FEFDF6]">
      {/* Subtle Luxury Pattern background */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#02084B_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Decorative Warm Alabaster Radiance */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#E8E0D3]/30 via-[#F2EEEB]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto w-full flex flex-col items-center text-center z-10">
        {/* Monogram / Top Tagline matching Canva Invites-Only */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#DCD9C9] bg-white/80 backdrop-blur-sm mb-6 sm:mb-8">
          <Sparkles className="w-3 h-3 text-[#02084B]" />
          <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#02084B] font-semibold">
            #beccagotdaled • 14.11.26
          </span>
        </div>

        {/* Featured Editorial Photo Showcase with Watermark & In-Image Typography */}
        <div className="w-full max-w-[360px] sm:max-w-md md:max-w-lg relative mb-12 group">
          <div className="relative aspect-[9/16] w-full overflow-hidden shadow-[0_20px_50px_rgba(2,8,75,0.16)] border-[8px] sm:border-[14px] border-white bg-[#F2EEEB]">
            <Image
              src="/images/hero-showcase.jpg"
              alt="Rebecca and Dale Wedding Celebration"
              fill
              priority
              className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 640px) 360px, (max-width: 1024px) 448px, 512px"
            />
            {/* Soft Editorial Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90" />

            {/* In-Image Editorial Typography: Rebecca & Dale + 14 November 2026 */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-center text-white z-10 flex flex-col items-center">
              <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#E8E0D3] font-medium mb-2 drop-shadow">
                The Golden Hour Celebration
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl tracking-[0.08em] uppercase text-white font-normal leading-[1.05] drop-shadow-md">
                Rebecca <span className="font-serif italic text-white/90 lowercase text-2xl sm:text-4xl md:text-5xl font-light">&amp;</span> Dale
              </h1>
              <div className="w-12 h-[1px] bg-white/50 my-2.5" />
              <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#E8E0D3] font-medium drop-shadow">
                14 November 2026
              </p>
            </div>

            {/* Official #beccagotdaled Watermark Overlay */}
            <WatermarkBadge size="md" className="top-4 right-4 sm:top-6 sm:right-6" />
          </div>

          {/* Luxury Frame Accents */}
          <div className="absolute -inset-2 border border-[#E8E0D3] pointer-events-none -z-10" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Button href="/gallery" variant="primary" size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
            <Heart className="w-4 h-4 fill-white/20" />
            <span>Explore Photo Gallery</span>
          </Button>

          <Button href="/upload" variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
            <Camera className="w-4 h-4 text-[#02084B]" />
            <span>Upload Your Photos</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
