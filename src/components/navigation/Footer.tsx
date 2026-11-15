import React from "react";
import Link from "next/link";
import { Heart, Camera } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#22201E] text-[#FAF7F2] border-t border-[#35322E] pt-20 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand & Monogram */}
          <div className="md:col-span-5 flex flex-col items-start space-y-4">
            <div className="inline-block border border-[#C5A059]/40 px-3 py-1 text-[11px] tracking-[0.25em] text-[#C5A059] uppercase">
              The Wedding Archive
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl tracking-[0.15em] uppercase text-white">
              Becca & Dale
            </h3>
            <p className="font-serif italic text-white/70 text-base max-w-sm font-light">
              &ldquo;Two lives, one journey, forever intertwined under the Surrey skies.&rdquo;
            </p>
            <div className="pt-2">
              <span className="text-xs tracking-[0.25em] uppercase text-[#C5A059] font-sans">
                #beccagotdaled
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/90 font-medium">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs tracking-[0.16em] uppercase text-white/60">
              <li>
                <Link href="/gallery" className="hover:text-[#C5A059] transition-colors">
                  Full Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/favourites" className="hover:text-[#C5A059] transition-colors">
                  My Favourites
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-[#C5A059] transition-colors">
                  Upload Guest Photos
                </Link>
              </li>
            </ul>
          </div>

          {/* Guest & Admin Access */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/90 font-medium">
              Guest Community
            </h4>
            <p className="text-xs text-white/65 leading-relaxed tracking-wide">
              All guests are invited to browse high-resolution memories and contribute candid photos.
              Every photo carries our celebration hashtag watermark: <strong className="text-white">#beccagotdaled</strong>.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/guest-login"
                className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-[#C5A059] hover:text-white transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Guest Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] tracking-[0.16em] text-white/40 uppercase space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} Becca & Dale Wedding. All memories cherished.
          </div>
          <div className="flex items-center space-x-1 text-white/50">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
            <span>for #beccagotdaled</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
