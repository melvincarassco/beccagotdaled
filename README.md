# Rebecca & Dale (#beccagotdaled) — Luxury Wedding Photo Platform

A bespoke, production-ready editorial wedding photography platform combining professional high-resolution photographs from Google Drive with candid moments uploaded by wedding guests.

Inspired by luxury aesthetic: [https://becca-ships-dale.my.canva.site/invites-only](https://becca-ships-dale.my.canva.site/invites-only)

---

## 💎 Project Overview & Visual Identity

- **Visual Palette**: 
  - Alabaster Parchment: `#FEFDF6`
  - Royal Midnight Navy: `#02084B` & `#040D44`
  - Slate Navy & Taupe: `#304254` & `#545454`
  - Champagne Linen: `#E8E0D3` & `#DCD9C9`
- **Typography Pairing**:
  - Headings: Editorial Serif (`Cormorant Garamond`)
  - Subtitles & Tracking: Minimalist Sans (`Montserrat`) with generous letter spacing (`0.2em`)
- **Couples**: Rebecca Carassco & Dale Hendriques
- **Wedding Date**: 14 | 11 | 26 • 14 November 2026
- **Celebration Hashtag**: `#beccagotdaled`

---

## 🚀 Key Features

### 1. Photo Gallery & Lightbox
- **Masonry Gallery**: Responsive multi-column grid with loading skeletons and lazy loading.
- **Unified Streams**: Seamlessly displays official Google Drive photographs and approved guest uploads.
- **Filter Tabs**: *All Moments*, *Official Archive*, *Guest Snaps*.
- **Sorting**: *Latest First*, *Most Cherished (Likes)*, *Chronological Order*.
- **Cinematic Lightbox**: Full-screen modal with keyboard navigation (`←`, `→`, `Esc`), caption rendering with emojis, like counter, and high-res download button.

### 2. Likes & "My Favourites"
- Guests can like and unlike photos with optimistic UI updates.
- Duplicate prevention and session persistence (database + `localStorage`).
- Dedicated `/favourites` page displaying the guest's personalized collection with direct download.

### 3. Guest Photo Upload & Captions
- Mobile and desktop drag-and-drop multi-file uploader at `/upload`.
- Client-side image previews with removal controls and progress indicators.
- Per-photo caption field with one-tap emoji bar (`💍`, `✨`, `🥂`, `🤍`, `🎉`, `🕊️`, `🍾`, `💐`, `📸`, `💃`).
- Captions can be edited by the uploader after submission.
- New uploads are queued for administrator moderation before public publication.

### 4. Admin Management Suite (`/admin`)
- **Master Passphrase Gate**: Protected with HTTP-only signed session cookies and brute-force rate limiting.
- **Default Admin Password**: `RebeccaDale2026!`
- **Overview & Analytics**:
  - Total registered guests, active vs. inactive count.
  - Total photographs, approved vs. pending.
  - Total platform likes and **Most Cherished Photographs** leaderboard.
- **Guest Register Management**:
  - Add individual wedding guests with optional VIP PIN codes.
  - Instant **Turn ON / Turn OFF** toggle switches. Inactive guests are prevented from accessing the gallery or uploading.
  - **Bulk CSV Import**: Paste or upload guest lists (`FirstName, LastName, PIN`).
  - **CSV Export**: One-click download of the active wedding guest register.
  - Delete guest option.
- **Photo Moderation Queue**:
  - Review pending guest uploads.
  - One-click **Approve** (publishes immediately to the gallery).
  - One-click **Reject**.
  - **Edit or Sanitize Captions**: Administrators can clean up, edit, or remove captions.
  - Delete photograph.
- **Google Drive Synchronization**:
  - Live status indicator (Service Account & Target Folder ID).
  - One-click **"Synchronize Drive Now"** engine with discovery metrics.

### 5. Google Drive Integration (API v3)
- Server-side Service Account JWT authentication.
- Automatic image discovery (`image/*`) in target wedding folder.
- Metadata ingestion (dimensions, timestamps, thumbnails) into Supabase.
- Direct original file download proxy.

---

## 🛠️ Local Development & Running

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v25)
- **npm** or **pnpm**

### 2. Installation
```bash
git clone https://github.com/melvincarassco/beccagotdaled.git
cd beccagotdaled
npm install
```

### 3. Environment Setup
Copy [.env.example](file:///Users/melvin.carassco/testwork/.env.example) to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

- **Main Gallery**: [http://localhost:3000/gallery](http://localhost:3000/gallery)
- **My Favourites**: [http://localhost:3000/favourites](http://localhost:3000/favourites)
- **Guest Photo Upload**: [http://localhost:3000/upload](http://localhost:3000/upload)
- **Guest Sign In**: [http://localhost:3000/guest-login](http://localhost:3000/guest-login)
- **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin) (Password: `RebeccaDale2026!`)

### 5. Production Build Verification
```bash
npm run build
npm run start
```

---

## 🗄️ Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the complete migration script:
   - File: [supabase/migrations/20261114_initial_schema.sql](file:///Users/melvin.carassco/testwork/supabase/migrations/20261114_initial_schema.sql)
4. Copy your project **URL**, **anon key**, and **service_role key** into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

---

## ☁️ Google Drive API Setup

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Google Drive API**.
3. Create a **Service Account** under **IAM & Admin > Service Accounts**.
4. Create and download a **JSON Key** for the service account.
5. In your personal or shared Google Drive, create a folder for the wedding photos.
6. Share the folder with the Service Account email address with **Viewer** permissions.
7. Copy the folder ID from the Google Drive URL (`https://drive.google.com/drive/folders/{FOLDER_ID}`).
8. Add to `.env.local`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
   ```

---

## 🚀 Deployment to Vercel

1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. In [Vercel](https://vercel.com), click **Add New Project** and select `beccagotdaled`.
3. Under **Environment Variables**, paste the values from your `.env.local`.
4. Click **Deploy**.

### Custom Domain Configuration (Vercel)
1. Go to **Project Settings > Domains** in Vercel.
2. Enter your custom domain (e.g. `beccagotdaled.com`).
3. Set the DNS records at your domain registrar:
   - For apex domain (`beccagotdaled.com`): `A` record pointing to `76.76.21.21`
   - For subdomain (`www.beccagotdaled.com`): `CNAME` record pointing to `cname.vercel-dns.com`
