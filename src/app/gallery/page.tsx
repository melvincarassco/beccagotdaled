import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF6]">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          {/* Gallery Editorial Header */}
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-[#DCD9C9] bg-white text-[11px] tracking-[0.28em] uppercase text-[#02084B] mb-4">
              <Sparkles className="w-3 h-3 text-[#02084B]" />
              <span>The Wedding Photo Archive</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[#02084B]">
              Wedding Photo Gallery
            </h1>
            <div className="w-16 h-[1.5px] bg-[#02084B]/40 mx-auto my-4" />
            <p className="text-xs sm:text-sm text-[#545454] font-light max-w-xl mx-auto leading-relaxed">
              Explore the official high-resolution photographs from Google Drive alongside candid memories shared by our cherished guests. Click any photograph to view in high resolution or save to your favourites.
            </p>
          </div>

          {/* Full Interactive Gallery Grid */}
          <GalleryGrid />

          {/* Callout Banner to Share Photos */}
          <div className="max-w-4xl mx-auto text-center mt-20 pt-12 border-t border-[#E8E0D3]">
            <div className="p-8 sm:p-10 bg-white border border-[#DCD9C9] shadow-sm">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#02084B] mb-2 uppercase">
                Captured special moments during the day?
              </h3>
              <p className="text-xs sm:text-sm text-[#545454] max-w-lg mx-auto mb-6 font-light">
                Every candid smile, champagne toast, and laugh belongs in our collective album. Upload your photographs directly from your phone or camera.
              </p>
              <Button href="/upload" variant="primary" size="md" className="gap-2">
                <Camera className="w-4 h-4" />
                <span>Upload Your Photos</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
