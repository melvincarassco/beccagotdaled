import { Navbar } from "@/components/navigation/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { GuestUploadCallout } from "@/components/home/GuestUploadCallout";
import { Footer } from "@/components/navigation/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <GalleryTeaser />
        <GuestUploadCallout />
      </main>
      <Footer />
    </div>
  );
}
