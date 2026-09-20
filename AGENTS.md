# Agent notes

Read this before touching code. It exists so that an assistant working in this repo
starts from what is actually true here, not from what is common elsewhere.

## Versions that differ from training data

- **Next.js 16.3** — `middleware.ts` is `proxy.ts`; `revalidateTag()` needs a second
  argument; `updateTag()` exists and is what cart mutations use. The version-matched
  docs are bundled: read `apps/web/node_modules/next/dist/docs/` and heed
  `apps/web/AGENTS.md`.
- **Zod 4** — `z.email()` not `z.string().email()`; `{ error }` not `{ message }`.
- **Prisma 7** — `generator client { provider = "prisma-client" }` with an explicit
  `output`; import `PrismaClient` from `src/generated/prisma/client`, not `@prisma/client`.
- **Express 5** — rejected promises reach the error handler on their own.

## Layout

```
apps/web            Next.js storefront. See README.md for the request flow.
apps/api            Express API. controller → service → repository → Prisma.
packages/contracts  Zod schemas shared by both. Depends only on zod.
docs/               Hand-written by the project author. Do not generate content here.
```

## Conventions that matter

- Money is an integer count of minor units everywhere except `formatMoney()`.
- Wire and database names are snake_case (`base_price`, `access_token`); code is
  camelCase. On the API, Prisma `@map` does the translation and the `to*Dto` mappers
  emit snake_case. On the web, only `serializers/` may touch a snake_case key —
  `deserialize*` for responses, `serialize*` for request bodies. Three schemas per
  mutation in `@ecom/contracts`: `*FormSchema` (RHF), `*PayloadSchema` (FormData),
  `*BodySchema` (wire).
- Every mutation is a real `<form>` posting to a server action, then progressively
  enhanced. Do not add a mutation that only works with JavaScript on.
- Server actions return `FormState` (`apps/web/src/models/form-state.ts`) and follow
  the recipe in `apps/web/src/actions/`. `redirect()` goes outside the try/catch.
- Two zod schemas per operation: `*FormSchema` (client, real types) and
  `*PayloadSchema` (server, coerces FormData strings). Both live in `@ecom/contracts`.
- Tokens never reach the browser. Nothing under `apps/web` reads `localStorage` or
  a non-httpOnly cookie for auth.
- `apps/api/src/lib/errors.ts` — throw a typed `AppError` subclass; never a bare
  `Error` with a message meant for a user.

## The four documents in `docs/`

`database.md`, `backend.md`, `frontend.md` and `ai-usage.md` are written by the
author without AI assistance, as the assessment requires. Do not draft, outline, edit
or "improve" them. Creating the empty file with a title line is the extent of it.
