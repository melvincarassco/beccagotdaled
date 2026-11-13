"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowUpRight, Camera, Filter } from "lucide-react";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";
import { Button } from "@/components/ui/Button";

interface TeaserPhoto {
  id: string;
  url: string;
  caption: string;
  category: "all" | "drive" | "guests";
  source: "Official Google Drive" | "Guest Upload";
  uploader: string;
  likes: number;
}

const sampleTeaserPhotos: TeaserPhoto[] = [
  {
    id: "photo-1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    caption: "The golden hour embrace under Surrey oaks ✨💍",
    category: "drive",
    source: "Official Google Drive",
    uploader: "Becca & Dale",
    likes: 42,
  },
  {
    id: "photo-2",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    caption: "Exchange of vows and teary eyes 🕊️",
    category: "drive",
    source: "Official Google Drive",
    uploader: "Becca & Dale",
    likes: 38,
  },
  {
    id: "photo-3",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    caption: "Becca looking ethereal in silk satin 🤍",
    category: "drive",
    source: "Official Google Drive",
    uploader: "Becca & Dale",
    likes: 56,
  },
  {
    id: "photo-4",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    caption: "Our table cheering for the speeches! So honored to celebrate you both! 🥂",
    category: "guests",
    source: "Guest Upload",
    uploader: "Sarah Jenkins (Table 4)",
    likes: 29,
  },
  {
    id: "photo-5",
    url: "https://images.unsplash.com/photo-1510076857177-7470076d4498?auto=format&fit=crop&w=1200&q=80",
    caption: "Champagne tower flowing non-stop 🍾✨",
    category: "guests",
    source: "Guest Upload",
    uploader: "Marcus Vance",
    likes: 34,
  },
  {
    id: "photo-6",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
    caption: "The floral arbor detail was perfection 🌿🌸",
    category: "drive",
    source: "Official Google Drive",
    uploader: "Becca & Dale",
    likes: 24,
  },
];

export function GalleryTeaser() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    sampleTeaserPhotos.reduce((acc, p) => ({ ...acc, [p.id]: p.likes }), {})
  );

  const filteredPhotos =
    activeCategory === "all"
      ? sampleTeaserPhotos
      : sampleTeaserPhotos.filter((p) => p.category === activeCategory);

  const toggleLike = (photoId: string) => {
    setLikedPhotos((prev) => {
      const isCurrentlyLiked = !!prev[photoId];
      const nextLiked = !isCurrentlyLiked;
      setLikeCounts((cPrev) => ({
        ...cPrev,
        [photoId]: (cPrev[photoId] || 0) + (nextLiked ? 1 : -1),
      }));
      return { ...prev, [photoId]: nextLiked };
    });
  };

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 bg-[#FDFBF7] border-t border-[#EAE3D9]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-xs tracking-[0.25em] uppercase text-[#C5A059] font-medium">
                Photo Gallery Preview
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#22201E] font-normal leading-tight">
              Curated Wedding Moments
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#746E65] font-light max-w-md mt-4 md:mt-0 leading-relaxed">
            A combined tapestry of official photography from Google Drive and candid memories
            captured through our guests&rsquo; eyes.
          </p>
        </div>

        {/* Filter Pills - Portraits and Ceremony removed */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-10 pb-4 border-b border-[#EAE3D9]">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#746E65] mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C5A059]" />
            <span>Filter:</span>
          </span>
          {[
            { label: "All Moments", value: "all" },
            { label: "Official Collection", value: "drive" },
            { label: "Guest Captures", value: "guests" },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`text-xs tracking-[0.16em] uppercase px-4 py-1.5 transition-all duration-200 ${
                activeCategory === cat.value
                  ? "bg-[#22201E] text-white"
                  : "bg-white text-[#746E65] border border-[#EAE3D9] hover:border-[#C5A059] hover:text-[#22201E]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Masonry / Grid Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPhotos.map((photo) => {
            const isLiked = !!likedPhotos[photo.id];
            const currentCount = likeCounts[photo.id] || photo.likes;

            return (
              <div
                key={photo.id}
                className="group relative bg-white border border-[#EAE3D9] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
              >
                {/* Photo Display with Watermark */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5EFEB]">
                  <Image
                    src={photo.url}
                    alt={photo.caption}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  {/* Gradient for caption legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Source Badge */}
                  <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#D9CEB2] px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-[#22201E] font-sans">
                    {photo.source}
                  </div>

                  {/* Watermark #beccagotdaled on every photo */}
                  <WatermarkBadge size="sm" />

                  {/* Hover Actions Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button
                      type="button"
                      onClick={() => toggleLike(photo.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-md rounded-full border text-xs tracking-wider transition-colors ${
                        isLiked
                          ? "bg-red-500/80 border-red-400 text-white"
                          : "bg-black/40 border-white/30 text-white hover:bg-black/60"
                      }`}
                      aria-label="Like photo"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked ? "fill-white text-white" : "text-white"
                        }`}
                      />
                      <span>{currentCount}</span>
                    </button>

                    <Link
                      href="/gallery"
                      className="inline-flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase text-white/90 hover:text-white bg-black/40 backdrop-blur-md px-2.5 py-1 border border-white/30 rounded-full hover:bg-black/60 transition-colors"
                    >
                      <span>Expand</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Caption beneath photograph with emoji support & uploader credit */}
                <div className="p-4 sm:p-5 bg-white border-t border-[#EAE3D9]">
                  <p className="text-xs sm:text-sm text-[#22201E] font-light leading-relaxed mb-2 line-clamp-2">
                    {photo.caption}
                  </p>
                  <div className="flex items-center justify-between text-[11px] tracking-[0.15em] uppercase text-[#746E65]">
                    <span>By {photo.uploader}</span>
                    <span className="text-[#C5A059] flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current" />
                      {currentCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA to View Complete Gallery */}
        <div className="mt-16 text-center">
          <Button href="/gallery" variant="dark" size="lg" className="min-w-[240px]">
            Browse Complete Photo Gallery
          </Button>
        </div>
      </div>
    </section>
  );
}
