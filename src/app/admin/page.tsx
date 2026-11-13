import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 bg-[#FAF7F2] px-6 sm:px-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#D9CEB2] bg-white text-[11px] tracking-[0.25em] uppercase text-[#746E65] mb-4">
              <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Restricted Access</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-[0.06em] uppercase text-[#22201E]">
              Admin Portal
            </h1>
            <p className="text-xs text-[#746E65] mt-2 font-light">
              Photo moderation queue, Google Drive synchronizer &amp; guest register.
            </p>
          </div>

          <div className="bg-white border border-[#EAE3D9] p-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  placeholder="admin@beccagotdaled.com"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.16em] uppercase text-[#22201E] font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#D9CEB2] text-sm focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2">
                <Button variant="dark" size="md" className="w-full gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Authenticate Admin</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
