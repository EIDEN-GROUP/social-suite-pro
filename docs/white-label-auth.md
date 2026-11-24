# White-label OAuth (use your own OAuth apps)

This lets the provider's consent screen say **your** app name and logo (e.g.
“SMimulator wants to access your Instagram”) and lets our app skip Composio's
hosted connect page.

> **What can't be removed:** the provider's own sign-in/consent pages and
> Composio's OAuth callback (`backend.composio.dev`) are still part of the
> browser flow. No setup hides those. What changes is the **app identity on the
> consent screen** and **whether Composio's hosted Connect Link page appears**.

## The three layers

| Layer | Who controls it | How to change it |
| --- | --- | --- |
| Provider consent screen (name, logo, publisher) | The OAuth app registered with Meta / LinkedIn / X / TikTok | Register your own OAuth app (this doc) |
| Composio hosted Connect Link page | Composio project settings | Dashboard → Project Settings → White Labeling (fallback only; our app skips it when a custom app is configured) |
| Our connecting screen | This codebase | `/admin/connect` + the “Connecting” modal, styled with the project design system |

## How our app behaves

1. If a platform has a **custom auth config** (`auth_mode = 'custom'`), the
   connect button calls `connectedAccounts.initiate(...)` with
   `long_redirect_url: true`, so the browser goes **straight to the provider**
   (no Composio-hosted page) and returns to `/admin/connect?connected=1…`.
2. Otherwise it falls back to `connectedAccounts.link(...)` (Composio-hosted
   Connect Link, themed in the dashboard).
3. Either way, `/admin/connect` is our own screen and shows our “Connecting”
   modal while the browser navigates away.

## One-time manual steps

Run the migration first (either file works):

- `supabase/migrations/20260613000000_custom_auth.sql`
- or re-run `supabase/FULL_SETUP.sql` (it now includes the same `ALTER TABLE`s)

Then, for each platform you want to white-label:

### 1. Register an OAuth app with the provider

Use the **Provider console** link on `/admin/auth-configs`. Add the app name,
logo and a support/privacy URL. Copy the **Client ID** and **Client secret**.

**Redirect URI** — register exactly what the card shows (Composio's shared
callback):

```
https://backend.composio.dev/api/v3/toolkits/auth/callback
```

If a toolkit's own docs still list the legacy callback
`https://backend.composio.dev/api/v1/auth-apps/add`, either one works **as long
as the provider entry and the auth config's redirect URI match**. Keep the card
value unless the provider rejects it.

#### Meta — Instagram + Facebook
- <https://developers.facebook.com/apps/> → **Create app** → type **Business**.
- Add products: **Facebook Login for Business** and **Instagram Graph API**.
- Facebook Login → Settings → **Valid OAuth Redirect URIs** → the callback above.
- Settings → Basic → copy **App ID** / **App Secret** (use as client ID/secret).
- Scopes for publishing: `pages_show_list`, `pages_read_engagement`,
  `pages_manage_posts`, `business_management`, `instagram_basic`,
  `instagram_content_publish`. Add `read_insights` for Page insights and
  `instagram_manage_comments` if you reply to comments.
- Instagram publishing needs an **Instagram Business/Creator account linked to a
  Facebook Page** you administer. Personal accounts can't publish.
- Accounts outside your team need **App Review / Advanced Access** and the app
  switched **Live**.

#### LinkedIn
- <https://www.linkedin.com/developers/apps> → **Create app** (name, company
  Page, logo). The app must be associated with a LinkedIn Page.
- **Products**: add **Share on LinkedIn** and **Sign In with LinkedIn using
  OpenID Connect**. For company-page posting/stats, request the **Community
  Management API** (gives `r_organization_admin`, `w_organization_social`).
- **Auth** tab → **Authorized redirect URLs** → the callback above. Copy
  **Client ID** / **Primary Client Secret**.
- Default scopes: `openid profile email w_member_social`. Add
  `r_organization_admin w_organization_social` for company pages.
- LinkedIn rejects some scope combinations (e.g. `w_member_social` together with
  `r_organization_admin`). If you need org posting, use an org-manager account
  with org scopes only.

#### X (Twitter)
- <https://developer.x.com/en/portal/dashboard> → project → app → **User
  authentication settings** → **Set up**.
- App permissions: **Read and write**. App type: **Web App**.
- **Callback URI** → the callback above (a Website URL is also required).
- Copy the **OAuth 2.0 Client ID / Client Secret** (not the API key/secret).
- Scopes: `tweet.read users.read tweet.write offline.access`.

#### TikTok
- <https://developers.tiktok.com/apps/> → **Connect an app**.
- Add **Login Kit** and **Content Posting API**; set the redirect URI above.
- Copy the **Client key** / **Client secret**.
- Scopes: `user.info.basic`, `video.publish`, `video.upload`.
- Public posting requires TikTok's **app audit**; unaudited apps can only post
  privately / to the creator.

### 2. Save the credentials in the app

Open **Admin → Auth setup** (`/admin/auth-configs`), find the platform, click
**Use my own OAuth app**, and paste:

- App name (what users see on the consent screen)
- Client ID + Client secret
- Scopes (comma-separated; omitted = toolkit defaults)
- Redirect URI (pre-filled — must match the provider exactly)

The server creates a Composio auth config with
`type: "use_custom_auth"`, `authScheme: "OAUTH2"` and stores the returned
`ac_...` id in `integration_configs`. **The client secret is sent to Composio
once and never stored in this app or its database.**

### 3. Connect a test account

Go to **Admin → Connect**, pick the client and platform. Authorize on the
provider. You should see your app name on the consent screen, then return to our
connecting screen and see the account sync.

## Composio hosted page (fallback) theme

If you're still on managed auth, you can at least brand the hosted Connect Link:

- **Project Settings → White Labeling → Branding**: App Title `SMimulator`;
  upload a square logo (256–1024 px).
- **Styling** seeds to match this project:
  - Page background `#F7F7F8`, card `#FFFFFF`
  - Foreground `#111827`, primary `#111827`, secondary `#6366F1`,
    tertiary `#E5E7EB`
  - Body/display font: Inter; radius 12 px; border 1px
- Branding is **per Composio project**, not per client. Use separate projects if
  you need different branding per brand.

## Switching back

**Auth setup → Use Composio-managed** clears the custom config locally (and
best-effort deletes the remote one). Existing connections created under either
app keep working — **tokens can't migrate between apps**, so reconnect accounts
if you want them authorized under the new app.

## Verification checklist

- Consent screen shows your app name/logo (test with an account outside your
  developer team).
- Callback returns to `/admin/connect?connected=1…` and the account shows
  **Active**.
- Publishing still works (the tool capabilities don't change with the app).
- Secrets are absent from the browser bundle, logs, and the database.