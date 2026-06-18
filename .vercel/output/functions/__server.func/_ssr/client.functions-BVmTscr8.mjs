import { c as createServerRpc } from "./createServerRpc-CaOHo5ym.mjs";
import { c as createServerFn } from "./server-Dk4wVh4H.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "node:stream/promises";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
function normalizePost(row) {
  return {
    ...row,
    extra_media: Array.isArray(row.extra_media) ? row.extra_media : []
  };
}
async function authCompany(slug, password) {
  const {
    supabaseAdmin
  } = await import("./client.server-DPjt3aO_.mjs");
  const {
    data: company
  } = await supabaseAdmin.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (!company) return {
    supabaseAdmin,
    company: null
  };
  if (company.client_password !== password) {
    return {
      supabaseAdmin,
      company: null
    };
  }
  return {
    supabaseAdmin,
    company
  };
}
function publicCompany(c) {
  const {
    client_password: _omit,
    ...rest
  } = c;
  return rest;
}
const getCompanyBranding_createServerFn_handler = createServerRpc({
  id: "f1ced4b90724720222b1bcd5233d4c056681bb239d76a086d70af4fe699f396e",
  name: "getCompanyBranding",
  filename: "src/lib/client.functions.ts"
}, (opts) => getCompanyBranding.__executeServer(opts));
const getCompanyBranding = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80)
}).parse(input)).handler(getCompanyBranding_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-DPjt3aO_.mjs");
  const {
    data: company
  } = await supabaseAdmin.from("companies").select("name, accent_color, logo_url, profile_pic_url").eq("slug", data.slug).maybeSingle();
  return {
    branding: company ?? null
  };
});
const getClientWorkspace_createServerFn_handler = createServerRpc({
  id: "c66687f3fd5374f4965da097301eaf573c907bb3b0850b9956e372584a0401f1",
  name: "getClientWorkspace",
  filename: "src/lib/client.functions.ts"
}, (opts) => getClientWorkspace.__executeServer(opts));
const getClientWorkspace = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80),
  password: stringType().min(1).max(255)
}).parse(input)).handler(getClientWorkspace_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin,
    company
  } = await authCompany(data.slug, data.password);
  if (!company) throw new Error("Wrong password, or that workspace doesn't exist.");
  const [{
    data: posts
  }, {
    data: highlights
  }] = await Promise.all([supabaseAdmin.from("posts").select("*").eq("company_id", company.id).order("position"), supabaseAdmin.from("highlights").select("*").eq("company_id", company.id).order("position")]);
  return {
    company: publicCompany(company),
    posts: (posts ?? []).map((p) => normalizePost(p)),
    highlights: highlights ?? []
  };
});
const clientDecide_createServerFn_handler = createServerRpc({
  id: "005776df560c987ea9fd0c4388b1a630c89c2fca77a413e62c78347894d0c972",
  name: "clientDecide",
  filename: "src/lib/client.functions.ts"
}, (opts) => clientDecide.__executeServer(opts));
const clientDecide = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80),
  password: stringType().min(1).max(255),
  postId: stringType().uuid(),
  status: enumType(["approved", "rejected"]),
  comment: stringType().max(2e3).optional()
}).parse(input)).handler(clientDecide_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin,
    company
  } = await authCompany(data.slug, data.password);
  if (!company) throw new Error("Session expired. Please sign in again.");
  if (data.status === "rejected" && !data.comment?.trim()) {
    throw new Error("A comment is required when rejecting a post.");
  }
  const {
    data: post
  } = await supabaseAdmin.from("posts").select("id, company_id").eq("id", data.postId).maybeSingle();
  if (!post || post.company_id !== company.id) {
    throw new Error("That post is not part of this workspace.");
  }
  const {
    error
  } = await supabaseAdmin.from("posts").update({
    status: data.status,
    client_comment: data.comment?.trim() || null,
    decided_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.postId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  clientDecide_createServerFn_handler,
  getClientWorkspace_createServerFn_handler,
  getCompanyBranding_createServerFn_handler
};
