import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FavouritesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 bg-[#FAF7F2] px-6 sm:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-[#D9CEB2] mb-6 shadow-sm">
            <Heart className="w-6 h-6 text-[#C5A059]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl tracking-[0.06em] uppercase text-[#22201E] mb-4">
            My Favourites
          </h1>
          <p className="text-xs sm:text-sm text-[#746E65] font-light max-w-md mx-auto mb-10 leading-relaxed">
            Your personalized collection of cherished wedding photographs. Click the heart icon on any photo in the gallery to add it here.
          </p>

          <div className="bg-white border border-[#EAE3D9] p-12 max-w-lg mx-auto">
            <p className="text-sm font-serif italic text-[#746E65] mb-6">
              You haven&rsquo;t saved any favourite photos yet. Explore our gallery to bookmark your favourite moments.
            </p>
            <Button href="/gallery" variant="primary" size="md" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse Photo Gallery</span>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
