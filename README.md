# Becca Got Daled (#beccagotdaled) — Luxury Wedding Photo Platform

A bespoke, production-ready editorial wedding photography platform combining professional high-resolution photographs from Google Drive with candid moments uploaded by wedding guests.

Inspired by luxury aesthetic: [https://becca-ships-dale.my.canva.site/](https://becca-ships-dale.my.canva.site/)

---

## 💎 Project Overview & Architecture

- **Front-End**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons
- **Typography**: Editorial Serif (`Cormorant Garamond`) + Minimalist Sans-Serif (`Montserrat`)
- **Palette**: Ivory (`#FDFBF7`), Warm Cream (`#FAF7F2`), Champagne Brushed Gold (`#C5A059`), Deep Charcoal (`#22201E`)
- **Watermark Engine**: Elegant `#beccagotdaled` bottom-right watermark with subtle transparency
- **Database & Auth**: Supabase PostgreSQL with RLS, Guest verification & Admin dashboard
- **Cloud Integrations**: Google Drive API v3 (Service Account integration)
- **Image Processing**: Server-side Sharp processing with thumbnail generation

---

## 🚀 Stage 1 Highlights (Implemented & Verified)

- [x] **Luxury Visual Identity**: Warm cream and ivory backgrounds, champagne accents, elegant serif headings, and wide-tracked subtext.
- [x] **Cinematic Landing Page (`/`)**:
  - Editorial hero with celebration badge, date, venue, and `#beccagotdaled` display.
  - Couple story narrative ("Our Journey: To Our Beloved Family & Friends").
  - Milestone events timeline ("The Celebration": Ceremony, Champagne Reception, Sunset Portraits, Dinner, First Dance).
  - Curated photo gallery preview with live category filtering, heart counts, and `#beccagotdaled` watermark overlays.
  - Guest photo contribution callout with 3-step guide and direct action triggers.
- [x] **Global Navigation & Footer**:
  - Responsive header with desktop navigation, quick favorites counter, and guest sign-in detection.
  - Full-screen mobile menu drawer.
  - Luxury footer with monogram, quick links, and admin portal gateway.
- [x] **Route Architecture Ready for Subsequent Stages**:
  - `/gallery` — Full photo gallery
  - `/favourites` — Personalized favorites bookmarking
  - `/upload` — Multi-file guest photo uploader
  - `/guest-login` — Registered guest authentication
  - `/admin` — Protected admin portal & moderation queue

---

## 🛠️ How to Run Locally

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v25)
- **npm** or **pnpm**

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
To verify production builds:
```bash
npm run build
npm run start
```
