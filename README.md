# Sabha

**See the reasoning before your AI agent acts.**

Sabha makes the assumptions, trade-offs and commercial influence behind your AI agent’s decisions visible, challenges them from multiple perspectives, and gives you control over what gets acted on.

- **Living Memory** corrects the information
- **Council** challenges the reasoning
- **Gate** enforces your decision

## Product

| Route | What it is |
|---|---|
| `/` | Marketing site + early access waitlist |
| `/demo` | Full interactive product demo |
| `/how-it-works` | Product explanation |
| `/privacy` | Privacy policy |
| `/api/waitlist` | Waitlist signup API |

The demo at `/try` is a fully interactive day-in-the-life simulation (purchase, routine, relationship and influence scenarios) with real Gate / Living Memory / Informed Agency Rate logic. Council lines and catalog items are scripted for the launch narrative.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Optional: forward waitlist signups to Zapier / Make / Loops / etc.
WAITLIST_WEBHOOK_URL=
```

Without a webhook, waitlist emails are accepted and acknowledged (in-memory on the server instance). Wire `WAITLIST_WEBHOOK_URL` before a public launch so signups persist.

## Deploy

Deploy on Vercel (recommended):

```bash
npx vercel
```

Set `NEXT_PUBLIC_SITE_URL` to your production URL and `WAITLIST_WEBHOOK_URL` if you use one.

## Product Hunt

See [`LAUNCH.md`](./LAUNCH.md) for tagline, description, first-comment copy, demo path and screenshot checklist.

## Docs in this repo

- [`PRODUCT_RATIONALE.md`](./PRODUCT_RATIONALE.md) — problem, principles, metrics, GTM
- [`walkthrough.md`](./walkthrough.md) — demo recording script
- [`CHANGES.md`](./CHANGES.md) — prototype evolution notes

## License

Proprietary for now. Contact via GitHub issues on this repository.
