-- ==============================================================================
-- BECCA GOT DALED (#beccagotdaled) - SUPABASE INITIAL SCHEMA MIGRATION
-- Date: 14 November 2026
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. GUESTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    normalized_first_name TEXT NOT NULL,
    normalized_last_name TEXT NOT NULL,
    pin_code TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast guest autocomplete and name validation
CREATE INDEX IF NOT EXISTS idx_guests_normalized_names 
    ON public.guests (normalized_first_name, normalized_last_name);

CREATE INDEX IF NOT EXISTS idx_guests_is_active 
    ON public.guests (is_active);

-- ------------------------------------------------------------------------------
-- 3. PHOTOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_file_id TEXT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    caption TEXT NULL,
    uploaded_by UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    upload_source TEXT NOT NULL CHECK (upload_source IN ('google_drive', 'guest_upload')),
    moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    watermark_applied BOOLEAN NOT NULL DEFAULT false,
    original_storage_path TEXT NULL,
    watermarked_storage_path TEXT NULL,
    thumbnail_url TEXT NULL,
    display_url TEXT NOT NULL,
    width INTEGER NULL,
    height INTEGER NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_synced_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_moderation 
    ON public.photos (moderation_status, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by 
    ON public.photos (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_photos_drive_file_id 
    ON public.photos (drive_file_id);

-- ------------------------------------------------------------------------------
-- 4. LIKES TABLE (Unique constraint on guest_id + photo_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_guest_photo_like UNIQUE (guest_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_photo_id 
    ON public.likes (photo_id);

CREATE INDEX IF NOT EXISTS idx_likes_guest_id 
    ON public.likes (guest_id);

-- ------------------------------------------------------------------------------
-- 5. ADMINS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('superadmin', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Guests table policies:
-- Anyone can view active guests for name auto-suggestion during guest login
CREATE POLICY "Public read active guests" 
    ON public.guests FOR SELECT 
    USING (is_active = true);

-- Photos table policies:
-- Approved photos are readable by everyone
CREATE POLICY "Public read approved photos" 
    ON public.photos FOR SELECT 
    USING (moderation_status = 'approved');

-- Authenticated guests or anon can insert photo submissions with pending status
CREATE POLICY "Insert guest photos" 
    ON public.photos FOR INSERT 
    WITH CHECK (upload_source = 'guest_upload' AND moderation_status = 'pending');

-- Likes table policies:
-- Anyone can view like counts
CREATE POLICY "Public read likes" 
    ON public.likes FOR SELECT 
    USING (true);

-- Anyone can insert a like
CREATE POLICY "Allow likes insert" 
    ON public.likes FOR INSERT 
    WITH CHECK (true);

-- Delete own like
CREATE POLICY "Allow likes delete" 
    ON public.likes FOR DELETE 
    USING (true);

-- ------------------------------------------------------------------------------
-- 7. INITIAL SEED DATA (Default VIP Wedding Guests)
-- ------------------------------------------------------------------------------
INSERT INTO public.guests (first_name, last_name, normalized_first_name, normalized_last_name, is_active, pin_code)
VALUES
    ('Becca', 'Miller', 'becca', 'miller', true, '2026'),
    ('Dale', 'Vance', 'dale', 'vance', true, '2026'),
    ('Sarah', 'Jenkins', 'sarah', 'jenkins', true, NULL),
    ('Marcus', 'Vance', 'marcus', 'vance', true, NULL),
    ('Eleanor', 'Pemberton', 'eleanor', 'pemberton', true, NULL),
    ('James', 'Sterling', 'james', 'sterling', true, NULL),
    ('Charlotte', 'Hayes', 'charlotte', 'hayes', true, NULL),
    ('Oliver', 'Bennett', 'oliver', 'bennett', false, NULL)
ON CONFLICT DO NOTHING;
