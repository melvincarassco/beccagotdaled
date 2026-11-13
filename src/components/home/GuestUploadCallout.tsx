import React from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GuestUploadCallout() {
  const steps = [
    {
      num: "01",
      title: "Sign In as a Guest",
      desc: "Enter your first and last name so we can record who contributed each memory.",
    },
    {
      num: "02",
      title: "Upload Your Moments",
      desc: "Drag & drop photos directly from your phone camera roll or computer (JPEG, PNG, WebP).",
    },
    {
      num: "03",
      title: "Caption & Share",
      desc: "Add your personal captions and emojis before submitting to the wedding album.",
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 bg-[#FAF7F2] border-t border-[#EAE3D9] relative overflow-hidden">
      {/* Background Champagne Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#DFC697]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="bg-[#FDFBF7] border border-[#D9CEB2] p-8 sm:p-14 md:p-16 shadow-[0_20px_50px_rgba(34,32,30,0.06)]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#C5A059] mb-4">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Guest Photography Portal</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#22201E] font-normal leading-tight">
              Share Your Perspective
            </h2>

            <div className="w-12 h-[1px] bg-[#C5A059] mx-auto my-4" />

            <p className="text-xs sm:text-sm text-[#746E65] font-light leading-relaxed">
              Every candid laugh, dance move, table toast, and quiet embrace made our day so special.
              Help us remember every corner of the celebration through your eyes.
            </p>
          </div>

          {/* 3 Step Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-white border border-[#EAE3D9] p-6 flex flex-col text-left transition-all hover:border-[#C5A059]/60 hover:shadow-sm"
              >
                <div className="font-serif text-3xl text-[#C5A059] font-light mb-3">
                  {step.num}
                </div>
                <h3 className="font-serif text-lg text-[#22201E] font-medium mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-[#746E65] font-light leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Banner with Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#EAE3D9]">
            <div className="flex items-center gap-3 text-xs tracking-wider text-[#746E65]">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>All photos receive our #beccagotdaled editorial watermark</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button href="/upload" variant="primary" size="md" className="w-full sm:w-auto gap-2">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Photos Now</span>
              </Button>

              <Button href="/guest-login" variant="secondary" size="md" className="w-full sm:w-auto">
                <span>Guest Sign In</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
