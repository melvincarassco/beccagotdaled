import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 mb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#C5A059] mb-4">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span>Official & Guest Photography</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[#22201E]">
            Wedding Photo Gallery
          </h1>
          <div className="w-16 h-[1.5px] bg-[#C5A059] mx-auto my-4" />
          <p className="text-xs sm:text-sm text-[#746E65] font-light max-w-xl mx-auto leading-relaxed">
            Every moment captured from our celebration. Explore official portraits from Google Drive
            alongside candid snapshots uploaded by our beloved guests. All photos carry #beccagotdaled.
          </p>
        </div>

        <GalleryTeaser />

        <div className="max-w-4xl mx-auto px-6 text-center mt-12">
          <div className="p-8 bg-white border border-[#EAE3D9]">
            <h3 className="font-serif text-2xl text-[#22201E] mb-2">Have photographs to share?</h3>
            <p className="text-xs text-[#746E65] mb-6">
              Upload your snaps directly to our celebration album with captions and emojis.
            </p>
            <Button href="/upload" variant="primary" size="md" className="gap-2">
              <Camera className="w-4 h-4" />
              <span>Upload Guest Photos</span>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
