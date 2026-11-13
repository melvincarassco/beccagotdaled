import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Camera, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GuestLoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 bg-[#FAF7F2] px-6 sm:px-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#C5A059] mb-4">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              <span>Guest Portal</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-[0.06em] uppercase text-[#22201E]">
              Welcome Guests
            </h1>
            <p className="text-xs text-[#746E65] mt-2 font-light">
              Enter your registered name to personalize your gallery experience and upload photos.
            </p>
          </div>

          <div className="bg-white border border-[#EAE3D9] p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dale"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Miller"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" className="w-full gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Enter Celebration Portal</span>
                </Button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[11px] text-[#746E65]">
                  Names are verified against our wedding guest register.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
