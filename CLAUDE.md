# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

ScOp Venture Capital LP Portal. Two docs define everything:
- **PRD.md** -- Full product spec (features, data model, auth flow, design rules, RLS policies)
- **IMPLEMENTATION.md** -- Phase-by-phase build guide with copy-paste SQL, verification checklists, and exact file structure

Read both before touching anything. All decisions (naming, patterns, stack choices) are already made there.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ App Router, TypeScript |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| UI | Tailwind CSS + shadcn/ui |
| Tables | @tanstack/react-table |
| Charts | recharts |
| Markdown | react-markdown |

## Commands (once scaffolded)

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit    # Type-check without emitting
```

## Architecture Patterns

- **Server Actions** for all mutations (create/update/delete). No API routes.
- **Server Components** for all data fetching and layouts.
- **Client Components** only where interactivity is required (forms, dropdowns, inline edits, fund selector). Mark with `"use client"`.
- **Fund selection** is stored in URL search params (`?fund=fund_i`), not state. This keeps it SSR-friendly and persistent across navigation.
- **Supabase clients come in three flavors:**
  - `lib/supabase/client.ts` -- browser-side, for Client Components
  - `lib/supabase/server.ts` -- cookie-based, for Server Components and Server Actions
  - `lib/supabase/admin.ts` -- service-role key, bypasses RLS, for admin operations only (e.g., deleting auth users)
- **RLS does the heavy lifting.** The LP portal queries don't need `WHERE` clauses for fund filtering -- Supabase returns only rows the authenticated user can see. The admin client bypasses this.
- **Inline editing pattern** (admin tables): click cell → edit → auto-save on blur. No explicit save button on cells.
- **Modal pattern** (admin create): "Add Row" opens a modal form. On submit, insert + close modal.
- **Middleware** protects routes: `/portal/*` requires auth, `/admin/*` requires auth + role=admin, `/` redirects to `/login`.

## Data Model Notes

- `allowed_lps` is the source of truth for who is permitted. `users` is created only on first login.
- `ownership_percentage` and `total_invested` on `companies` are **manually maintained** summary fields, not computed. The investment save flow shows an explicit reminder dialog to update them.
- Junction tables (`lp_fund_access`, `company_funds`, `update_fund_visibility`) control multi-fund visibility. RLS policies use these.
- `fund_metrics` is one row per fund per quarter. The admin spreadsheet transposes this: metrics as rows, quarters as columns.

## Design Constraints (enforce these)

- White/black only. No accent colors, no gradients, no shadows, no icons unless essential.
- Top nav only. No sidebar.
- Loading states are plain "Loading..." text. No spinners.
- Empty states are plain text ("No updates yet"). No illustrations.
- Success feedback: "Saved" text that fades after 2 seconds.
- Validation errors: red text below the field.
- Font: Inter (shadcn default). Sizes: page title 24px semibold, headers 18px medium, body/tables 14px, labels 12px.

## Common Gotchas

- RLS policy names must be unique per table. The PRD reuses names like "Admin full access" across different tables -- that's fine. Don't add a second policy with the same name to the same table.
- `fund_metrics` FK to `funds` uses `ON DELETE CASCADE` in the schema SQL. The PRD's data model section doesn't specify this explicitly -- the IMPLEMENTATION.md SQL is authoritative.
- Password requirements (8 chars, upper, lower, number) must be configured in both: client-side validation AND Supabase Dashboard (Auth → Settings → Password Requirements).
- The `is_admin()` RLS helper queries the `users` table. If a user hasn't created their `users` row yet (first-time login flow), they won't match admin policies even if they will become admin. Admin role is set manually after first login.
