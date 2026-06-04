export type Platform = "instagram" | "tiktok" | "facebook" | "twitter" | "linkedin";
export type PostType = "post" | "reel" | "story" | "carousel";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Company {
  id: string;
  slug: string;
  name: string;
  accent_color: string;
  logo_url: string | null;
  bio: string | null;
  username: string | null;
  profile_pic_url: string | null;
  followers: string | null;
  following: number | null;
}

export interface Post {
  id: string;
  company_id: string;
  platform: Platform;
  post_type: PostType;
  media_url: string | null;
  media_type: string | null;
  caption: string | null;
  position: number;
  status: ApprovalStatus;
  client_comment: string | null;
  decided_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
];