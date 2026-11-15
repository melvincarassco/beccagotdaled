import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/auth/ClientProviders";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Becca & Dale — #beccagotdaled | Luxury Wedding Photography Platform",
  description:
    "An editorial wedding photography celebration. Browse curated moments, relive memories, and contribute your favorite photographs from Becca and Dale's wedding.",
  keywords: [
    "Becca and Dale",
    "beccagotdaled",
    "Wedding Photography",
    "Luxury Wedding Gallery",
    "Wedding Celebration",
  ],
  authors: [{ name: "Becca & Dale" }],
  openGraph: {
    title: "Becca & Dale — #beccagotdaled Wedding Celebration",
    description:
      "Relive every timeless moment from our wedding day and share your photographs.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} scroll-smooth`}>
      <body className="font-sans bg-[#FAF7F2] text-[#22201E] antialiased min-h-screen flex flex-col selection:bg-[#C5A059] selection:text-white">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
