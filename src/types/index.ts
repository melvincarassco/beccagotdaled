export type ModerationStatus = "pending" | "approved" | "rejected";
export type UploadSource = "google_drive" | "guest_upload";

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  normalized_first_name: string;
  normalized_last_name: string;
  is_active: boolean;
  is_admin?: boolean;
  pin_code?: string | null;
  created_at: string;
  photo_count?: number;
  likes_count?: number;
}

export interface Photo {
  id: string;
  drive_file_id?: string | null;
  filename: string;
  mime_type: string;
  caption?: string | null;
  uploaded_by?: string | null; // guest id or null for drive sync
  uploader_name?: string | null;
  upload_source: UploadSource;
  moderation_status: ModerationStatus;
  watermark_applied: boolean;
  original_storage_path?: string | null;
  watermarked_storage_path?: string | null;
  thumbnail_url?: string | null;
  display_url: string;
  width?: number;
  height?: number;
  uploaded_at: string;
  last_synced_at?: string | null;
  like_count: number;
  is_liked_by_me?: boolean;
}

export interface Like {
  id: string;
  guest_id: string;
  photo_id: string;
  created_at: string;
}

export interface Admin {
  id: string;
  auth_user_id: string;
  role: "superadmin" | "moderator";
  email?: string;
  created_at: string;
}

export interface SessionGuest {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isAdmin?: boolean;
}

export interface GalleryFilterOptions {
  source?: "all" | "drive" | "guests" | "my_uploads";
  category?: string;
  sortBy?: "latest" | "most_liked" | "oldest";
  onlyFavorites?: boolean;
}
