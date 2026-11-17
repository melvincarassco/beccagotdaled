"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  status: "idle" | "uploading" | "done" | "error";
  errorMessage?: string;
  isHeic: boolean;
}

const EMOJI_SHORTCUTS = ["💍", "✨", "🥂", "🤍", "🎉", "🕊️", "🍾", "💐", "📸", "💃"];

export default function UploadPage() {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState("");
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

    const validExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "avif"];
    const newItems: UploadFileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isImg = file.type.startsWith("image/") || validExtensions.includes(ext);

      if (!isImg) {
        setStatusMessage({
          type: "error",
          text: `Skipped "${file.name}": Only photograph files (JPEG, PNG, WebP, HEIC) are supported.`,
        });
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setStatusMessage({
          type: "error",
          text: `Skipped "${file.name}": File size exceeds the 50MB limit.`,
        });
        continue;
      }

      const isHeic =
        file.type.includes("heic") ||
        file.type.includes("heif") ||
        /\.hei[cf]$/i.test(file.name);

      newItems.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
        file,
        previewUrl: isHeic ? "" : URL.createObjectURL(file),
        caption: "",
        status: "idle",
        isHeic,
      });
    }

    setItems((prev) => [...prev, ...newItems]);

    // Reset file input value so guests can select more files or re-select
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found && found.previewUrl) {
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

  // Upload an individual photograph: prefers direct Presigned R2 PUT to bypass Vercel limits
  const uploadSingleItem = async (item: UploadFileItem): Promise<boolean> => {
    // 1. Try Direct Presigned Cloudflare R2 Upload
    try {
      const presignRes = await fetch("/api/photos/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          mimeType: item.file.type || "image/jpeg",
          fileSize: item.file.size,
          guestId,
          uploaderName: guestName,
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        if (presignData.success && presignData.uploadUrl) {
          // Direct PUT to Cloudflare R2
          const putRes = await fetch(presignData.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": item.file.type || "application/octet-stream",
            },
            body: item.file,
          });

          if (putRes.ok) {
            // Confirm with database completion endpoint
            const compRes = await fetch("/api/photos/upload/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: presignData.key,
                filename: item.file.name,
                mimeType: item.file.type || "image/jpeg",
                caption: item.caption,
                guestId,
                uploaderName: guestName,
                displayUrl: presignData.displayUrl,
              }),
            });

            if (compRes.ok) {
              return true;
            }
          }
        }
      }
    } catch (presignErr) {
      console.warn("Direct R2 presigned upload error, falling back to server route:", presignErr);
    }

    // 2. Fallback to standard serverless upload route
    try {
      const singleFormData = new FormData();
      singleFormData.append("files", item.file, item.file.name);
      if (item.caption) {
        singleFormData.append("captions", JSON.stringify({ [item.file.name]: item.caption }));
      }
      if (guestId) singleFormData.append("guestId", guestId);
      if (guestName) singleFormData.append("uploaderName", guestName);

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: singleFormData,
      });

      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pendingItems = items.filter((i) => i.status !== "done");
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    setUploadProgress(5);
    setStatusMessage(null);

    const total = pendingItems.length;
    let completedCount = 0;
    let successCount = 0;
    const errors: string[] = [];

    // Parallel upload with concurrency of 3 workers
    const concurrency = Math.min(3, pendingItems.length);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pendingItems.length) {
        const itemIdx = currentIndex++;
        const item = pendingItems[itemIdx];

        // Mark item as uploading
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i))
        );

        setUploadProgressText(`Uploading ${completedCount + 1} of ${total} photographs...`);

        const success = await uploadSingleItem(item);

        if (success) {
          successCount++;
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i))
          );
        } else {
          errors.push(item.file.name);
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: "error", errorMessage: "Failed to upload. Tap to retry." }
                : i
            )
          );
        }

        completedCount++;
        setUploadProgress(Math.round((completedCount / total) * 100));
        setUploadProgressText(`Completed ${completedCount} of ${total} photographs`);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    if (successCount === total) {
      setStatusMessage({
        type: "success",
        text: `Successfully uploaded all ${successCount} photograph${successCount > 1 ? "s" : ""}! They are now live in the wedding gallery.`,
      });
      // Clear items and release object URLs
      items.forEach((i) => {
        if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      });
      setItems([]);
    } else if (successCount > 0) {
      setStatusMessage({
        type: "error",
        text: `Uploaded ${successCount} of ${total} photographs. ${errors.length} photograph${errors.length > 1 ? "s" : ""} encountered a network error — tap Retry below.`,
      });
      // Remove successfully uploaded items, keep failed ones for easy retry
      setItems((prev) => {
        const remaining = prev.filter((i) => i.status !== "done");
        prev
          .filter((i) => i.status === "done")
          .forEach((i) => {
            if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
          });
        return remaining;
      });
    } else {
      setStatusMessage({
        type: "error",
        text: "Failed to upload photographs. Please check your network connection and try again.",
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
            Contribute high-resolution memories from your phone or camera to Rebecca &amp; Dale&rsquo;s wedding album. Full raw quality is preserved for every photograph.
          </p>

          {/* Guest Identity Tag */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {guestName ? (
              <>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F2EEEB] border border-[#E8E0D3] text-xs text-[#02084B]">
                  <User className="w-3.5 h-3.5 text-[#02084B]" />
                  <span>Uploading as: <strong>{guestName}</strong></span>
                </div>
                <Link
                  href="/gallery?source=my_uploads"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#02084B] text-white text-xs tracking-wider uppercase hover:bg-[#1a237e] transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>View My Uploads</span>
                </Link>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-[#545454]">
                <span>Are you signed in?</span>
                <Link href="/guest-login" className="underline text-[#02084B] font-medium">
                  Sign in with your invitation name
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-8 p-4 border flex items-start gap-3 text-xs leading-relaxed ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
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
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/gallery?source=my_uploads"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#02084B] text-white text-xs uppercase tracking-wider hover:bg-[#1a237e] transition-colors"
                  >
                    <span>View My Uploads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/gallery"
                    className="inline-flex items-center gap-1 font-medium text-emerald-800 underline uppercase tracking-wider text-[11px]"
                  >
                    <span>Browse All Photos</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Drag & Drop Zone */}
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
          className={`border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-colors bg-white ${
            isDragging
              ? "border-[#02084B] bg-[#FEFDF6]"
              : "border-[#DCD9C9] hover:border-[#02084B]"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*, .heic, .heif"
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
            Select as many memories as you like (JPEG, PNG, WebP, HEIC/iPhone photos up to 50MB each). Direct high-speed upload with no quantity limits.
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
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs tracking-wider uppercase text-[#02084B] font-medium hover:underline"
                >
                  + Add More Photos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    items.forEach((i) => {
                      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
                    });
                    setItems([]);
                  }}
                  className="text-xs tracking-wider uppercase text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border p-4 flex flex-col sm:flex-row gap-4 shadow-sm transition-all ${
                    item.status === "error"
                      ? "border-red-300 bg-red-50/20"
                      : item.status === "done"
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-[#DCD9C9]"
                  }`}
                >
                  {/* Thumbnail Preview with Watermark & Status Overlay */}
                  <div className="relative aspect-[4/3] sm:w-40 sm:h-32 flex-shrink-0 bg-[#F2EEEB] overflow-hidden flex items-center justify-center">
                    {item.isHeic || !item.previewUrl ? (
                      <div className="w-full h-full p-3 bg-[#FEFDF6] flex flex-col items-center justify-center text-center border border-[#E8E0D3]">
                        <Camera className="w-6 h-6 text-[#02084B] mb-1 opacity-70" />
                        <span className="text-[10px] uppercase tracking-wider text-[#02084B] font-semibold">
                          Raw Apple Photo
                        </span>
                        <span className="text-[9px] text-[#545454] mt-0.5 font-mono">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <WatermarkBadge size="sm" />

                    {/* Status Overlays */}
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 bg-[#02084B]/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-1.5">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-[11px] uppercase tracking-wider">Uploading</span>
                      </div>
                    )}
                    {item.status === "done" && (
                      <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-1">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-wider text-emerald-200">Uploaded</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium gap-1">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <span className="text-[10px] uppercase tracking-wider text-red-200">Failed</span>
                      </div>
                    )}

                    {/* Remove Button */}
                    {item.status !== "uploading" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Caption & Emoji controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[11px] font-mono text-[#545454] truncate max-w-[200px]">
                          {item.file.name}
                        </div>
                        <span className="text-[10px] text-[#545454]">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      <label className="block text-[10px] tracking-wider uppercase text-[#02084B] font-medium mb-1">
                        Add Personalized Caption
                      </label>
                      <textarea
                        rows={2}
                        maxLength={280}
                        value={item.caption}
                        disabled={item.status === "uploading" || item.status === "done"}
                        onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                        placeholder="Share a memory, table toast, or congratulatory message..."
                        className="w-full p-2 bg-[#FEFDF6] border border-[#DCD9C9] text-xs text-[#02084B] focus:outline-none focus:border-[#02084B] resize-none disabled:opacity-60"
                      />
                    </div>

                    {/* Quick Emojis & Error Notice */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#545454] flex items-center gap-0.5">
                          <Smile className="w-3 h-3 text-[#02084B]" />
                        </span>
                        {EMOJI_SHORTCUTS.slice(0, 7).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            disabled={item.status === "uploading" || item.status === "done"}
                            onClick={() => addEmojiToCaption(item.id, emoji)}
                            className="hover:scale-125 transition-transform text-sm disabled:opacity-40"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {item.status === "error" && (
                        <button
                          type="button"
                          onClick={() => {
                            setItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, status: "idle" } : i))
                            );
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:underline uppercase tracking-wider font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="p-4 bg-white border border-[#DCD9C9] shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#02084B] font-medium mb-1.5">
                  <span>{uploadProgressText || "Uploading memories directly to Cloudflare R2..."}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#F2EEEB] overflow-hidden">
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
                <span>
                  {items.filter((i) => i.status !== "done").length} photograph(s) queued for upload (100% original quality)
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isUploading || items.filter((i) => i.status !== "done").length === 0}
                className="w-full sm:w-auto gap-2 min-w-[240px]"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Uploading Memories... ({uploadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload {items.filter((i) => i.status !== "done").length} Photograph{items.filter((i) => i.status !== "done").length > 1 ? "s" : ""}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
