"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import {
  UploadCloud,
  CheckCircle2,
  X,
  Sparkles,
  Camera,
  Smile,
  AlertCircle,
  FileCheck,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

const EMOJI_SHORTCUTS = ["💍", "✨", "🥂", "🤍", "🎉", "🕊️", "🍾", "💐", "📸", "💃"];

// Helper to lightly downscale large photos on phone/desktop before upload to prevent payload size limits
async function compressImageIfNeeded(file: File): Promise<Blob> {
  // If file is smaller than 2.5MB, no compression needed
  if (file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement("img");
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 2400; // Ultra high resolution for luxury weddings

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check current guest session
  useEffect(() => {
    fetch("/api/guests/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.guest) {
          setGuestName(data.guest.fullName);
          setGuestId(data.guest.id);
        } else {
          try {
            const stored = localStorage.getItem("becca_dale_guest_session");
            if (stored) {
              const parsed = JSON.parse(stored);
              setGuestName(parsed.fullName);
              setGuestId(parsed.id);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setStatusMessage(null);

    const validExtensions = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const newItems: UploadFileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!validExtensions.includes(file.type.toLowerCase())) {
        setStatusMessage({
          type: "error",
          text: `Skipped "${file.name}": Only JPEG, PNG, and WebP images are supported.`,
        });
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        setStatusMessage({
          type: "error",
          text: `Skipped "${file.name}": File size exceeds the 25MB limit.`,
        });
        continue;
      }

      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleCaptionChange = (id: string, text: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption: text } : item))
    );
  };

  const addEmojiToCaption = (id: string, emoji: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, caption: `${item.caption} ${emoji}`.trim() } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsUploading(true);
    setUploadProgress(5);
    setStatusMessage(null);

    let successCount = 0;
    const total = items.length;
    const errors: string[] = [];

    // Process and upload file by file to prevent payload limit (4.5MB) and timeouts on mobile
    for (let i = 0; i < total; i++) {
      const item = items[i];
      setUploadProgress(Math.round(((i + 0.1) / total) * 100));

      try {
        const processedBlob = await compressImageIfNeeded(item.file);
        const singleFormData = new FormData();
        singleFormData.append("files", processedBlob, item.file.name);

        const captionsMap: Record<string, string> = {};
        if (item.caption) {
          captionsMap[item.file.name] = item.caption;
        }
        singleFormData.append("captions", JSON.stringify(captionsMap));
        if (guestId) singleFormData.append("guestId", guestId);
        if (guestName) singleFormData.append("uploaderName", guestName);

        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: singleFormData,
        });

        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          errors.push(errData.error || `Failed to upload ${item.file.name}`);
        }
      } catch (uploadErr: any) {
        errors.push(`Upload error for ${item.file.name}`);
      }

      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    if (successCount > 0) {
      setStatusMessage({
        type: "success",
        text: `Successfully uploaded ${successCount} photograph${successCount > 1 ? "s" : ""}! They are now live in the gallery.`,
      });
      // Clear items
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setItems([]);
    } else {
      setStatusMessage({
        type: "error",
        text: errors.join(" • ") || "Failed to upload photographs. Please try again.",
      });
    }

    setIsUploading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FEFDF6]">
      <Navbar />
      <main className="flex-1 pt-28 pb-24 px-6 sm:px-10 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 border border-[#DCD9C9] bg-white text-[11px] tracking-[0.28em] uppercase text-[#02084B] mb-4">
            <Sparkles className="w-3 h-3 text-[#02084B]" />
            <span>Guest Photo Contributions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#02084B]">
            Share Your Perspective
          </h1>
          <div className="w-12 h-[1px] bg-[#02084B]/40 mx-auto my-3" />
          <p className="text-xs sm:text-sm text-[#545454] font-light leading-relaxed">
            Contribute high-resolution memories from your phone or camera to Rebecca &amp; Dale&rsquo;s wedding album. Every photo will feature our official <strong className="text-[#02084B]">#beccagotdaled</strong> watermark.
          </p>

          {/* Guest Identity Tag */}
          <div className="mt-4">
            {guestName ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F2EEEB] border border-[#E8E0D3] text-xs text-[#02084B]">
                <User className="w-3.5 h-3.5 text-[#02084B]" />
                <span>Uploading as: <strong>{guestName}</strong></span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-[#545454]">
                <span>Are you signed in?</span>
                <Link href="/guest-login" className="text-[#02084B] font-medium underline underline-offset-4 hover:text-[#304254]">
                  Sign In to credit your photos
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-4 mb-8 text-xs flex items-start gap-2.5 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{statusMessage.text}</span>
              {statusMessage.type === "success" && (
                <div className="mt-2">
                  <Link
                    href="/gallery"
                    className="inline-flex items-center gap-1 font-medium text-emerald-800 underline uppercase tracking-wider text-[11px]"
                  >
                    <span>Browse Wedding Gallery</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed p-8 sm:p-14 text-center transition-all bg-white cursor-pointer ${
            isDragging
              ? "border-[#02084B] bg-[#F2EEEB]"
              : "border-[#DCD9C9] hover:border-[#02084B]/60"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-[#FEFDF6] border border-[#DCD9C9] flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-7 h-7 text-[#02084B]" />
          </div>

          <h3 className="font-serif text-xl sm:text-2xl text-[#02084B] mb-2">
            Drag &amp; drop wedding photos here
          </h3>
          <p className="text-xs text-[#545454] max-w-md mx-auto mb-4 font-light">
            Tap to select multiple memories from your device (JPEG, PNG, WebP up to 25MB each).
          </p>

          <Button type="button" variant="secondary" size="sm" className="gap-2 pointer-events-none">
            <Camera className="w-3.5 h-3.5" />
            <span>Select Photos From Library</span>
          </Button>
        </div>

        {/* Selected Photos & Caption Editor Form */}
        {items.length > 0 && (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D3]">
              <h3 className="font-serif text-lg sm:text-xl text-[#02084B] uppercase tracking-wide">
                Photographs to Upload ({items.length})
              </h3>
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-xs tracking-wider uppercase text-red-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#DCD9C9] p-4 flex flex-col sm:flex-row gap-4 shadow-sm"
                >
                  {/* Thumbnail Preview with Watermark */}
                  <div className="relative aspect-[4/3] sm:w-40 sm:h-32 flex-shrink-0 bg-[#F2EEEB] overflow-hidden">
                    <Image
                      src={item.previewUrl}
                      alt={item.file.name}
                      fill
                      className="object-cover"
                    />
                    <WatermarkBadge size="sm" />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption & Emoji controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-[#545454] truncate mb-1">
                        {item.file.name}
                      </div>

                      <label className="block text-[10px] tracking-wider uppercase text-[#02084B] font-medium mb-1">
                        Add Personalized Caption
                      </label>
                      <textarea
                        rows={2}
                        maxLength={280}
                        value={item.caption}
                        onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                        placeholder="Share a memory, table toast, or congratulatory message..."
                        className="w-full p-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs text-[#02084B] focus:outline-none focus:border-[#02084B] resize-none"
                      />
                    </div>

                    {/* Quick Emojis */}
                    <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                      <span className="text-[10px] text-[#545454] flex items-center gap-0.5">
                        <Smile className="w-3 h-3 text-[#02084B]" />
                      </span>
                      {EMOJI_SHORTCUTS.slice(0, 7).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmojiToCaption(item.id, emoji)}
                          className="hover:scale-125 transition-transform text-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="p-4 bg-white border border-[#DCD9C9]">
                <div className="flex items-center justify-between text-xs text-[#02084B] font-medium mb-1.5">
                  <span>Applying #beccagotdaled Watermark &amp; Processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#F2EEEB] overflow-hidden">
                  <div
                    className="h-full bg-[#02084B] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#545454]">
                <FileCheck className="w-4 h-4 text-[#02084B]" />
                <span>Photos are reviewed by Rebecca &amp; Dale before displaying publicly</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isUploading}
                className="w-full sm:w-auto min-w-[240px]"
              >
                Upload {items.length} Photograph{items.length > 1 ? "s" : ""}
              </Button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
