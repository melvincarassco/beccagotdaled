"use client";

import React from "react";
import { Download, Smartphone, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Photo } from "@/types";

interface HeicDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
}

export function HeicDownloadModal({ isOpen, onClose, photo }: HeicDownloadModalProps) {
  if (!isOpen || !photo) return null;

  const jpgUrl = `/api/photos/${photo.id}/download?format=jpeg`;
  const heicUrl = `/api/photos/${photo.id}/download`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FEFDF6] border border-[#DCD9C9] max-w-sm w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#545454] hover:text-[#02084B] p-1 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tag */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
            Android Compatibility
          </span>
        </div>

        {/* Heading */}
        <h3 className="font-serif text-xl text-[#02084B] uppercase mb-2">
          Download Photo
        </h3>

        {/* Message */}
        <p className="text-xs text-[#545454] leading-relaxed mb-5">
          This photo was captured in Apple <strong>HEIC</strong> format. Android galleries, WhatsApp, and Google Photos work best with standard <strong>JPEG</strong>.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Recommended JPG Button */}
          <a
            href={jpgUrl}
            download
            onClick={onClose}
            className="flex items-center justify-between w-full px-4 py-3 bg-[#02084B] text-white hover:bg-[#304254] transition-colors rounded text-xs font-medium group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div className="text-left">
                <div className="font-semibold tracking-wide">Download as JPG</div>
                <div className="text-[10px] text-white/70">Recommended for Android &amp; PC</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-white/70 group-hover:translate-y-0.5 transition-transform" />
          </a>

          {/* Original HEIC Button */}
          <a
            href={heicUrl}
            download
            onClick={onClose}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-[#DCD9C9] text-[#545454] hover:text-[#02084B] hover:border-[#02084B] transition-colors rounded text-xs"
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-[#545454]" />
              <div className="text-left">
                <div className="font-medium">Download Original HEIC</div>
                <div className="text-[10px] text-[#888888]">Raw Apple format</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-[#545454]" />
          </a>
        </div>
      </div>
    </div>
  );
}
