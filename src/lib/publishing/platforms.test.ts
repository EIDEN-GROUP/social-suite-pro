import { describe, expect, it } from "vitest";
import {
  buildPublishPlan,
  canPublishFor,
  capabilityNote,
  firstPresent,
  PublishCapabilityError,
  validateContent,
} from "@/lib/publishing/platforms";
import type { Post } from "@/lib/types";

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "p1",
    company_id: "c1",
    platform: "instagram",
    post_type: "post",
    media_url: "https://cdn.example.com/a.jpg",
    media_type: "image",
    extra_media: [],
    caption: "Hello world",
    position: 0,
    status: "approved",
    client_comment: null,
    decided_at: null,
    scheduled_at: null,
    post_url: null,
    posted_at: null,
    created_at: "",
    ...overrides,
  } as Post;
}

const ACCOUNT = { connectedAccountId: "ca_1", externalAccountId: "ig_42" };

describe("firstPresent", () => {
  it("returns the first candidate that exists", () => {
    expect(firstPresent(["A", "B"], ["B", "C"])).toBe("B");
    expect(firstPresent(["X"], ["A", "B"])).toBeNull();
  });
});

describe("canPublishFor", () => {
  it("requires both instagram actions", () => {
    expect(canPublishFor("instagram", ["INSTAGRAM_POST_IG_USER_MEDIA"])).toBe(false);
    expect(
      canPublishFor("instagram", [
        "INSTAGRAM_POST_IG_USER_MEDIA",
        "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH",
      ]),
    ).toBe(true);
  });

  it("detects X publishing", () => {
    expect(canPublishFor("twitter", ["TWITTER_CREATION_OF_A_POST"])).toBe(true);
    expect(canPublishFor("twitter", ["SOMETHING_ELSE"])).toBe(false);
  });

  it("reports TikTok as unavailable (needs direct upload)", () => {
    expect(canPublishFor("tiktok", ["TIKTOK_UPLOAD_VIDEO"])).toBe(false);
  });
});

describe("capabilityNote", () => {
  it("is null when publishing is possible", () => {
    expect(capabilityNote("twitter", ["TWITTER_CREATION_OF_A_POST"])).toBeNull();
  });
  it("explains missing permissions", () => {
    expect(capabilityNote("twitter", [])).toMatch(/permission/i);
  });
});

describe("validateContent", () => {
  it("rejects captions over the platform limit", () => {
    expect(() => validateContent("twitter", post({ caption: "x".repeat(281) }))).toThrow(
      PublishCapabilityError,
    );
    expect(() => validateContent("twitter", post({ caption: "x".repeat(280) }))).not.toThrow();
  });

  it("requires media for instagram", () => {
    expect(() => validateContent("instagram", post({ media_url: null }))).toThrow(
      PublishCapabilityError,
    );
  });
});

describe("buildPublishPlan", () => {
  it("builds a single X step", () => {
    const steps = buildPublishPlan({
      platform: "twitter",
      post: post({ platform: "twitter", caption: "hi" }),
      account: ACCOUNT,
      capabilities: ["TWITTER_CREATION_OF_A_POST"],
    });
    expect(steps).toHaveLength(1);
    expect(steps[0].slug).toBe("TWITTER_CREATION_OF_A_POST");
    expect(steps[0].args).toEqual({ text: "hi" });
  });

  it("builds the two-step instagram plan", () => {
    const steps = buildPublishPlan({
      platform: "instagram",
      post: post({ media_type: "image", media_url: "https://cdn.example.com/a.jpg" }),
      account: ACCOUNT,
      capabilities: ["INSTAGRAM_POST_IG_USER_MEDIA", "INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH"],
    });
    expect(steps).toHaveLength(2);
    expect(steps[0].slug).toBe("INSTAGRAM_POST_IG_USER_MEDIA");
    expect(steps[0].args.ig_user_id).toBe("ig_42");
    expect(steps[1].args.creation_id).toBe("{{creation_id}}");
  });

  it("throws when the account lacks the required action", () => {
    expect(() =>
      buildPublishPlan({
        platform: "twitter",
        post: post({ platform: "twitter" }),
        account: ACCOUNT,
        capabilities: [],
      }),
    ).toThrow(PublishCapabilityError);
  });

  it("builds a Facebook text post with page_id", () => {
    const steps = buildPublishPlan({
      platform: "facebook",
      post: post({ platform: "facebook", media_url: null, caption: "hello fb" }),
      account: { connectedAccountId: "ca_fb", externalAccountId: "123456789012345" },
      capabilities: ["FACEBOOK_CREATE_POST"],
    });
    expect(steps).toHaveLength(1);
    expect(steps[0].slug).toBe("FACEBOOK_CREATE_POST");
    expect(steps[0].args).toEqual({
      page_id: "123456789012345",
      message: "hello fb",
      published: true,
    });
  });

  it("builds a Facebook photo post with page_id", () => {
    const steps = buildPublishPlan({
      platform: "facebook",
      post: post({
        platform: "facebook",
        media_type: "image",
        media_url: "https://cdn.example.com/a.jpg",
      }),
      account: { connectedAccountId: "ca_fb", externalAccountId: "123" },
      capabilities: ["FACEBOOK_CREATE_POST", "FACEBOOK_CREATE_PHOTO_POST"],
    });
    expect(steps[0].slug).toBe("FACEBOOK_CREATE_PHOTO_POST");
    expect(steps[0].args.page_id).toBe("123");
    expect(steps[0].args.url).toBe("https://cdn.example.com/a.jpg");
  });

  it("refuses to plan a Facebook post without a Page", () => {
    expect(() =>
      buildPublishPlan({
        platform: "facebook",
        post: post({ platform: "facebook" }),
        account: { connectedAccountId: "ca_fb", externalAccountId: null },
        capabilities: ["FACEBOOK_CREATE_POST"],
      }),
    ).toThrow(PublishCapabilityError);
  });

  it("builds a LinkedIn post with author + commentary", () => {
    const steps = buildPublishPlan({
      platform: "linkedin",
      post: post({ platform: "linkedin", media_url: null, caption: "hello li" }),
      account: { connectedAccountId: "ca_li", externalAccountId: "urn:li:person:abc" },
      capabilities: ["LINKEDIN_CREATE_LINKED_IN_POST"],
    });
    expect(steps[0].slug).toBe("LINKEDIN_CREATE_LINKED_IN_POST");
    expect(steps[0].args.author).toBe("urn:li:person:abc");
    expect(steps[0].args.commentary).toBe("hello li");
    expect(steps[0].args).not.toHaveProperty("images");
  });

  it("adds a media-upload marker for LinkedIn image posts", () => {
    const steps = buildPublishPlan({
      platform: "linkedin",
      post: post({
        platform: "linkedin",
        media_type: "image",
        media_url: "https://cdn.example.com/x.jpg",
      }),
      account: { connectedAccountId: "ca_li", externalAccountId: "urn:li:person:abc" },
      capabilities: ["LINKEDIN_CREATE_LINKED_IN_POST"],
    });
    expect(Array.isArray(steps[0].args.images)).toBe(true);
  });

  it("refuses LinkedIn without an author", () => {
    expect(() =>
      buildPublishPlan({
        platform: "linkedin",
        post: post({ platform: "linkedin" }),
        account: { connectedAccountId: "ca_li", externalAccountId: null },
        capabilities: ["LINKEDIN_CREATE_LINKED_IN_POST"],
      }),
    ).toThrow(PublishCapabilityError);
  });

  it("refuses to plan unsupported platforms", () => {
    expect(() =>
      buildPublishPlan({
        platform: "tiktok",
        post: post({ platform: "tiktok", media_type: "video" }),
        account: ACCOUNT,
        capabilities: ["TIKTOK_UPLOAD_VIDEO"],
      }),
    ).toThrow(PublishCapabilityError);
  });
});
