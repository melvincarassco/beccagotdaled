import React from "react";
import { cn } from "@/lib/utils";

interface WatermarkBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function WatermarkBadge({
  className,
  size = "md",
  text = "#beccagotdaled",
}: WatermarkBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] tracking-[0.18em] px-2 py-0.5",
    md: "text-xs tracking-[0.2em] px-2.5 py-1",
    lg: "text-sm tracking-[0.22em] px-3.5 py-1.5",
  };

  return (
    <div
      className={cn(
        "absolute bottom-3 right-3 pointer-events-none select-none z-10",
        "font-serif italic font-light text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]",
        "bg-black/20 backdrop-blur-[2px] border border-white/20 rounded-[2px]",
        sizeClasses[size],
        className
      )}
      aria-label={`Watermark: ${text}`}
    >
      {text}
    </div>
  );
}
