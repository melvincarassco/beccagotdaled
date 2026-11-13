import React from "react";
import Image from "next/image";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

export function StorySection() {
  return (
    <section id="story" className="py-24 sm:py-32 px-6 sm:px-10 bg-[#FDFBF7] border-t border-[#EAE3D9]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Photo Frame with Watermark */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto shadow-[0_15px_35px_rgba(34,32,30,0.08)] border-[10px] sm:border-[16px] border-white bg-[#F5EFEB]">
              <Image
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80"
                alt="Becca & Dale portrait"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 450px"
              />
              <WatermarkBadge size="sm" />
            </div>

            {/* Decorative Offset Gold Frame */}
            <div className="hidden sm:block absolute -bottom-6 -right-6 w-full h-full border border-[#C5A059]/30 pointer-events-none -z-10" />
          </div>

          {/* Right Column: Love Story & Wedding Welcome */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex items-center space-x-3">
              <span className="h-[1px] w-8 bg-[#C5A059]" />
              <span className="text-xs tracking-[0.25em] uppercase text-[#C5A059] font-medium">
                Our Journey
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] text-[#22201E] font-normal uppercase leading-tight">
              To Our Beloved Family &amp; Friends
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-[#746E65] font-light leading-relaxed">
              <p>
                From our first serendipitous conversation to standing hand-in-hand under the floral
                canopy in Surrey, every step of our love story has been enriched by the extraordinary people
                surrounding us.
              </p>
              <p>
                Our wedding was not merely a celebration of our vows, but a profound tribute to all of
                you who have loved, guided, and celebrated us throughout the years. The tears during the vows,
                the laughter across the champagne tables, and the exuberance on the dance floor made our day
                unforgettable.
              </p>
            </div>

            {/* Editorial Blockquote */}
            <blockquote className="border-l-2 border-[#C5A059] pl-6 py-2 my-4">
              <p className="font-serif italic text-lg sm:text-xl text-[#22201E]/90 font-light">
                &ldquo;We didn&rsquo;t just want a photo album; we wanted a living archive of joy,
                seen not only through the lens of our photographer, but through the eyes of our guests.&rdquo;
              </p>
              <footer className="mt-2 text-xs tracking-[0.2em] uppercase text-[#C5A059]">
                — Dale &amp; Becca
              </footer>
            </blockquote>

            <div className="pt-4 flex items-center space-x-4">
              <div className="font-serif italic text-2xl text-[#22201E]/80">
                Becca &amp; Dale
              </div>
              <span className="text-[#C5A059]">•</span>
              <span className="text-xs tracking-[0.2em] uppercase text-[#746E65]">
                October 2024
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
