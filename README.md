# GOOD OTP public site

Static Astro landing page with PostHog analytics and a Cloudflare Pages Function that securely submits leads to Kit.

## Stack

- Astro + TypeScript (static output)
- Cloudflare Pages hosting + `functions/api/subscribe.ts`
- PostHog event taxonomy from [GOOA-7](/GOOA/issues/GOOA-7)
- Kit (ConvertKit API v3) for email capture and tag segmentation

## Local development

```bash
pnpm install
pnpm dev
```

The static site runs at `http://localhost:4321`. The `/api/subscribe` handler only runs on Cloudflare Pages (or via `wrangler pages dev`).

## Build

```bash
pnpm build
```

Output directory: `dist/`

Verified in this workspace on 2026-06-22.

## Cloudflare Pages deploy

### Option A: GitHub Actions (recommended)

Repository: `https://github.com/conDIOSalante/good-otp-web`

1. Set GitHub repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `KIT_API_SECRET`, `KIT_FORM_ID`.
2. Set GitHub repository variables: `PUBLIC_SITE_URL`, `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`, `ALLOWED_ORIGIN`, optional `KIT_TAG_IDS`.
3. After secrets and variables are configured, set repository variable `DEPLOY_ENABLED=true` to publish on push.
4. Push to `main` — `.github/workflows/deploy.yml` builds and (when enabled) publishes to Cloudflare Pages project `good-otp-web`.
5. Configure the same function secrets in the Cloudflare Pages dashboard if preview/production scopes differ from GitHub Actions.

### Option B: Git-connected Pages (Cloudflare UI)

1. Connect the GitHub repository in Cloudflare Pages.
2. Configure build settings:
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Root directory: `web` (if repo contains other files)
4. Set environment variables in Cloudflare Pages:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Production + Preview | Canonical site URL |
| `PUBLIC_POSTHOG_KEY` | Production + Preview | PostHog project key |
| `PUBLIC_POSTHOG_HOST` | Production + Preview | PostHog ingest host |
| `KIT_API_SECRET` | Production + Preview | Kit API secret (server function only) |
| `KIT_FORM_ID` | Production + Preview | Kit form ID for subscriptions |
| `KIT_TAG_IDS` | Production + Preview | Comma-separated Kit tag IDs for segmentation |
| `ALLOWED_ORIGIN` | Production | Optional CORS allowlist for production domain |

5. Point the CEO-approved canonical domain to the Pages project.
6. Submit a test lead on a preview deployment and confirm:
   - Subscriber appears in Kit with expected tags
   - PostHog receives `page_view`, `cta_click`, `lead_form_started`, and `lead_form_submitted`

### Option C: Direct deploy with Wrangler

From the `web/` directory after setting Cloudflare credentials:

```bash
pnpm build
npx wrangler pages deploy dist --project-name good-otp-web
```

Use `wrangler pages dev` to exercise `/api/subscribe` locally against configured secrets.

## Pages and routes

| Route | Purpose |
| --- | --- |
| `/` | Mission landing page with primary CTA and lead form |
| `/thank-you` | Post-submit confirmation path |
| `/privacy` | Basic privacy policy |
| `/api/subscribe` | Server-side Kit subscription handler |

## Rollback

Republish a previous Cloudflare Pages deployment or repoint DNS to the prior host. No database migrations are involved.
