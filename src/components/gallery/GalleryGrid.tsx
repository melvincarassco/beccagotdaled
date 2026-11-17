"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Download,
  Filter,
  ArrowUpDown,
  Maximize2,
  Camera,
  User,
} from "lucide-react";
import { Photo } from "@/types";
import { PhotoLightbox } from "./PhotoLightbox";

interface GalleryGridProps {
  initialPhotos?: Photo[];
  onlyFavorites?: boolean;
}

// Global client memory cache of likers across the app session for instant 0ms popover rendering
const likersCache = new Map<string, string[]>();

// Popover showing who liked a photo - Instant response
function LikersList({
  photoId,
  likeCount,
  initialLikers,
}: {
  photoId: string;
  likeCount: number;
  initialLikers?: string[];
}) {
  const [likers, setLikers] = useState<string[]>(() => {
    if (initialLikers && initialLikers.length > 0) {
      likersCache.set(photoId, initialLikers);
      return initialLikers;
    }
    return likersCache.get(photoId) || [];
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLikers && initialLikers.length > 0) {
      likersCache.set(photoId, initialLikers);
      setLikers(initialLikers);
    }
  }, [photoId, initialLikers]);

  const fetchLikers = async () => {
    if (likeCount === 0) return;
    if (likers.length > 0) return; // Already available, no network needed
    const cached = likersCache.get(photoId);
    if (cached && cached.length > 0) {
      setLikers(cached);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/likers`);
      const data = await res.json();
      const names = data.likers || [];
      likersCache.set(photoId, names);
      setLikers(names);
    } catch {}
    setLoading(false);
  };

  const handleTogglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && likers.length === 0 && likeCount > 0) {
      fetchLikers();
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (likeCount === 0) return null;

  return (
    <div ref={popoverRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleTogglePopover}
        onMouseEnter={() => {
          if (likers.length === 0 && likeCount > 0) fetchLikers();
        }}
        onTouchStart={() => {
          if (likers.length === 0 && likeCount > 0) fetchLikers();
        }}
        className="text-[10px] text-[#746E65] hover:text-[#02084B] underline transition-colors px-1 py-0.5 touch-manipulation font-medium active:scale-95"
        title="See who liked this"
      >
        who
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[160px] max-w-[240px] bg-white border border-[#DCD9C9] shadow-2xl z-30 p-3 rounded-none animate-in fade-in duration-150">
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#304254] mb-2 border-b border-[#E8E0D3] pb-2 font-semibold">
            Liked by
          </p>
          {loading && likers.length === 0 ? (
            <p className="text-xs text-[#746E65] animate-pulse">Loading…</p>
          ) : likers.length > 0 ? (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {likers.map((name, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-[#02084B] font-medium">
                  <User className="w-3 h-3 text-[#304254] flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#746E65] italic">No names available</p>
          )}
        </div>
      )}
    </div>
  );
}

export function GalleryGrid({ initialPhotos, onlyFavorites = false }: GalleryGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos || []);
  const [isLoading, setIsLoading] = useState(!initialPhotos);
  const [sourceFilter, setSourceFilter] = useState<"all" | "drive" | "guests" | "my_uploads">("all");
  const [sortBy, setSortBy] = useState<"latest" | "most_liked" | "oldest">("latest");
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Like tracking state
  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Check guest session and URL query param on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const s = params.get("source");
        if (s === "my_uploads" || s === "guests" || s === "all") {
          setSourceFilter(s as any);
        }
      }

      const stored = localStorage.getItem("becca_dale_guest_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName) {
          setGuestName(parsed.fullName);
          setGuestId(parsed.id);
        }
      }
    } catch {}
  }, []);

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const guestParam = guestId ? `&guestId=${guestId}` : "";
      const url = onlyFavorites
        ? "/api/photos/favourites"
        : `/api/photos?source=${sourceFilter}&sortBy=${sortBy}${guestParam}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data?.photos) {
        setPhotos(data.photos);

        const counts: Record<string, number> = {};
        const liked: Record<string, boolean> = {};

        data.photos.forEach((p: Photo) => {
          counts[p.id] = p.like_count || 0;
          if (p.is_liked_by_me || onlyFavorites) {
            liked[p.id] = true;
          }
        });

        // Also merge client-side saved likes from localStorage
        try {
          const savedLikes = JSON.parse(localStorage.getItem("becca_saved_likes") || "{}");
          Object.keys(savedLikes).forEach((id) => {
            if (savedLikes[id]) liked[id] = true;
          });
        } catch {}

        setLikeCounts((prev) => ({ ...counts, ...prev }));
        setLikedPhotos((prev) => ({ ...liked, ...prev }));
      }
    } catch (err) {
      console.error("Failed to load gallery photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [sourceFilter, sortBy, onlyFavorites]);

  // Handle toggling likes
  const handleToggleLike = async (photoId: string) => {
    const isCurrentlyLiked = !!likedPhotos[photoId];
    const nextState = !isCurrentlyLiked;
    const myName = guestName || "You";

    // Optimistic UI update
    setLikedPhotos((prev) => ({ ...prev, [photoId]: nextState }));
    setLikeCounts((prev) => ({
      ...prev,
      [photoId]: Math.max(0, (prev[photoId] || 0) + (nextState ? 1 : -1)),
    }));

    // Update photo likers in state & cache immediately
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p;
        const currentLikers = p.likers || [];
        const nextLikers = nextState
          ? currentLikers.includes(myName) ? currentLikers : [...currentLikers, myName]
          : currentLikers.filter((n) => n !== myName && n !== "You");
        likersCache.set(photoId, nextLikers);
        return {
          ...p,
          like_count: Math.max(0, (p.like_count || 0) + (nextState ? 1 : -1)),
          likers: nextLikers,
        };
      })
    );

    // Update localStorage for guest persistence
    try {
      const savedLikes = JSON.parse(localStorage.getItem("becca_saved_likes") || "{}");
      savedLikes[photoId] = nextState;
      localStorage.setItem("becca_saved_likes", JSON.stringify(savedLikes));
    } catch {}

    // Call API
    try {
      await fetch(`/api/photos/${photoId}/like`, { method: "POST" });
      if (onlyFavorites && !nextState) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="w-full">
      {/* Filters and Sorters Bar */}
      {!onlyFavorites && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-10 border-b border-[#E8E0D3] gap-4">
          {/* Source Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#02084B]" />
              <span>Collection:</span>
            </span>
            {[
              { label: "All Moments", value: "all" },
              { label: "Guest Snaps", value: "guests" },
              ...(guestName ? [{ label: "My Snaps", value: "my_uploads" }] : []),
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value as any)}
                className={`text-xs tracking-[0.16em] uppercase px-4 py-2 transition-all ${
                  sourceFilter === tab.value
                    ? "bg-[#02084B] text-white shadow-sm"
                    : "bg-white text-[#545454] border border-[#DCD9C9] hover:border-[#02084B] hover:text-[#02084B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#545454] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#02084B]" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-[#DCD9C9] text-xs uppercase tracking-wider text-[#02084B] px-3 py-1.5 focus:outline-none focus:border-[#02084B]"
            >
              <option value="latest">Latest First</option>
              <option value="most_liked">Most Cherished (Likes)</option>
              <option value="oldest">Chronological Order</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-[#DCD9C9] overflow-hidden shadow-sm">
              <div className="aspect-[4/5] w-full luxury-skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 luxury-skeleton" />
                <div className="h-3 w-1/2 luxury-skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[#DCD9C9] p-12 sm:p-16 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center mx-auto mb-4">
            <Camera className="w-6 h-6 text-[#02084B]" />
          </div>
          <h3 className="font-serif text-2xl text-[#02084B] uppercase mb-2">
            {onlyFavorites
              ? "No Favourites Saved Yet"
              : sourceFilter === "my_uploads"
              ? "No Snaps Uploaded Yet"
              : "No Photographs Found"}
          </h3>
          <p className="text-xs text-[#545454] leading-relaxed mb-6">
            {onlyFavorites
              ? "Click the heart icon on any photo in the gallery to curate your own personal collection of wedding memories."
              : sourceFilter === "my_uploads"
              ? `You haven't contributed any photos yet${guestName ? `, ${guestName}` : ""}. Capture a candid moment and share it with Rebecca & Dale!`
              : "No photographs match the selected filter. Try selecting 'All Moments' or upload your own snaps."}
          </p>
          {onlyFavorites ? (
            <a
              href="/gallery"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 bg-[#02084B] text-white hover:bg-[#040D44] transition-colors"
            >
              <span>Browse Full Photo Gallery</span>
            </a>
          ) : sourceFilter === "my_uploads" ? (
            <a
              href="/upload"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest px-6 py-3 bg-[#02084B] text-white hover:bg-[#040D44] transition-colors"
            >
              <span>Upload Your First Snap</span>
            </a>
          ) : null}
        </div>
      ) : (
        /* Masonry Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {photos.map((photo, index) => {
            const isLiked = !!likedPhotos[photo.id];
            const currentCount = likeCounts[photo.id] ?? photo.like_count ?? 0;
            const imgSrc = photo.thumbnail_url || photo.display_url;
            const isGuestUpload = photo.upload_source !== "google_drive";

            return (
              <div
                key={photo.id}
                className="group relative bg-white border border-[#DCD9C9] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                {/* Photo Display Card */}
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-[#F2EEEB] cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={photo.caption || photo.filename}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      // If the view proxy endpoint failed, fallback to original storage path
                      if (photo.original_storage_path && target.src !== photo.original_storage_path) {
                        target.src = photo.original_storage_path;
                      }
                    }}
                  />

                  {/* Gradient Legibility Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Source Badge */}
                  <div className="absolute top-3 left-3 bg-[#FEFDF6]/90 backdrop-blur-sm border border-[#DCD9C9] px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase text-[#02084B] font-sans">
                    {isGuestUpload ? "Guest Snap" : "Rebecca & Dale"}
                  </div>

                  {/* Top Right Expand Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 touch-manipulation"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom Hover Action Bar - visible on mobile / touch */}
                  <div
                    className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Heart / Like Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(photo.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md rounded-full border text-xs tracking-wider transition-all active:scale-95 touch-manipulation ${
                        isLiked
                          ? "bg-red-600/90 border-red-500 text-white"
                          : "bg-black/50 border-white/30 text-white hover:bg-black/70"
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

                    {/* Direct Download Button */}
                    <a
                      href={`/api/photos/${photo.id}/download`}
                      download
                      className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase text-white bg-black/50 backdrop-blur-md px-3 py-1.5 border border-white/30 rounded-full hover:bg-black/70 transition-colors touch-manipulation"
                      title="Download high-resolution image"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {/* Caption beneath photograph */}
                <div className="p-4 sm:p-5 bg-white border-t border-[#E8E0D3] flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-[#02084B] font-light leading-relaxed mb-3 line-clamp-2">
                    {photo.caption || photo.filename.replace(/\.[^/.]+$/, "")}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D3]/60 gap-2">
                    {/* Uploader name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3 h-3 text-[#304254] flex-shrink-0" />
                      <span className={`text-[11px] tracking-[0.12em] uppercase truncate max-w-[130px] ${isGuestUpload ? "text-[#02084B] font-medium" : "text-[#545454]"}`}>
                        {photo.uploader_name || "Rebecca & Dale"}
                      </span>
                    </div>

                    {/* Directly clickable Like Button on card footer + who liked trigger */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(photo.id);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs tracking-wider transition-all active:scale-95 touch-manipulation ${
                          isLiked
                            ? "bg-red-50 text-red-600 border-red-200 font-medium"
                            : "bg-[#FEFDF6] text-[#545454] border-[#DCD9C9] hover:border-red-300 hover:text-red-600"
                        }`}
                        aria-label={isLiked ? "Unlike photo" : "Like photo"}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? "fill-red-600 text-red-600" : "text-[#545454]"
                          }`}
                        />
                        <span>{currentCount}</span>
                      </button>

                      <LikersList
                        photoId={photo.id}
                        likeCount={currentCount}
                        initialLikers={photo.likers}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <PhotoLightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
        onToggleLike={handleToggleLike}
        likedPhotos={likedPhotos}
        likeCounts={likeCounts}
      />
    </div>
  );
}
