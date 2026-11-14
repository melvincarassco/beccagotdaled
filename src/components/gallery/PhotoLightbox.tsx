"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Calendar,
  User,
} from "lucide-react";
import { Photo } from "@/types";

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleLike: (photoId: string) => void;
  likedPhotos: Record<string, boolean>;
  likeCounts: Record<string, number>;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleLike,
  likedPhotos,
  likeCounts,
}: PhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, onNavigate, photos.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, onNavigate, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const isLiked = !!likedPhotos[currentPhoto.id];
  const count = likeCounts[currentPhoto.id] ?? currentPhoto.like_count ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white z-10">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#E8E0D3] font-medium">
            Photo {currentIndex + 1} of {photos.length}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-xs text-white/70 font-serif italic truncate max-w-xs sm:max-w-md">
            {currentPhoto.upload_source === "google_drive" ? "Official Archive" : "Guest Contribution"}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`/api/photos/${currentPhoto.id}/download`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs tracking-wider uppercase text-white transition-colors"
            title="Download high-resolution photograph"
          >
            <Download className="w-3.5 h-3.5 text-[#E8E0D3]" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close photo lightbox"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/70 text-white border border-white/20 rounded-full transition-all"
          aria-label="Previous photograph"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Cinematic Photograph Container */}
        <div className="relative w-full h-full max-w-6xl max-h-[76vh] flex items-center justify-center">
          <Image
            src={currentPhoto.display_url}
            alt={currentPhoto.caption || currentPhoto.filename}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-black/70 text-white border border-white/20 rounded-full transition-all"
          aria-label="Next photograph"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Caption & Engagement Bar */}
      <div className="px-6 py-4 bg-black/60 border-t border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
        <div className="flex-1 max-w-3xl">
          <p className="font-serif text-base sm:text-lg text-white font-light leading-relaxed">
            {currentPhoto.caption || currentPhoto.filename.replace(/\.[^/.]+$/, "")}
          </p>

          <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E8E0D3]" />
              <span>{currentPhoto.uploader_name || "Rebecca & Dale"}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#E8E0D3]" />
              <span>{new Date(currentPhoto.uploaded_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* Engagement Controls */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            onClick={() => onToggleLike(currentPhoto.id)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs tracking-wider transition-all ${
              isLiked
                ? "bg-red-600/90 border-red-500 text-white"
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
            <span>{count} {count === 1 ? "Like" : "Likes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
