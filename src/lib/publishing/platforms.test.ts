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
