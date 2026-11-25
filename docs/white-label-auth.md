# Connect interface

The connection experience lives in our app (Admin → **Connect**). The integration
provider remains the backend for OAuth, token storage/refresh, connected-account
management and every publishing/analytics call.

## Flow

```
Admin -> Connect (our UI)
  -> our server fn getConnectionLink()
       -> provider API: connectedAccounts.link(...)
  -> hosted authorization page (provider)
  -> provider handles the OAuth callback + token exchange
  -> back to /admin/connect?connected=1&company=…&platform=…&connected_account_id=…
  -> verifyReturnedConnection() checks the account belongs to this client
  -> sync -> our UI shows the account as connected
```

## What is ours

- Platform cards, Connect / Connect another, loading states, success/error
  toasts, connected-account rows (avatar, name, handle, status), Refresh,
  Disconnect, “Sync accounts”, publish-destination picker, responsive grid, and
  our own connecting overlay.
- Copy and styling (project design system). No provider branding appears inside
  the app.

## Safety

- **Client isolation** — the provider user id is namespaced per client
  (`client_<companyId>`); every read is scoped to that user.
- **Callback ownership** — `verifyReturnedConnection` rejects a returned
  `connected_account_id` that isn’t in this client’s namespace.
- **No token exposure** — tokens stay server-side; reads are redacted by the
  provider.
- **Disconnect** — deletes the remote account and marks the row `disconnected`
  so a later sync can’t resurrect it.

## Testing

1. Admin → Connect → pick the client → **Connect** on a platform.
2. Our overlay appears; authorization opens; you return with a success toast and
   the account listed.
3. **Refresh** / **Sync accounts**; set the publish destination where the
   platform needs one (Facebook Page / Instagram / LinkedIn).
4. **Disconnect** and confirm the row flips to disconnected.
5. Publish a post from the client page to confirm publishing still works.

## Limitations

- The hosted authorization page is served by the integration provider and shows
  its own branding; we can’t restyle or rebrand that page from this app. Our
  interface is everything before and after it.
- The social platform’s own sign-in/consent screen is controlled by that
  platform.
- Only OAuth-based platforms are supported; platforms needing local file uploads
  (TikTok publishing) remain gated as before.
