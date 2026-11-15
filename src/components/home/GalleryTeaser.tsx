"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowUpRight, Camera, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/types";

export function GalleryTeaser() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch("/api/photos?sortBy=latest");
        const data = await res.json();
        if (data?.photos) {
          const fetched: Photo[] = data.photos.slice(0, 6);
          setPhotos(fetched);
          const counts: Record<string, number> = {};
          fetched.forEach((p) => {
            counts[p.id] = p.like_count || 0;
          });
          setLikeCounts(counts);
        }
      } catch (err) {
        console.error("GalleryTeaser fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  const filteredPhotos =
    activeCategory === "all"
      ? photos
      : photos.filter((p) =>
          activeCategory === "drive"
            ? p.upload_source === "google_drive"
            : p.upload_source !== "google_drive"
        );

  const toggleLike = (photoId: string) => {
    setLikedPhotos((prev) => {
      const isCurrentlyLiked = !!prev[photoId];
      const nextLiked = !isCurrentlyLiked;
      setLikeCounts((cPrev) => ({
        ...cPrev,
        [photoId]: Math.max(0, (cPrev[photoId] || 0) + (nextLiked ? 1 : -1)),
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-10 pb-4 border-b border-[#EAE3D9]">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#746E65] mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#C5A059]" />
            <span>Filter:</span>
          </span>
          {[
            { label: "All Moments", value: "all" },
            { label: "Guest Snaps", value: "guests" },
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

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#EAE3D9] overflow-hidden shadow-sm">
                <div className="aspect-[4/5] w-full bg-[#F0EBE4] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-3/4 bg-[#E8E3DB] animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-[#E8E3DB] animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16 text-[#746E65] text-sm">
            No photos available yet.{" "}
            <Link href="/gallery" className="underline text-[#C5A059]">
              Visit the gallery
            </Link>{" "}
            to explore.
          </div>
        ) : (
          /* Masonry / Grid Display */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPhotos.map((photo) => {
              const isLiked = !!likedPhotos[photo.id];
              const currentCount = likeCounts[photo.id] ?? photo.like_count ?? 0;
              const imgSrc = photo.thumbnail_url || photo.display_url;
              const sourceLabel =
                photo.upload_source === "google_drive" ? "Rebecca & Dale" : "Guest Snap";

              return (
                <div
                  key={photo.id}
                  className="group relative bg-white border border-[#EAE3D9] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  {/* Photo Display */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5EFEB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={photo.caption || photo.filename}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Source Badge */}
                    <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#D9CEB2] px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase text-[#22201E] font-sans">
                      {sourceLabel}
                    </div>

                    {/* Hover Actions */}
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

                  {/* Caption */}
                  <div className="p-4 sm:p-5 bg-white border-t border-[#EAE3D9]">
                    <p className="text-xs sm:text-sm text-[#22201E] font-light leading-relaxed mb-2 line-clamp-2">
                      {photo.caption || photo.filename.replace(/\.[^/.]+$/, "")}
                    </p>
                    <div className="flex items-center justify-between text-[11px] tracking-[0.15em] uppercase text-[#746E65]">
                      <span>By {photo.uploader_name}</span>
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
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button href="/gallery" variant="dark" size="lg" className="min-w-[240px]">
            Browse Complete Photo Gallery
          </Button>
        </div>
      </div>
    </section>
  );
}
