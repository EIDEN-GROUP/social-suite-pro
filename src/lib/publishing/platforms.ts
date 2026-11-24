import type { Platform, Post } from "@/lib/types";

/**
 * Platform-specific publishing plans.
 *
 * We never invent a tool slug: every step slug is checked against the action
 * slugs Composio actually exposes for the connected account (discovered at
 * runtime and cached on social_accounts.capabilities). If the required action
 * is not present we throw PublishCapabilityError instead of pretending to post.
 */

export class PublishCapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishCapabilityError";
  }
}

export type PublishStep = { slug: string; args: Record<string, unknown> };

export type PublishAccount = {
  connectedAccountId: string;
  externalAccountId: string | null;
};

const CAPTION_LIMIT: Record<Platform, number> = {
  instagram: 2200,
  tiktok: 2200,
  facebook: 63206,
  twitter: 280,
  linkedin: 3000,
};

/**
 * Candidate action slugs per platform. The first candidate that the account
 * actually exposes wins; if none match, publishing is reported unavailable.
 * (Marked "verify" where the public toolkit docs are not yet confirmed.)
 */
const PUBLISH_CANDIDATES: Record<Platform, string[]> = {
  twitter: ["TWITTER_CREATION_OF_A_POST"],
  facebook: ["FACEBOOK_CREATE_POST", "FACEBOOK_CREATE_PAGE_POST"],
  linkedin: ["LINKEDIN_CREATE_LINKED_IN_POST"],
  instagram: ["INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH", "INSTAGRAM_MEDIA_PUBLISH"],
  tiktok: ["TIKTOK_UPLOAD_VIDEO"],
};

const INSTAGRAM_CONTAINER_CANDIDATES = ["INSTAGRAM_POST_IG_USER_MEDIA"];

export function firstPresent(capabilities: string[], candidates: string[]): string | null {
  for (const c of candidates) if (capabilities.includes(c)) return c;
  return null;
}

export function canPublishFor(platform: Platform, capabilities: string[]): boolean {
  if (platform === "instagram") {
    return (
      firstPresent(capabilities, INSTAGRAM_CONTAINER_CANDIDATES) !== null &&
      firstPresent(capabilities, PUBLISH_CANDIDATES.instagram) !== null
    );
  }
  if (platform === "tiktok") {
    // TikTok requires a direct file upload; we cannot drive it from a URL yet.
    return false;
  }
  return firstPresent(capabilities, PUBLISH_CANDIDATES[platform]) !== null;
}

export function capabilityNote(platform: Platform, capabilities: string[]): string | null {
  if (canPublishFor(platform, capabilities)) return null;
  if (platform === "tiktok") {
    return "Publishing to TikTok requires a direct video upload, which is not enabled yet.";
  }
  if (platform === "instagram") {
    return "Instagram publishing needs an Instagram Business account linked to a Facebook Page with the content-publish permission.";
  }
  return "This account was connected without the publishing permission required for this platform.";
}

function captionOf(post: Post): string {
  return (post.caption ?? "").trim();
}

function primaryMediaUrl(post: Post): string | null {
  return post.media_url ?? post.extra_media?.[0] ?? null;
}

export function validateContent(platform: Platform, post: Post): void {
  const caption = captionOf(post);
  const limit = CAPTION_LIMIT[platform];
  if (caption.length > limit) {
    throw new PublishCapabilityError(
      `Caption is ${caption.length} characters; ${platform} allows up to ${limit}.`,
    );
  }
  if ((platform === "instagram" || platform === "tiktok") && !primaryMediaUrl(post)) {
    throw new PublishCapabilityError(`${platform} requires an image or video to publish.`);
  }
  if (platform === "facebook" && !caption && !primaryMediaUrl(post)) {
    throw new PublishCapabilityError("Facebook requires text or media to publish.");
  }
}

/** Platforms that need a resolved destination/author stored before publishing. */
export function destinationRequired(platform: Platform): boolean {
  return platform === "facebook" || platform === "instagram" || platform === "linkedin";
}

/** Platforms where the team must pick from multiple destinations (picker UI). */
export function destinationPickerRequired(platform: Platform): boolean {
  // LinkedIn is included so the team can switch between posting as a person or
  // as a company page (organization URN).
  return platform === "facebook" || platform === "instagram" || platform === "linkedin";
}

/**
 * Normalizes whatever the team types for a LinkedIn author into a URN.
 *  - `urn:li:organization:123` → company page
 *  - `urn:li:person:abc`       → personal profile
 *  - `123`                     → company page (numeric ids are organization ids)
 *  - `abc`                     → personal profile
 */
export function normalizeLinkedInAuthor(value: string): { urn: string; isOrg: boolean } {
  const v = value.trim();
  if (/^urn:li:organization:\d+$/i.test(v)) return { urn: v, isOrg: true };
  if (/^urn:li:person:[A-Za-z0-9_-]+$/i.test(v)) return { urn: v, isOrg: false };
  if (/^urn:li:[a-z]+:/i.test(v)) return { urn: v, isOrg: /organization/i.test(v) };
  if (/^\d+$/.test(v)) return { urn: `urn:li:organization:${v}`, isOrg: true };
  return { urn: `urn:li:person:${v}`, isOrg: false };
}

/** True when the stored LinkedIn destination posts as a company page. */
export function isLinkedInOrgDestination(externalAccountId: string | null): boolean {
  return Boolean(externalAccountId && /^urn:li:organization:/i.test(externalAccountId));
}

/**
 * Build the ordered tool steps for a post. Throws PublishCapabilityError with a
 * human message when the platform/account cannot publish this content.
 */
export function buildPublishPlan(params: {
  platform: Platform;
  post: Post;
  account: PublishAccount;
  capabilities: string[];
}): PublishStep[] {
  const { platform, post, account, capabilities } = params;
  validateContent(platform, post);
  const caption = captionOf(post);

  if (platform === "twitter") {
    const slug = firstPresent(capabilities, PUBLISH_CANDIDATES.twitter);
    if (!slug) throw new PublishCapabilityError("This X account cannot publish posts.");
    return [{ slug, args: { text: caption } }];
  }

  if (platform === "facebook") {
    // Facebook posts target a specific Page - the id is stored on the account.
    if (!account.externalAccountId) {
      throw new PublishCapabilityError(
        "No Facebook Page is selected for this account. Choose a Page, then publish.",
      );
    }
    const media = primaryMediaUrl(post);
    const isVideo = post.media_type === "video";

    if (isVideo) {
      const slug = firstPresent(capabilities, ["FACEBOOK_CREATE_VIDEO_POST"]);
      if (!slug) throw new PublishCapabilityError("This Facebook Page cannot publish video.");
      return [
        {
          slug,
          args: {
            page_id: account.externalAccountId,
            file_url: media,
            description: caption,
            published: true,
          },
        },
      ];
    }

    if (media) {
      const slug = firstPresent(capabilities, ["FACEBOOK_CREATE_PHOTO_POST"]);
      if (!slug) throw new PublishCapabilityError("This Facebook Page cannot publish photos.");
      return [
        {
          slug,
          args: {
            page_id: account.externalAccountId,
            url: media,
            message: caption,
            published: true,
          },
        },
      ];
    }

    const slug = firstPresent(capabilities, PUBLISH_CANDIDATES.facebook);
    if (!slug) throw new PublishCapabilityError("This Facebook account cannot publish Page posts.");
    return [
      { slug, args: { page_id: account.externalAccountId, message: caption, published: true } },
    ];
  }

  if (platform === "linkedin") {
    const slug = firstPresent(capabilities, PUBLISH_CANDIDATES.linkedin);
    if (!slug) throw new PublishCapabilityError("This LinkedIn account cannot publish posts.");
    if (!account.externalAccountId) {
      throw new PublishCapabilityError(
        "No LinkedIn author is set for this account. Refresh the account, then publish.",
      );
    }
    const media = primaryMediaUrl(post);
    if (media && post.media_type === "video") {
      throw new PublishCapabilityError("LinkedIn video posts are not enabled yet.");
    }
    const args: Record<string, unknown> = {
      author: account.externalAccountId,
      commentary: caption,
      visibility: "PUBLIC",
      lifecycleState: "PUBLISHED",
    };
    // Images use Composio's file-upload shape; the engine uploads the media URL
    // and replaces this marker before executing.
    if (media) args.images = [{ __mediaUpload: { url: media } }];
    return [{ slug, args }];
  }

  if (platform === "instagram") {
    const container = firstPresent(capabilities, INSTAGRAM_CONTAINER_CANDIDATES);
    const publish = firstPresent(capabilities, PUBLISH_CANDIDATES.instagram);
    if (!container || !publish) {
      throw new PublishCapabilityError(
        "Instagram publishing requires the media-container and publish actions on this account.",
      );
    }
    if (!account.externalAccountId) {
      throw new PublishCapabilityError(
        "This Instagram connection is missing its Instagram user id.",
      );
    }
    const media = primaryMediaUrl(post)!;
    const isVideo = post.media_type === "video";
    const containerArgs: Record<string, unknown> = {
      ig_user_id: account.externalAccountId,
      caption,
      ...(isVideo ? { video_url: media } : { image_url: media }),
    };
    // Instagram Stories need an explicit media_type.
    if (post.post_type === "story") containerArgs.media_type = "STORIES";
    // Two-step: create the container, then publish it. `creation_id` is filled
    // in by the engine from the container response. BOTH actions require the
    // ig_user_id.
    return [
      { slug: container, args: containerArgs },
      {
        slug: publish,
        args: { ig_user_id: account.externalAccountId, creation_id: "{{creation_id}}" },
      },
    ];
  }

  throw new PublishCapabilityError(`Publishing to ${platform} is not supported.`);
}
