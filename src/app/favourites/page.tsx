import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Heart, Sparkles } from "lucide-react";

export default function FavouritesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF6]">
      <Navbar />
      <main className="flex-1 pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-[#DCD9C9] bg-white text-[11px] tracking-[0.28em] uppercase text-[#02084B] mb-4">
              <Sparkles className="w-3 h-3 text-[#02084B]" />
              <span>Personal Collection</span>
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#DCD9C9] mb-4 shadow-sm">
              <Heart className="w-5 h-5 text-red-600 fill-red-600" />
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-[0.06em] uppercase text-[#02084B] mb-3">
              My Favourite Moments
            </h1>
            <p className="text-xs sm:text-sm text-[#545454] font-light max-w-md mx-auto leading-relaxed">
              Your handpicked keepsake gallery of wedding photographs. Relive these memories anytime or download high-resolution copies.
            </p>
          </div>

          {/* Favourites Grid */}
          <GalleryGrid onlyFavorites={true} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
