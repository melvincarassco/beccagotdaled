import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { GuestUploadCallout } from "@/components/home/GuestUploadCallout";
import { Sparkles } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-28 pb-20 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#C5A059] mb-4">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span>Guest Photo Contributions</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl tracking-[0.06em] uppercase text-[#22201E]">
            Upload Your Photos
          </h1>
          <div className="w-16 h-[1.5px] bg-[#C5A059] mx-auto my-4" />
        </div>

        <GuestUploadCallout />
      </main>
      <Footer />
    </div>
  );
}
