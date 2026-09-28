# LUMEA — Dashly Studio test task

Implementation of the Home Page fragment from the Figma design: hero section with a
CMS-driven announcement bar, and a "How it works" section with four stacking step
cards plus a CMS-driven product block (inline on desktop, overlay on mobile).

- **Frontend:** Next.js (App Router) + TypeScript + SCSS Modules
- **Backend / CMS:** Strapi 5
- **Database:** PostgreSQL

| | |
| --- | --- |
| Live site | _added after deploy_ |
| Strapi admin | _added after deploy_ |
| Repository | _added after deploy_ |

---

## Contents

- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Repository structure](#repository-structure)
- [What is managed in the CMS](#what-is-managed-in-the-cms)
- [Content model](#content-model)
- [Price and discount logic](#price-and-discount-logic)
- [Implementation notes](#implementation-notes)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## Requirements

- **Node.js 22** (`.nvmrc` is provided — `nvm use`)
- **Docker** (Docker Desktop, OrbStack or Colima) for the local PostgreSQL instance

## Local setup

```bash
# 1. Install dependencies for the root, the CMS and the web app
npm run install:all

# 2. Database credentials for docker-compose
cp .env.example .env

# 3. Start PostgreSQL 16 (waits for the healthcheck, so the next steps
#    cannot race the first-run initdb)
npm run db:up

# 4. Strapi environment (generate your own secrets — see below)
cp apps/cms/.env.example apps/cms/.env

# 5. Frontend environment
cp apps/web/.env.example apps/web/.env.local

# 6. Start the CMS and the frontend together
npm run dev
```

`npm run dev` checks first that the port `apps/cms/.env` points at is actually
answering, and starts the compose service if it is not — so step 3 is only there
to make the order explicit. Strapi cannot run without its database, and left to
itself it spends a minute inside knex and then prints a `KnexTimeoutError` stack
that says nothing about the real problem; the preflight names it instead (engine
not running, no disk space for its VM, port taken by something else). The two dev
servers are also no longer tied together: if one of them stops, the other keeps
running.

If port 5432 is already taken on your machine (another PostgreSQL, another
container), set `DATABASE_PORT` to a free port in **both** `.env` and
`apps/cms/.env` — the first publishes it, the second connects to it — and
re-create the container with `npm run db:reset`.

Generate the Strapi secrets for step 4 with:

```bash
for key in APP_KEYS API_TOKEN_SALT ADMIN_JWT_SECRET TRANSFER_TOKEN_SALT JWT_SECRET ENCRYPTION_KEY; do
  echo "$key=$(openssl rand -base64 32)"
done
```

Then:

| URL | What it is |
| --- | --- |
| http://localhost:3000 | The page |
| http://localhost:1337/admin | Strapi admin (create the first administrator on the first visit) |

**The first start seeds itself.** On an empty database Strapi creates demo content
(3 announcements, 3 categories, 6 products covering every state: percent discount,
explicit sale price, no discount, several variation groups, one group, none) and
grants the public role read access to the API. Nothing has to be clicked together
by hand, and existing content is never overwritten — pass `SEED_FORCE=true` to
re-create it deliberately.

Product images ship with the seed data in `apps/cms/data/seed/images/` and are
uploaded to the media library on the first start; each product in
`apps/cms/data/seed/content.ts` names its own file. Swap a file (or point a
product at a different name) to change what the seed uploads. One product is
deliberately left without an image, because a card has to render correctly
without one — it keeps its aspect ratio and never shifts the layout.

## Repository structure

```
.
├── apps
│   ├── cms                        # Strapi 5
│   │   ├── config                 # database, middlewares (CORS/CSP), upload provider
│   │   ├── data/seed              # demo content + optional seed images
│   │   └── src
│   │       ├── api                # announcement / category / product
│   │       ├── bootstrap          # public permissions + seeding on first start
│   │       └── components/product # badge, variation group, variation value
│   └── web                        # Next.js
│       └── src
│           ├── app                # App Router: layout, page, metadata
│           ├── components
│           │   ├── layout         # header, announcement bar
│           │   ├── product        # product card, rail, category filter, mobile sheet
│           │   ├── sections       # hero, how it works
│           │   └── ui             # button, badge, price
│           ├── content            # static (non-CMS) page content: the four steps
│           ├── hooks              # stacking cards, rotation, media query, focus trap
│           ├── lib                # Strapi client, mappers, pricing, formatting
│           ├── styles             # design tokens, breakpoints, mixins, globals
│           └── types              # domain model
├── docker-compose.yml             # PostgreSQL 16
└── render.yaml                     # Strapi + PostgreSQL on Render (blueprint)
```

## What is managed in the CMS

Per the task, exactly this is editable in Strapi — and changing it needs no code
changes:

- **Announcement bar** — messages, their order, adding and removing them
- **Products** — title, image, volume, price, discount, badges, variations
- **Categories** — creating, renaming, deleting, reordering
- **Product ↔ category links** — a product can belong to several categories

Everything else belongs to the design and is intentionally not in the CMS: the
hero content, the four step cards (01 Cleanse / 02 Treat / 03 Moisturise /
04 Protect), the section structure, animations and responsive behaviour.

## Content model

**Product**

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string, required | |
| `image` | media | single image |
| `volume` | string | free text, e.g. `30 ml` — empty is fine |
| `price` | decimal, required | regular price |
| `salePrice` | decimal | fill in **either** this **or** `discountPercent` |
| `discountPercent` | decimal | fill in **either** this **or** `salePrice` |
| `badges` | repeatable component | `label` + `tone` (neutral / sale / new / bestseller) |
| `variationGroups` | repeatable component | `name` + repeatable `values` |
| `categories` | many-to-many | |
| `sortOrder` | integer | display order |

**Category:** `name`, `sortOrder`, `products` (many-to-many).
**Announcement:** `message`, `sortOrder`.

Variation groups are free-form: one product can have
`Choose formula → Hyaluronic Acid 2% / Hyaluronic + B5`, another
`Skin type → Dry / Normal / Sensitive` plus `Size → 30 ml / 50 ml / 100 ml`, and a
third none at all. Neither the group names nor their values exist anywhere in the
frontend code.

## Price and discount logic

The same number never has to be entered twice
(`apps/web/src/lib/pricing.ts`):

| Filled in the CMS | Frontend shows |
| --- | --- |
| `price` + `discountPercent` | calculated current price, `price` crossed out, discount badge |
| `price` + `salePrice` | `salePrice`, `price` crossed out, calculated discount badge |
| `price` only | just the price — no crossed-out price, no badge |

`salePrice` wins if both are filled in, since it is the exact amount the editor
wants to charge.

## Implementation notes

**Stacking step cards.** The stacking itself is pure CSS (`position: sticky` per
card), so it is smooth, works in both scroll directions, needs no layout work on
the scroll thread and behaves correctly at any viewport height. JavaScript only
reads the resulting geometry to expose which step is on top, how far the stack has
collapsed (used to tighten the section padding so the bottom edges of the two
columns stay aligned), and to scroll a partially covered card back into view when
it is tapped.

Two things it writes back, because they depend on how the copy happens to wrap and
a stylesheet cannot know them:

- `--card-slack`. A sticky element is released at `container bottom − its own
  bottom margin − its own height`, so four cards of four different heights release
  at four different moments: the tallest slides out first and the steps between
  the rest collapse, slicing the taglines of the cards it uncovers — and since
  this is the last section on the page, that broken state is the final thing on
  screen rather than a moment in passing. Giving each card the difference between
  the last card's height and its own makes `margin + height` identical across the
  stack, so all four release on the same pixel and the assembled pile leaves as
  one block, still exactly one peek apart. Measured against the *last* card, the
  bottom one's slack is zero, so the pile comes to rest flush with the bottom of
  its column and the two columns of the section end on the same line.
- `data-stacked`, set the moment a card reaches its slot. In the design a card is
  roomy on its own (40px padding) and compact in the pile (15/20), and only the
  padding changes — the spacing between its own blocks is 10px in both states — so
  a settled card is exactly 50px shorter. Tying that to the card's own arrival
  makes it settle once, over a transition, instead of being resized continuously
  as the page scrolls; and the card hands those 50px straight back as a bottom
  margin, so its outer height never changes and nothing below it in the flow moves
  while it tightens. The last card is the exception: it has nothing below it to
  protect and has to sit flush with the bottom of the column.

`check:interaction` sweeps the whole tail of the page and fails if the step ever
drops below the peek or if the two columns do not finish together.

**Announcement bar.** All messages are rendered into a single CSS grid cell, so
the bar is as tall as its tallest message from the first paint: switching messages
cross-fades and can never change the header height or shift the layout. The cycle
restarts after the last message, pauses on hover and keyboard focus, and is
suspended while the tab is hidden.

**Mobile products overlay.** Opened from a step CTA, rendered in a portal with
`role="dialog"`, a focus trap, Escape to close and page scroll locked (with
scrollbar-width compensation), which is what returns the visitor to the exact
place they opened it from.

**One responsive implementation.** Mobile-first, with the 375px and 1440px frames
as anchors; intermediate widths interpolate through `clamp()` (the `fluid()` mixin)
instead of snapping between hardcoded viewport versions. Desktop and mobile share
the same components — the only branch is where the product block is rendered.

**SEO.** Title, meta description and Open Graph tags via the Metadata API; a
single `h1`, then `h2` for the section, `h3` for the step cards and `h4` for
product titles; semantic `header` / `nav` / `main` / `section` / `button`; `alt`
text on meaningful images with decorative ones hidden from screen readers.

**Accessibility.** Every interactive element is a real button, link or input:
variation pickers are radio inputs (so group semantics and arrow-key navigation
come from the browser), category filters are buttons with `aria-pressed`, icon
buttons carry `aria-label`, and focus is always visible via a shared
`focus-visible` ring. Animations respect `prefers-reduced-motion`.

**Performance.** Content is fetched on the server (one request per collection, no
per-category waterfall) and cached with ISR; images go through `next/image` with
explicit `sizes`, so mobile never downloads desktop-sized assets; images are
`fill` + `object-fit` inside fixed-ratio boxes, which keeps CLS at zero. The
Strapi client retries with backoff, because free-tier hosting puts the CMS to
sleep and the first request after that is slow.

## Verification

"Pixel perfect" is checked, not eyeballed. Two scripts drive a headless Chromium
against the running site:

```bash
npx playwright install chromium   # once

npm run check:visual        # geometry + screenshots at 1440 and 375
npm run check:interaction   # stacking cards, overlay, announcement rotation
```

`check:visual` measures the elements whose size, font size and line height are
specified in Figma (announcement bar, header, h1, hero CTA and portrait, step
cards, product cards, price row, variation chips, …) and prints the delta for
each one — currently every measured value matches the design. It also writes
full-page screenshots to `apps/web/.visual/`.

`check:interaction` verifies the behavioural requirements: every card reaches its
own resting offset, each covered card still shows its number, title and tagline
inside the peek, nothing inside a card reaches past its edge (in a pile that
shows as a stray strip beside the stack), the assembled pile leaves as one block
down to the last pixel of the page, both columns end on the same line clear of
the window edge, the active step follows the stack (and drives the products
label),
tapping a covered card scrolls it into view, messages rotate without the bar
changing height, and the mobile overlay opens from a step CTA, locks page scroll,
switches categories and steps, and restores the scroll position on close.

`npm run og` regenerates `public/og-image.jpg` from the live hero, so the social
preview can never drift from the real page.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | CMS + frontend together (checks the database first) |
| `npm run dev:web` / `npm run dev:cms` | one of them |
| `npm run build` | production build of both apps |
| `npm run db:up` / `npm run db:down` | start / stop PostgreSQL (start blocks until it accepts connections) |
| `npm run db:reset` | drop the database volume and start fresh |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run check:visual` / `npm run check:interaction` | design and behaviour checks |
| `npm run og` | regenerate the Open Graph image |
| `npm run format` | Prettier |

## Deployment

**Backend (Render).** `render.yaml` is a blueprint: connecting the repository
creates the web service and a PostgreSQL instance, wires `DATABASE_URL` and
generates all Strapi secrets. Set `CORS_ORIGINS` to the deployed frontend origin.

Free instances have an ephemeral filesystem, so images uploaded through the admin
panel would disappear on restart. Setting `CLOUDINARY_NAME`, `CLOUDINARY_KEY` and
`CLOUDINARY_SECRET` switches the upload provider to Cloudinary; without them the
local filesystem is used, which is fine for development.

**Frontend (Vercel).** Import the repository with **Root Directory** set to
`apps/web`, then set `NEXT_PUBLIC_STRAPI_URL` to the Strapi URL and
`NEXT_PUBLIC_SITE_URL` to the site's own URL.
