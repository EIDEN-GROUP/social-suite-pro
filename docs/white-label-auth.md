# Connect page branding (Composio-managed)

The app connects client accounts through **Composio-managed auth only**. No
per-platform OAuth app credentials are configured here, and there is no in-app
“use your own app” screen.

## The flow

1. Admin → **Connect** → pick the client + platform.
2. `connectedAccounts.link(...)` returns Composio's hosted page. Verified host:
   `https://connect.composio.dev/link/lk_xxxxxxxx`
   (Composio also serves this on `dashboard.composio.dev/link/...` for some
   projects — both are Composio-owned domains.)
3. Composio shows its connect page → the provider shows its sign-in/consent
   screen → the browser returns to
   `/admin/connect?connected=1&company=…&platform=…`, and we sync the account.

## What can be changed

Composio dashboard → **Project Settings → White Labeling**:

- **Branding**: App Title (replaces “Composio” in the heading) and a square
  logo (256–1024 px).
- **Styling**: page/card/foreground colours, accent colours, fonts, corner
  radius, border width, and per-element overrides. There's a JSON toggle for
  bulk edits, and contrast is enforced.

Suggested values to match this project:

| Setting | Value |
| --- | --- |
| Background | `#F7F7F8` |
| Card | `#FFFFFF` |
| Foreground | `#111827` |
| Primary | `#111827` |
| Secondary | `#6366F1` |
| Tertiary | `#E5E7EB` |
| Radius / border | `12px` / `1px` |

Branding is **per Composio project**, not per client, and applies to every
toolkit.

## What cannot be changed

- The **“Secured by Composio” badge** — it isn't one of the editable elements,
  and Composio exposes no API for these settings (all attempts to read/write
  white-label settings return 404). Only Composio support/plan can remove it.
- The **hosted domain** (`connect.composio.dev` / `dashboard.composio.dev`) —
  there is no CNAME or custom-domain option in Composio Cloud.
- The **provider's own sign-in / consent screen** — its identity comes from the
  OAuth app in use (Composio's shared app here), and its page is not stylable.

Skipping the hosted page entirely would require your own OAuth app per platform,
which is **not configured in this app**. If that changes, the server-side pieces
are in git history (see the commits around “white-label OAuth”).
