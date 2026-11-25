# Custom connect interface (Composio backend)

The connection experience is **ours**: our own page, cards, loading states,
success/error notifications, account details and disconnect. Composio stays the
backend for OAuth, tokens, refresh, connected accounts and every publishing /
analytics call.

## Flow

```
Admin -> Connect (our UI)
  -> our server fn: getConnectionLink
       -> startConnection()
            custom auth config  -> connectedAccounts.initiate(long_redirect_url)
                                   => browser goes STRAIGHT to the provider
            managed auth config -> connectedAccounts.link()
                                   => Composio's hosted connect page is shown
  -> provider authorizes
  -> Composio handles the callback + token exchange
  -> back to /admin/connect?connected=1&company=…&platform=…&connected_account_id=…
  -> we verify the returned account belongs to this client, then sync
  -> our UI shows the account as connected
```

Nothing sensitive reaches the browser: the Composio API key stays on the server,
account reads are redacted by Composio, and connected-account ids are only used
server-side for sync/publish.

## Accountability / safety

- **Client isolation** — Composio user ids are namespaced per client
  (`client_<companyId>`); every read is scoped to that user.
- **Callback ownership** — on return we call `verifyReturnedConnection`, which
  checks the returned `connected_account_id` exists inside this client's
  namespace before syncing. A mismatched id is ignored.
- **No token exposure** — we never store or return provider tokens.
- **Disconnect** — calls Composio to delete the account and marks the row
  `disconnected` so a later sync can't resurrect it.

## Removing Composio's hosted page per platform

Composio **retired** direct starts for its managed apps — `initiate()` with a
managed auth config returns:

> `400 ConnectedAccount_BadRequest` — _"Creating connections on this endpoint for
> Composio-managed OAuth auth configs is no longer supported. Use POST
> /api/v3/connected_accounts/link instead."_

So the Composio page can only be skipped with a **custom auth config** (your own
OAuth app). To do that, per platform:

1. Register an OAuth app with the provider and set its authorized redirect URI to
   `https://backend.composio.dev/api/v3/toolkits/auth/callback`.
2. In the Composio dashboard → **Auth Configs → Create** → pick the toolkit →
   **OAuth2** → “use your own developer credentials” → paste the provider's
   client id/secret → save and copy the `ac_…` id.
3. In this app → Admin → **Connect** → expand **Connection setup** → paste the
   `ac_…` id for that platform → **Save**. The platform chip turns to
   **Direct** and connecting goes straight to the provider.

Verified direct targets (probe with throwaway configs, then deleted):

| Toolkit   | Direct redirect                           | Notes                                                       |
| --------- | ----------------------------------------- | ----------------------------------------------------------- |
| Instagram | `www.instagram.com/oauth/authorize`       |                                                             |
| Facebook  | `www.facebook.com/…/dialog/oauth`         |                                                             |
| LinkedIn  | `www.linkedin.com/oauth/v2/authorization` |                                                             |
| TikTok    | `www.tiktok.com/v2/auth/authorize/`       |                                                             |
| X         | `x.com/i/oauth2/authorize`                | Custom config also needs the app's Application Bearer Token |

Providers with no custom auth config keep using Composio's hosted page (its
branding and domain are Composio's and cannot be removed from here), but the
**surrounding experience is still ours** — our page, our states, our account
list, our disconnect.

## Testing

For each platform:

1. Select the client, click **Connect**.
2. Expect our "Connecting" overlay; then either the provider directly (Direct
   chip) or Composio's page (Composio page chip).
3. Authorize; you should land back on Admin → Connect with a success toast and
   the account listed with its avatar, name/handle and status badge.
4. Use **Refresh** / **Sync from Composio**, set the publish destination where the
   platform needs one (Facebook Page / Instagram / LinkedIn), then **Disconnect**
   and confirm the row flips to disconnected.
5. Publish a post from the client's page to confirm publishing still works.

## Limitations

- Composio-managed platforms always show Composio's hosted page.
- The hosted page's domain and “Secured by Composio” badge can't be changed; only
  its logo/title/theme (Composio → Project Settings → White Labeling).
- The provider's own consent screen identity comes from the OAuth app in use.
- X's custom config needs an extra credential (`generic_id`, the app's bearer
  token), which the Composio dashboard form collects.
