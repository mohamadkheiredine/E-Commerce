# Atlas Store

A small e-commerce platform: a Next.js storefront talking to a Node.js API, in one repository.

Login · 15-product catalogue with variants · product detail · cart · wishlist · checkout · order confirmation. Fully responsive, and every flow works with JavaScript disabled.

```
Browser ──▶ Next.js 16 (apps/web) ──▶ Express 5 (apps/api) ──▶ Prisma 7 ──▶ SQLite
              server components,        controller → service        integers for money,
              server actions,           → repository                transactions for checkout
              httpOnly cookies
```

## Quick start

Requires Node 22+ (24 LTS recommended, see `.nvmrc`) and npm. No Docker, no external database.

```bash
git clone https://github.com/mohamadkheiredine/E-Commerce.git
cd E-Commerce

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

npm install          # also runs `prisma generate`
npm run db:seed      # creates the SQLite file, applies migrations, loads 15 products
npm run dev          # web on :3000, api on :4000
```

Then open <http://localhost:3000> and sign in with:

| Email            | Password       |
| ---------------- | -------------- |
| `demo@shop.test` | `Password123!` |

Everything else in the app is reachable from there.

## Repository layout

This is a monorepo (npm workspaces + Turborepo) because the two apps share a contract. The zod schema that validates a login request on the API is the same object that drives the form resolver in the browser and parses `FormData` in the server action. One definition; nothing to keep in sync.

```
apps/
  web/                Next.js 16 storefront (App Router, server actions, Tailwind v4)
  api/                Express 5 API, Prisma 7, SQLite
packages/
  contracts/          zod schemas + inferred types shared by both apps (depends only on zod)
docs/                 architecture notes written by the author — see the assessment brief
.github/workflows/    CI: format, lint, typecheck, test, build on every push and PR
```

### `apps/web/src`

| Folder         | Role                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`         | Routes. `(auth)/login` is public; everything under `(shop)/` requires a session. Every route folder has `page.tsx`, `loading.tsx` and `error.tsx`.                                  |
| `actions/`     | Server actions, one file per entity. All return `FormState`. This is the only place the browser's input meets the server.                                                           |
| `data-layer/`  | Typed reads and writes against the API, one folder per entity. Pages and actions call these; nothing else calls the API directly.                                                   |
| `serializers/` | API DTO → view model. Computes display fields (`lineTotal`, `variantLabel`, `isLowStock`, formatted prices) in one place so components stay dumb.                                   |
| `models/`      | `FormState` and app-side zod schemas that are not part of the wire contract.                                                                                                        |
| `components/`  | `shared/` are the design-system primitives (button, card, dialog, form…). `features/` are per-entity UI. `layout/` is chrome (header, mobile nav, error card).                      |
| `lib/api/`     | The HTTP client that attaches the access token and refreshes it on 401. `handle-api-error.ts` maps API error codes to user-facing copy.                                             |
| `lib/auth/`    | Cookie-backed session helpers and `getUserOrRedirect()`, which every protected page and data-layer function calls.                                                                  |
| `proxy.ts`     | Next 16's middleware (renamed from `middleware.ts`). Redirects unauthenticated requests to `/login?next=…` and refreshes near-expiry sessions. UX layer, not the security boundary. |

### `apps/api/src`

| Folder        | Role                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/`    | One folder per domain (`auth`, `products`, `cart`, `wishlist`, `orders`). Each has `routes` → `controller` (HTTP only) → `service` (business rules, owns transactions) → `repository` (the only file that touches Prisma). |
| `middleware/` | `authenticate` (JWT → `req.user`), `validate` (zod schema → parsed body/params), `rate-limit`, `request-id`, `error-handler`.                                                                                              |
| `lib/`        | `errors.ts` (typed `AppError` hierarchy), `jwt.ts`, `password.ts` (argon2id), `prisma.ts`, `logger.ts` (pino, with secret redaction).                                                                                      |
| `config/`     | `env.ts` — every variable validated with zod at boot. A missing one stops the process with a readable message.                                                                                                             |
| `prisma/`     | `schema.prisma`, migrations, `seed.ts`.                                                                                                                                                                                    |

## The request flow, traced

### Reading: the product listing

```
GET /products
  │
  ▼
app/(shop)/products/page.tsx            server component
  │  const products = await fetchProducts()
  ▼
data-layer/products/server.ts           withUserCache(['products'], async (api) => …)
  │  const { api } = await getUserOrRedirect()      ← reads the httpOnly cookie, redirects if absent
  │  const dto = await api.get('/products')         ← Authorization: Bearer <access token>
  ▼
lib/api/client.ts                       fetch → on 401, POST /auth/refresh once, retry
  │
  ▼  HTTP
apps/api  routes → authenticate → controller → products.service → products.repository → Prisma
  │
  ◀  { data: ProductDto[] }
  │
  ▼
serializers/product.ts                  deserializeProducts(dto) → view model with formatted prices, stock flags
  │
  ▼
components/features/products/*          render
```

`getUserOrRedirect()` returns `{ user, api }` — a user plus an HTTP client already bound to that user's token. Every data-layer function destructures it, so no call site can forget to authenticate.

### Writing: add to cart

The interesting path, because it has to work with JavaScript off.

```
<form action={addToCartAction}>            a real HTML form; posts without JS
  │
  │  with JS: onSubmit intercepts, react-hook-form validates with the *same* zod
  │  schema, then dispatches the identical FormData through startTransition
  ▼
actions/cart-actions.ts   addToCartAction(prevState, formData)
  │  1. Object.fromEntries(formData)
  │  2. addToCartPayloadSchema.safeParse(...)    ← from @ecom/contracts; coerces the strings
  │     └─ on failure: return { message, fields, issues }   (form re-renders with errors, JS or not)
  │  3. await addToCart(parsed.data)             ← data layer
  │     └─ on throw: return { success: false, message, issues: [handleApiError(error)] }
  │  4. refresh()                                 ← Next 16: re-renders the route and its layout, so the header badge updates
  │  5. return { success: true, message }         ← toast
  ▼
data-layer/cart/server.ts   api.post('/cart/items', payload)
  ▼  HTTP
apps/api  validate(addToCartPayloadSchema) → cart.controller → cart.service
              │  resolves stock for that product/variant
              │  rejects: VARIANT_REQUIRED, OUT_OF_STOCK, INSUFFICIENT_STOCK
              │  finds an existing line for (user, product, variant) and increments, else inserts
              ▼
          cart.repository → Prisma
```

The same shape repeats for every mutation: quantity change, variant change, remove, wishlist toggle, place order. Variant change is the notable one — switching a line to a variant that is _already_ in the cart merges the two lines rather than colliding with the `unique(userId, productId, variantId)` constraint.

### Signing in

```
<form action={loginAction}>
  ▼
actions/auth-actions.ts   loginPayloadSchema.safeParse → api.post('/auth/login')
  │
  ◀  { user, accessToken, refreshToken }
  │
  │  cookies().set('access_token',  …, { httpOnly, secure, sameSite: 'lax',    path: '/' })
  │  cookies().set('refresh_token', …, { httpOnly, secure, sameSite: 'strict', path: '/' })
  ▼
redirect(searchParams.next ?? '/products')
```

Tokens are set by the Next.js server and read only by the Next.js server. Nothing under `apps/web` reads `localStorage` or a JavaScript-visible cookie for auth, so an XSS has nothing to steal. The browser never calls the API at all, which is why the API's CORS allow-list is a single origin.

Sign-up (`/signup` → `signupAction` → `POST /auth/signup`) is the same path with one difference: the server action parses the form with `signupFormSchema`, which includes the password confirmation, and forwards only `signupPayloadSchema`'s fields to the API. The API responds with a session, so a new account lands in the catalogue already signed in.

## Authentication design

- **Access token**: 15-minute JWT (HS256, `jose`). Carried as `Authorization: Bearer` from the Next server to the API.
- **Refresh token**: 7-day opaque random string, stored **hashed** in the database. Rotated on every use.
- **Reuse detection**: refresh tokens belong to a _family_ (one per login). Presenting a token that has already been rotated is treated as theft: the whole family is revoked, which also logs out the legitimate user. That is the intended trade-off.
- **Passwords**: argon2id via `@node-rs/argon2` (memory-hard; prebuilt binaries, no native toolchain on Windows). "No such user" and "wrong password" return the same response with comparable timing, so the login endpoint does not confirm which emails exist. Sign-up necessarily does (a `409 EMAIL_TAKEN`), because without an outbound email pipeline there is no other way to tell someone why their sign-up did nothing; a per-IP limit of 10 per hour bounds how fast that can be harvested. Password policy is NIST 800-63B: 8–128 characters, no composition rules.
- **Rate limiting** on `/auth/*`, `helmet`, 100 KB JSON body cap, single-origin CORS.
- **Three layers on the web side**: `proxy.ts` redirects (UX); `getUserOrRedirect()` in every page and data-layer call; and the API's own JWT check, which is the only one that decides. Next.js middleware is deliberately not treated as the authorization boundary.

## API

Base path `/api/v1`. Every response is an envelope: `{ data }` on success, `{ error: { code, message, details? }, requestId }` on failure. The `code` is a stable string from `packages/contracts` and is what the web app maps to user-facing copy.

| Method | Path                                      | Auth | Notes                                                    |
| ------ | ----------------------------------------- | ---- | -------------------------------------------------------- |
| POST   | `/auth/signup`                            |      | rate-limited per IP; creates the user, returns a session |
| POST   | `/auth/login`                             |      | rate-limited; returns user + token pair                  |
| POST   | `/auth/refresh`                           |      | rotates the pair; reuse revokes the family               |
| POST   | `/auth/logout`                            | ✓    | revokes the presented refresh token's family             |
| GET    | `/auth/me`                                | ✓    |                                                          |
| GET    | `/products`                               | ✓    | all 15, with variants                                    |
| GET    | `/products/:slug`                         | ✓    |                                                          |
| GET    | `/cart`                                   | ✓    | lines with resolved unit price, line total, stock        |
| POST   | `/cart/items`                             | ✓    | `{ productId, variantId?, quantity }`; merges duplicates |
| PATCH  | `/cart/items/:id`                         | ✓    | `{ quantity }` or `{ variantId }`; variant change merges |
| DELETE | `/cart/items/:id`                         | ✓    |                                                          |
| GET    | `/wishlist`                               | ✓    |                                                          |
| POST   | `/wishlist/items`                         | ✓    | `{ productId }`; idempotent                              |
| DELETE | `/wishlist/items/:productId`              | ✓    |                                                          |
| POST   | `/wishlist/items/:productId/move-to-cart` | ✓    | one operation, not add-then-remove                       |
| POST   | `/orders`                                 | ✓    | `Idempotency-Key` header; transactional stock decrement  |
| GET    | `/orders/:orderNumber`                    | ✓    |                                                          |
| GET    | `/health` (no prefix)                     |      | checks the database, not just the process                |

## Data model

```
User ─┬─ RefreshToken   (tokenHash, family, expiresAt, revokedAt)
      ├─ CartItem       (productId, variantId?, quantity)   unique(userId, productId, variantId)
      ├─ WishlistItem   (productId)                         unique(userId, productId)
      └─ Order ─── OrderItem  (titleSnapshot, variantLabelSnapshot, unitPrice, quantity, lineTotal)

Product ─── Variant  (type, value, priceDelta, stock, sku)
```

- **Money is an integer count of minor units** (fils) everywhere — database, API, business logic. It becomes a string once, in `formatMoney()`.
- Products without variants keep stock on the product row; products with variants keep it per variant. `availableStock()` in the service resolves which, so no caller branches on it.
- **Order lines are snapshots.** Renaming or repricing a product tomorrow must not change what a customer bought today. `OrderItem.productId` is a soft reference with no foreign key.
- Checkout runs in one transaction: re-check stock, decrement, create the order and lines, clear the cart. All or nothing. The `Idempotency-Key` makes a double-submitted checkout return the original order.

The seed loads 15 products, 4 of which have multiple variants, with stock deliberately uneven (several at zero, a few in low single digits) so out-of-stock, low-stock and quantity-clamping states are all reachable without editing the database.

## Scripts

Run from the repository root.

| Script              | What it does                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`       | both apps, with Turbopack and `tsx watch`                                              |
| `npm run build`     | production build of both (`next build`; API bundled with tsup)                         |
| `npm run lint`      | ESLint across all three packages                                                       |
| `npm run typecheck` | `tsc --noEmit` across all three (web runs `next typegen` first)                        |
| `npm run test`      | Vitest + Supertest for the API: 59 specs across auth, products, cart, wishlist, orders |
| `npm run format`    | Prettier                                                                               |
| `npm run db:seed`   | apply migrations and load seed data (safe to re-run; it resets the data)               |
| `npm run db:reset`  | drop, re-migrate, re-seed                                                              |
| `npm run db:studio` | Prisma Studio                                                                          |

## Environment

Both apps validate their environment with zod at boot and refuse to start with a clear message if anything is missing.

`apps/api/.env` — see `.env.example`. `JWT_SECRET` must be at least 32 characters; the committed example value is for local development only.

`apps/web/.env.local` — `API_URL` is server-only on purpose. It is not prefixed `NEXT_PUBLIC_` because the browser must never call the API directly.

## Version control

One repository, trunk-based. `main` is the integration branch and is protected by CI; each feature was built on a short-lived branch and merged with a merge commit, so `git log --graph` reads as the build order:

```
chore: scaffold monorepo …            main
feat/auth        → login, sessions, refresh rotation with reuse detection
feat/catalogue   → product listing and detail
feat/cart        → cart with variant merge
feat/wishlist-checkout → wishlist and transactional checkout
```

Monorepo rather than two repositories because the two apps share a contract (`packages/contracts`) and change together — an endpoint and its caller land in one commit and one CI run. At this size, a second repository would add a release-coordination problem without removing any coupling.

Each commit message records what was built and, where it matters, what was tried first and why it changed — the grace-window bug the auth tests caught, the `revalidateTag` → `updateTag` switch — so the reasoning is in the history, not only in the docs.

## Verifying the things the brief cares about

**Progressive enhancement.** Open DevTools → Settings → Debugger → _Disable JavaScript_. Then: sign in → open a product → choose a variant → add to cart → change the quantity in the cart → place the order. Every step is a real form post and completes.

**Responsiveness.** The layout is checked at 375px, 768px and 1280px. Under `sm` the header collapses to a logo plus cart badge and navigation moves to a fixed bottom tab bar; the cart table becomes stacked cards. Nothing scrolls horizontally.

**State edge cases.** Out-of-stock products cannot be added; the quantity stepper caps at available stock; choosing a variant already in the cart merges lines; placing an order after stock ran out is rejected with a reason rather than silently overselling; placing an order twice returns the same order.

**Session.** `document.cookie` in the console shows no token. After 15 minutes the access token refreshes transparently. Replaying an old refresh token logs the session out.

## Notes on dependencies

- **Next 16** renamed `middleware.ts` to `proxy.ts`, made `revalidateTag()` take a cache-life argument, and added `updateTag()` and `refresh()`. Cart and wishlist actions call `refresh()` (their data is not cached; the layout with the badge just needs re-rendering). Checkout calls `updateTag('products')` so the buyer sees the new stock at once — `revalidateTag(…, 'max')` was tried first and, being stale-while-revalidate, showed the pre-purchase count one more time.
- **Prisma 7** requires an explicit `output` for the generated client and moves the datasource URL to `prisma.config.ts` with a driver adapter (`@prisma/adapter-better-sqlite3` here). The `prisma` CLI's `latest` npm tag currently points at a release candidate, so both `prisma` and `@prisma/client` are pinned to `7.10.0`.
- `npm audit` reports advisories in the Prisma **CLI's** own dependencies (`mysql2`, `deepmerge-ts`). They are dev-time only and not reachable from this API, which uses SQLite; npm's proposed fix is a downgrade to Prisma 6.
- Product images are `picsum.photos` placeholders, seeded by slug so each product keeps the same image between reseeds.
