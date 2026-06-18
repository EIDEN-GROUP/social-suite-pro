import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-D2eKXXFb.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as PLATFORMS, a as POST_TYPES, M as Media } from "./types-CQzXJOzH.mjs";
import { P as PhonePreview } from "./PhonePreview-hWjm9kFU.mjs";
import { c as useSensors, d as useSensor, D as DndContext, e as closestCenter, P as PointerSensor } from "../_libs/dnd-kit__core.mjs";
import { S as SortableContext, r as rectSortingStrategy, a as arrayMove, u as useSortable } from "../_libs/dnd-kit__sortable.mjs";
import { C as CSS } from "../_libs/dnd-kit__utilities.mjs";
import { a as Route } from "./router-X9M_U4_f.mjs";
import { h as Play, I as Images, n as Trash2, X } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/dnd-kit__accessibility.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
const MAX_UPLOAD_MB = 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
function splitBySize(files) {
  const ok = [];
  const tooBig = [];
  for (const f of files) (f.size > MAX_UPLOAD_BYTES ? tooBig : ok).push(f);
  return { ok, tooBig };
}
function safeStorageName(name) {
  const dot = name.lastIndexOf(".");
  const rawExt = dot > 0 ? name.slice(dot + 1) : "";
  const rawBase = dot > 0 ? name.slice(0, dot) : name;
  const clean = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const base = clean(rawBase).slice(0, 40) || "file";
  const ext = clean(rawExt).slice(0, 8);
  return ext ? `${base}.${ext}` : base;
}
function PostDialog({ post, mode, open, onClose, onChanged, onDecide }) {
  const [caption, setCaption] = reactExports.useState(post.caption ?? "");
  const [comment, setComment] = reactExports.useState(post.client_comment ?? "");
  const [type, setType] = reactExports.useState(post.post_type);
  const [extra, setExtra] = reactExports.useState(post.extra_media ?? []);
  const [busy, setBusy] = reactExports.useState(false);
  if (!open) return null;
  async function decide(status) {
    if (status === "rejected" && !comment.trim()) return toast.error("Add a comment to reject");
    setBusy(true);
    try {
      if (onDecide) {
        await onDecide(status, comment);
      } else {
        const { error } = await supabase.from("posts").update({ status, client_comment: comment || null, decided_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", post.id);
        if (error) throw error;
      }
      toast.success(status === "approved" ? "Approved" : "Rejected with comment");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveAdmin() {
    setBusy(true);
    const { error } = await supabase.from("posts").update({ caption, post_type: type, extra_media: extra }).eq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChanged();
  }
  async function addCarouselMedia(fileList) {
    const { ok: files, tooBig } = splitBySize(Array.from(fileList));
    if (tooBig.length) toast.error(`Skipped ${tooBig.length} file(s) over ${MAX_UPLOAD_MB} MB.`);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const added = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${post.company_id}/${post.platform}/${post.id}/${Date.now()}-${i}-${safeStorageName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        added.push(data.publicUrl);
      }
      const next = [...extra, ...added];
      setExtra(next);
      const { error } = await supabase.from("posts").update({ extra_media: next, post_type: "carousel" }).eq("id", post.id);
      if (error) throw error;
      setType("carousel");
      toast.success("Added to carousel");
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  function removeExtra(url) {
    setExtra((cur) => cur.filter((u) => u !== url));
  }
  async function remove() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChanged();
    onClose();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md bg-background shadow-2xl",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b editorial-rule p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: [
                post.platform,
                " · ",
                type
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-2xl", children: "Review" })
            ] }),
            post.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-foreground/5", children: post.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "video",
              {
                src: post.media_url,
                className: "max-h-[40vh] w-full object-contain",
                controls: true,
                playsInline: true
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url, className: "max-h-[40vh] w-full object-contain" }) }),
            extra.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto border-t editorial-rule bg-foreground/5 p-2", children: extra.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: u, className: "h-16 w-16 rounded object-cover" }),
              mode === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => removeExtra(u),
                  className: "absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                }
              )
            ] }, u)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-4", children: [
              mode === "admin" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Post type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "select",
                    {
                      value: type,
                      onChange: (e) => setType(e.target.value),
                      className: "mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm",
                      children: POST_TYPES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.id, children: t.label }, t.id))
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Caption" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      value: caption,
                      onChange: (e) => setCaption(e.target.value),
                      rows: 3,
                      className: "mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block cursor-pointer rounded border border-dashed editorial-rule p-3 text-center text-xs uppercase tracking-widest text-muted-foreground hover:bg-foreground/[0.02]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "file",
                      multiple: true,
                      accept: "image/*,video/*",
                      className: "hidden",
                      onChange: (e) => e.target.files && addCarouselMedia(e.target.files)
                    }
                  ),
                  "+ Add carousel media"
                ] })
              ] }) : post.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-line text-sm", children: post.caption }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: mode === "client" ? "Comment for the studio" : "Client comment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "textarea",
                  {
                    value: comment,
                    onChange: (e) => setComment(e.target.value),
                    readOnly: mode === "admin",
                    rows: 3,
                    className: "mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm",
                    placeholder: mode === "client" ? "Optional - required when rejecting" : "-"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Status: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: post.status })
                ] }),
                post.decided_at && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(post.decided_at).toLocaleString() })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 border-t editorial-rule p-4", children: [
              mode === "client" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: busy,
                    onClick: () => decide("approved"),
                    className: "flex-1 rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50",
                    children: "Approve"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: busy || !comment.trim(),
                    onClick: () => decide("rejected"),
                    className: "flex-1 rounded-sm bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50",
                    children: "Reject"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: busy,
                    onClick: saveAdmin,
                    className: "flex-1 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background",
                    children: "Save"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    disabled: busy,
                    onClick: remove,
                    className: "rounded-sm border editorial-rule px-4 py-2 text-sm",
                    children: "Delete"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-sm border editorial-rule px-4 py-2 text-sm", children: "Close" })
            ] })
          ]
        }
      )
    }
  );
}
function normalizePost(row) {
  return {
    ...row,
    extra_media: Array.isArray(row.extra_media) ? row.extra_media : []
  };
}
const VIEW_GROUPS = [{
  id: "posts",
  label: "Posts"
}, {
  id: "reels",
  label: "Reels"
}, {
  id: "stories",
  label: "Stories"
}];
function inGroup(p, g) {
  if (g === "posts") return p.post_type === "post" || p.post_type === "carousel";
  if (g === "reels") return p.post_type === "reel";
  return p.post_type === "story";
}
function CompanyAdmin() {
  const {
    slug
  } = Route.useParams();
  const navigate = useNavigate();
  const [company, setCompany] = reactExports.useState(null);
  const [platform, setPlatform] = reactExports.useState("instagram");
  const [posts, setPosts] = reactExports.useState([]);
  const [highlights, setHighlights] = reactExports.useState([]);
  const [selected, setSelected] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [addType, setAddType] = reactExports.useState("post");
  const [viewFilter, setViewFilter] = reactExports.useState("posts");
  const [coverBusy, setCoverBusy] = reactExports.useState(false);
  const [picBusy, setPicBusy] = reactExports.useState(false);
  const loadPosts = reactExports.useCallback(async (companyId, pf) => {
    const {
      data: ps
    } = await supabase.from("posts").select("*").eq("company_id", companyId).eq("platform", pf).order("position");
    setPosts((ps ?? []).map((p) => normalizePost(p)));
  }, []);
  const loadHighlights = reactExports.useCallback(async (companyId) => {
    const {
      data
    } = await supabase.from("highlights").select("*").eq("company_id", companyId).order("position");
    setHighlights(data ?? []);
  }, []);
  const load = reactExports.useCallback(async () => {
    const {
      data: c
    } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
    if (!c) {
      toast.error("Company not found");
      return navigate({
        to: "/admin"
      });
    }
    setCompany(c);
    await Promise.all([loadPosts(c.id, platform), loadHighlights(c.id)]);
  }, [slug, platform, loadPosts, loadHighlights, navigate]);
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  reactExports.useEffect(() => {
    if (!company) return;
    const channel = supabase.channel(`posts:${company.id}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "posts",
      filter: `company_id=eq.${company.id}`
    }, () => {
      void loadPosts(company.id, platform);
    }).subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [company, platform, loadPosts]);
  async function uploadFiles(fileList) {
    if (!company || fileList.length === 0) return;
    const {
      ok: files,
      tooBig
    } = splitBySize(Array.from(fileList));
    if (tooBig.length) {
      const names = tooBig.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ");
      toast.error(`Skipped - over the ${MAX_UPLOAD_MB} MB limit: ${names}. Compress the file or raise the cap in Supabase → Storage settings.`);
    }
    if (files.length === 0) return;
    setUploading(true);
    try {
      const media = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${company.id}/${platform}/${Date.now()}-${i}-${safeStorageName(file.name)}`;
        const {
          error: upErr
        } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const {
          data: pub
        } = supabase.storage.from("media").getPublicUrl(path);
        media.push({
          url: pub.publicUrl,
          isVideo: file.type.startsWith("video")
        });
      }
      const startPos = posts.length;
      if (addType === "carousel") {
        const [cover, ...rest] = media;
        const {
          error
        } = await supabase.from("posts").insert({
          company_id: company.id,
          platform,
          post_type: "carousel",
          media_url: cover.url,
          media_type: cover.isVideo ? "video" : "image",
          extra_media: rest.map((m) => m.url),
          position: startPos
        });
        if (error) throw error;
      } else {
        const rows = media.map((m, i) => ({
          company_id: company.id,
          platform,
          post_type: addType,
          media_url: m.url,
          media_type: m.isVideo ? "video" : "image",
          position: startPos + i
        }));
        const {
          error
        } = await supabase.from("posts").insert(rows);
        if (error) throw error;
      }
      toast.success(`Added ${addType}${addType !== "carousel" && media.length > 1 ? "s" : ""}`);
      await loadPosts(company.id, platform);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }
  async function saveCompany(patch) {
    if (!company) return;
    const {
      error
    } = await supabase.from("companies").update(patch).eq("id", company.id);
    if (error) return toast.error(error.message);
    setCompany({
      ...company,
      ...patch
    });
    toast.success("Saved");
  }
  async function uploadCover(file) {
    if (!company) return;
    const {
      tooBig
    } = splitBySize([file]);
    if (tooBig.length) return toast.error(`Cover is over the ${MAX_UPLOAD_MB} MB limit.`);
    setCoverBusy(true);
    try {
      const path = `${company.id}/cover/${Date.now()}-${safeStorageName(file.name)}`;
      const {
        error
      } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      await saveCompany({
        cover_url: url
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCoverBusy(false);
    }
  }
  async function uploadProfilePic(file) {
    if (!company) return;
    const {
      tooBig
    } = splitBySize([file]);
    if (tooBig.length) return toast.error(`Logo is over the ${MAX_UPLOAD_MB} MB limit.`);
    setPicBusy(true);
    try {
      const path = `${company.id}/logo/${Date.now()}-${safeStorageName(file.name)}`;
      const {
        error
      } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      await saveCompany({
        profile_pic_url: url
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPicBusy(false);
    }
  }
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6
    }
  }));
  async function onDragEnd(e) {
    const {
      active,
      over
    } = e;
    if (!over || active.id === over.id) return;
    const view2 = posts.filter((p) => inGroup(p, viewFilter));
    const oldIndex = view2.findIndex((p) => p.id === active.id);
    const newIndex = view2.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newView = arrayMove(view2, oldIndex, newIndex);
    let vi = 0;
    const inView = new Set(view2.map((p) => p.id));
    const reordered = posts.map((p) => inView.has(p.id) ? newView[vi++] : p);
    setPosts(reordered);
    const updates = reordered.map((p, idx) => ({
      p,
      idx
    })).filter(({
      p,
      idx
    }) => p.position !== idx).map(({
      p,
      idx
    }) => supabase.from("posts").update({
      position: idx
    }).eq("id", p.id));
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Couldn't save the new order");
  }
  async function copyClientLink() {
    if (!company) return;
    const url = `${window.location.origin}/c/${company.slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Client link copied");
  }
  if (!company) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 text-sm text-muted-foreground", children: "Loading…" });
  const counts = {
    pending: posts.filter((p) => p.status === "pending").length,
    approved: posts.filter((p) => p.status === "approved").length,
    rejected: posts.filter((p) => p.status === "rejected").length
  };
  const view = posts.filter((p) => inGroup(p, viewFilter));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3 border-b editorial-rule px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin", className: "text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground", children: "← Studio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-px bg-foreground/20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-xl", children: company.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground", children: [
          "/c/",
          company.slug
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `/c/${company.slug}`, target: "_blank", rel: "noreferrer", className: "rounded-sm border editorial-rule px-3 py-1.5 text-xs", children: "Open client view ↗" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: copyClientLink, className: "rounded-sm border editorial-rule px-3 py-1.5 text-xs", children: "Copy client link" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[380px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "lg:sticky lg:top-6 lg:self-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border editorial-rule p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Live preview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PhonePreview, { platform, company, posts, highlights, onTap: setSelected }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 border editorial-rule", children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPlatform(p.id), className: `px-3 py-1.5 text-xs uppercase tracking-widest ${platform === p.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`, children: p.label }, p.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-3 rounded border editorial-rule p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Add" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 border editorial-rule", children: POST_TYPES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAddType(t.id), className: `px-3 py-1.5 text-xs uppercase tracking-widest ${addType === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`, children: t.label }, t.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "ml-auto cursor-pointer rounded-sm bg-foreground px-4 py-2 text-sm text-background", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", multiple: true, accept: "image/*,video/*", className: "hidden", onChange: (e) => e.target.files && uploadFiles(e.target.files) }),
            uploading ? "Uploading…" : `+ Upload ${addType}`
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "w-full text-[11px] text-muted-foreground", children: [
            addType === "carousel" ? "Select multiple files - they become one carousel (first = cover)." : `Each file becomes a separate ${addType} on ${platform}. You can also drag tiles to reorder.`,
            " ",
            "Images or videos, up to",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-foreground", children: [
              MAX_UPLOAD_MB,
              " MB"
            ] }),
            " each."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 border editorial-rule", children: VIEW_GROUPS.map((g) => {
            const n = posts.filter((p) => inGroup(p, g.id)).length;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setViewFilter(g.id), className: `px-3 py-1.5 text-xs uppercase tracking-widest ${viewFilter === g.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`, children: [
              g.label,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 opacity-60", children: n })
            ] }, g.id);
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: counts.pending }),
              " pending"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-emerald-700", children: counts.approved }),
              " approved"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-rose-700", children: counts.rejected }),
              " rejected"
            ] })
          ] })
        ] }),
        view.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-10 py-10 text-center text-sm text-muted-foreground", children: [
          "No ",
          viewFilter,
          " for ",
          platform,
          " yet. Pick",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: addType }),
          " above and upload."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SortableContext, { items: view.map((p) => p.id), strategy: rectSortingStrategy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", children: view.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SortableTile, { post: p, onOpen: () => setSelected(p) }, p.id)) }),
          view.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-[11px] italic text-muted-foreground", children: [
            "Drag tiles to reorder within ",
            viewFilter,
            "."
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border editorial-rule p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Client access" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Client password", value: company.client_password ?? "", onSave: (v) => saveCompany({
                client_password: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
                "Client visits ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
                  "/c/",
                  company.slug
                ] }),
                " and enters this password."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border editorial-rule p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Username", value: company.username ?? "", onSave: (v) => saveCompany({
                username: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Category", value: company.category ?? "", onSave: (v) => saveCompany({
                category: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Followers", value: company.followers ?? "0", onSave: (v) => saveCompany({
                followers: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Following", value: String(company.following ?? 0), onSave: (v) => saveCompany({
                following: Number(v) || 0
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Link", value: company.link ?? "", onSave: (v) => saveCompany({
                link: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileField, { label: "Bio", value: company.bio ?? "", multiline: true, onSave: (v) => saveCompany({
                bio: v
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Logo / profile picture" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/5 text-[10px] uppercase text-muted-foreground", children: company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) : company.name.slice(0, 2) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer rounded-sm border editorial-rule px-2 py-1 text-[11px]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => e.target.files?.[0] && uploadProfilePic(e.target.files[0]) }),
                    picBusy ? "Uploading…" : company.profile_pic_url ? "Replace" : "Upload logo"
                  ] }),
                  company.profile_pic_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => saveCompany({
                    profile_pic_url: null
                  }), className: "text-[11px] text-muted-foreground hover:text-foreground", children: "Remove" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: "Upload a square image — shown as the avatar across every platform mockup." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Cover / banner" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-9 w-16 overflow-hidden rounded bg-foreground/5", children: company.cover_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.cover_url, className: "h-full w-full object-cover" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer rounded-sm border editorial-rule px-2 py-1 text-[11px]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => e.target.files?.[0] && uploadCover(e.target.files[0]) }),
                    coverBusy ? "Uploading…" : company.cover_url ? "Replace" : "Upload"
                  ] }),
                  company.cover_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => saveCompany({
                    cover_url: null
                  }), className: "text-[11px] text-muted-foreground hover:text-foreground", children: "Remove" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: "Shown as the banner on Facebook, X & LinkedIn pages." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HighlightsCard, { company, highlights, onChanged: () => loadHighlights(company.id) }) })
        ] })
      ] })
    ] }),
    selected && /* @__PURE__ */ jsxRuntimeExports.jsx(PostDialog, { post: selected, mode: "admin", open: !!selected, onClose: () => setSelected(null), onChanged: () => loadPosts(company.id, platform) })
  ] });
}
function SortableTile({
  post,
  onOpen
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: post.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { ref: setNodeRef, style, ...attributes, ...listeners, onClick: onOpen, className: `group relative aspect-square touch-none overflow-hidden rounded border editorial-rule bg-foreground/5 ${post.status === "approved" ? "ring-2 ring-emerald-500" : post.status === "rejected" ? "ring-2 ring-rose-500" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post, className: "h-full w-full object-cover" }),
    (post.post_type === "reel" || post.media_type === "video") && /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "absolute right-1 top-1 h-3.5 w-3.5 fill-white text-white drop-shadow" }),
    post.post_type === "carousel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Images, { className: "absolute right-1 top-1 h-3.5 w-3.5 text-white drop-shadow" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-1 right-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] uppercase tracking-widest", children: post.status }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground", children: post.post_type })
  ] });
}
function HighlightsCard({
  company,
  highlights,
  onChanged
}) {
  const [emoji, setEmoji] = reactExports.useState("");
  const [label, setLabel] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  async function add(image) {
    if (!emoji && !label && !image) return;
    setBusy(true);
    const {
      error
    } = await supabase.from("highlights").insert({
      company_id: company.id,
      emoji: emoji || null,
      label: label || null,
      image: image || null,
      position: highlights.length
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setEmoji("");
    setLabel("");
    onChanged();
  }
  async function uploadAndAdd(file) {
    setBusy(true);
    try {
      const path = `${company.id}/highlights/${Date.now()}-${safeStorageName(file.name)}`;
      const {
        error: upErr
      } = await supabase.storage.from("media").upload(path, file);
      if (upErr) throw upErr;
      const {
        data
      } = supabase.storage.from("media").getPublicUrl(path);
      await add(data.publicUrl);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }
  async function remove(id) {
    const {
      error
    } = await supabase.from("highlights").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border editorial-rule p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Highlights" }),
    highlights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-3", children: highlights.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-14 flex-col items-center gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-12 w-12 place-items-center overflow-hidden rounded-full border editorial-rule bg-foreground/5", children: h.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: h.image, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: h.emoji || "○" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(h.id), className: "absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[56px] truncate text-[10px] text-muted-foreground", children: h.label })
    ] }, h.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: emoji, onChange: (e) => setEmoji(e.target.value), placeholder: "😎", className: "w-14 rounded border editorial-rule bg-transparent px-2 py-1.5 text-center text-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: label, onChange: (e) => setLabel(e.target.value), placeholder: "Label", className: "flex-1 rounded border editorial-rule bg-transparent px-2 py-1.5 text-sm" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy, onClick: () => add(), className: "flex-1 rounded-sm bg-foreground py-1.5 text-xs text-background disabled:opacity-50", children: "Add" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "cursor-pointer rounded-sm border editorial-rule px-3 py-1.5 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: (e) => e.target.files?.[0] && uploadAndAdd(e.target.files[0]) }),
          "Image"
        ] })
      ] })
    ] })
  ] });
}
function ProfileField({
  label,
  value,
  multiline,
  onSave
}) {
  const [v, setV] = reactExports.useState(value);
  reactExports.useEffect(() => setV(value), [value]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: label }),
      v !== value && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onSave(v), className: "text-[10px] uppercase tracking-widest text-foreground", children: "Save" })
    ] }),
    multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: v, onChange: (e) => setV(e.target.value), rows: 2, className: "mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: v, onChange: (e) => setV(e.target.value), className: "mt-1 w-full border-b editorial-rule bg-transparent py-1.5 text-sm outline-none focus:border-foreground" })
  ] });
}
export {
  CompanyAdmin as component
};
