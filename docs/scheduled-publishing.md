# Scheduled publishing on Vercel Hobby

Vercel **Hobby** accounts may only run **one cron invocation per day**, so an
expression like `*/5 * * * *` is rejected at deploy time.

This project therefore uses two layers:

| Layer | Schedule | Purpose |
| --- | --- | --- |
| Vercel cron (`vercel.json`) | `0 3 * * *` (daily) | Safety-net sweep; allowed on Hobby |
| GitHub Actions (`.github/workflows/scheduled-publish.yml`) | every 10 min | Frequent runner for scheduled posts |

Both call the same protected endpoint:

```
POST /api/cron/publish
Authorization: Bearer <CRON_SECRET>
```

`/api/cron/publish` **fails closed**: it returns `503` if `CRON_SECRET` is not
configured, and `401` on a missing/incorrect token. It claims due jobs with
`FOR UPDATE SKIP LOCKED`, so overlapping triggers never double-publish.

> `Publish Now` runs immediately in the request and does **not** depend on any
> cron/trigger. Only **scheduled** posts need a periodic trigger.

## Setup

1. Set `CRON_SECRET` (a long random string) in the deployment environment.
   - On Vercel, if `CRON_SECRET` exists, the platform cron includes
     `Authorization: Bearer $CRON_SECRET` automatically.
2. Add the same two values as GitHub repository secrets:
   - `APP_BASE_URL` → e.g. `https://simulator.eiden-group.com`
   - `CRON_SECRET` → same value as the deployment
3. Enable Actions on the repo. The workflow runs every 10 minutes and can also
   be triggered manually from the Actions tab.

## Timing expectations

- Immediate publish: instant.
- Scheduled publish on GitHub Actions: fires within roughly 5–15 minutes of the
  target time (GitHub's scheduler has a 5-minute floor and can be delayed).
- If you need **1-minute precision**, point a free external scheduler
  (e.g. cron-job.org, Upstash QStash) at the same URL with the same
  `Authorization: Bearer <CRON_SECRET>` header — no code changes required.

## Notes

- On **private** repos, scheduled workflows consume Actions minutes. Every 10
  minutes ≈ 720 min/month, within the free 2,000 min allowance. Increase the
  interval if you are close to the limit.
- On **Pro** Vercel you can delete the GitHub workflow and restore a
  minute-level cron in `vercel.json`, e.g. `*/1 * * * *`.