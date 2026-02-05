# ScOp LP Portal - Implementation Guide

**Companion to:** PRD.md v1.0  
**Approach:** Phase-by-phase implementation with clear deliverables and verification steps

---

## Overview

### What We're Building
A secure LP portal for ScOp Venture Capital with:
- LP-facing portal (read-only fund data, updates)
- Admin portal (manage LPs, metrics, companies, investments, updates)
- Magic link + password authentication
- Row-level security for multi-fund access control

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Database | Supabase (PostgreSQL + Auth) |
| UI | Tailwind CSS + shadcn/ui |
| Tables | @tanstack/react-table |
| Charts | recharts |
| Markdown | react-markdown |

### Time Estimates
| Phase | Scope | Est. Time |
|-------|-------|-----------|
| 1 | Infrastructure & Schema | 2-3 hrs |
| 2 | Authentication | 4-5 hrs |
| 3 | Admin Portal | 8-10 hrs |
| 4 | LP Portal | 4-5 hrs |
| 5 | Polish & Launch | 2-3 hrs |
| **Total** | | **20-26 hrs** |

---

## Phase 1: Infrastructure & Schema

### Objective
Set up Supabase, create database schema with RLS, scaffold Next.js project.

### 1.1 Supabase Project

**Create project at supabase.com:**
1. New project → Note project URL and API keys
2. Authentication → Settings:
   - Site URL: `http://localhost:3000` (update for production later)
   - Redirect URLs: Add `http://localhost:3000/auth/callback`
   - Email Auth: Enabled
   - Password minimum length: 8

**Keys to save (for .env.local):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Database Schema

Execute in Supabase SQL Editor. This is the complete schema from PRD Section 6, with RLS policies from PRD Section 9.5.1.

```sql
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'lp');
CREATE TYPE fund_status AS ENUM ('active', 'closed');
CREATE TYPE company_status AS ENUM ('active', 'exited', 'written_off');
CREATE TYPE investment_type AS ENUM ('safe', 'equity');
CREATE TYPE investment_stage AS ENUM ('initial', 'follow_on');
CREATE TYPE investment_role AS ENUM ('lead', 'co_lead', 'follow');
CREATE TYPE update_status AS ENUM ('draft', 'published');

-- =============================================
-- TABLES (in dependency order)
-- =============================================

-- 1. Funds
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  start_date DATE,
  status fund_status DEFAULT 'active'
);

-- 2. AllowedLPs
CREATE TABLE allowed_lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LPFundAccess (junction)
CREATE TABLE lp_fund_access (
  allowed_lp_id UUID REFERENCES allowed_lps(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE RESTRICT,
  PRIMARY KEY (allowed_lp_id, fund_id)
);

-- 4. Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  allowed_lp_id UUID REFERENCES allowed_lps(id),
  role user_role DEFAULT 'lp',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FundMetrics
CREATE TABLE fund_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  quarter INT CHECK (quarter >= 1 AND quarter <= 4),
  year INT,
  as_of_date DATE,
  tvpi DECIMAL,
  dpi DECIMAL,
  moic DECIMAL,
  irr DECIMAL,
  fund_size DECIMAL,
  capital_called DECIMAL,
  invested_capital DECIMAL,
  capital_distributed DECIMAL,
  dry_powder DECIMAL,
  num_investments INT,
  primary_investments INT,
  follow_on_investments INT,
  median_initial_check DECIMAL,
  median_initial_valuation DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fund_id, quarter, year)
);

-- 6. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  location TEXT,
  status company_status DEFAULT 'active',
  ownership_percentage DECIMAL,
  total_invested DECIMAL,
  first_investment_date DATE,
  website_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CompanyFunds (junction)
CREATE TABLE company_funds (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE RESTRICT,
  PRIMARY KEY (company_id, fund_id)
);

-- 8. Investments
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE RESTRICT NOT NULL,
  investment_date DATE,
  investment_type investment_type,
  stage investment_stage,
  amount DECIMAL,
  ownership_percentage DECIMAL,
  role investment_role,
  post_money_valuation DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Updates
CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  status update_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. UpdateFundVisibility (junction)
CREATE TABLE update_fund_visibility (
  update_id UUID REFERENCES updates(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE RESTRICT,
  PRIMARY KEY (update_id, fund_id)
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_fund_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_fund_visibility ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_fund(target_fund_id uuid)
RETURNS boolean AS $$
  SELECT 
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN lp_fund_access lfa ON u.allowed_lp_id = lfa.allowed_lp_id
      WHERE u.id = auth.uid() 
      AND lfa.fund_id = target_fund_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES
-- =============================================

-- AllowedLPs: admin only
CREATE POLICY "Admin full access" ON allowed_lps FOR ALL USING (is_admin());

-- LPFundAccess: LPs read own, admin full
CREATE POLICY "LPs read own access" ON lp_fund_access FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.allowed_lp_id = lp_fund_access.allowed_lp_id
  ));
CREATE POLICY "Admin full access" ON lp_fund_access FOR ALL USING (is_admin());

-- Users: own record with role protection, admin full
CREATE POLICY "Read own or admin" ON users FOR SELECT 
  USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users create own record" ON users FOR INSERT
  WITH CHECK (id = auth.uid() AND role = 'lp');
CREATE POLICY "Users update own record" ON users FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (role = 'lp');
CREATE POLICY "Admin full access" ON users FOR ALL USING (is_admin());

-- Funds: authenticated read, admin write
CREATE POLICY "Authenticated read" ON funds FOR SELECT 
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON funds FOR ALL USING (is_admin());

-- FundMetrics: by fund access
CREATE POLICY "Read by fund access" ON fund_metrics FOR SELECT 
  USING (can_access_fund(fund_id));
CREATE POLICY "Admin write" ON fund_metrics FOR ALL USING (is_admin());

-- Companies: via CompanyFunds junction
CREATE POLICY "Read by fund access" ON companies FOR SELECT 
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM company_funds cf 
    WHERE cf.company_id = companies.id AND can_access_fund(cf.fund_id)
  ));
CREATE POLICY "Admin write" ON companies FOR ALL USING (is_admin());

-- CompanyFunds: by fund access
CREATE POLICY "Read by fund access" ON company_funds FOR SELECT 
  USING (can_access_fund(fund_id));
CREATE POLICY "Admin write" ON company_funds FOR ALL USING (is_admin());

-- Investments: by fund access
CREATE POLICY "Read by fund access" ON investments FOR SELECT 
  USING (can_access_fund(fund_id));
CREATE POLICY "Admin write" ON investments FOR ALL USING (is_admin());

-- UpdateFundVisibility: by fund access
CREATE POLICY "Read by fund access" ON update_fund_visibility FOR SELECT 
  USING (can_access_fund(fund_id));
CREATE POLICY "Admin write" ON update_fund_visibility FOR ALL USING (is_admin());

-- Updates: published + fund visibility
CREATE POLICY "Read published by fund" ON updates FOR SELECT 
  USING (is_admin() OR (status = 'published' AND EXISTS (
    SELECT 1 FROM update_fund_visibility ufv
    WHERE ufv.update_id = updates.id AND can_access_fund(ufv.fund_id)
  )));
CREATE POLICY "Admin write" ON updates FOR ALL USING (is_admin());

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO funds (name, slug, status) VALUES 
  ('ScOp Fund I', 'fund_i', 'active'),
  ('ScOp Fund II', 'fund_ii', 'active');
```

### 1.3 Next.js Project

**Terminal commands:**
```bash
npx create-next-app@latest lp-portal --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd lp-portal
npm install @supabase/supabase-js @supabase/ssr
npm install recharts react-markdown @tanstack/react-table
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card table tabs dropdown-menu select dialog textarea alert
```

### 1.4 Project Structure

Create this folder structure:
```
src/
├── app/
│   ├── login/
│   ├── auth/
│   │   ├── callback/
│   │   ├── setup-password/
│   │   └── reset-password/
│   ├── portal/
│   │   ├── stats/
│   │   ├── portfolio/
│   │   └── updates/
│   │       └── [id]/
│   └── admin/
│       ├── lps/
│       ├── metrics/
│       ├── companies/
│       ├── investments/
│       └── updates/
│           ├── new/
│           └── [id]/
├── components/
│   └── ui/           (shadcn components go here)
└── lib/
    ├── supabase/     (client, server, admin clients)
    ├── types.ts      (TypeScript types matching schema)
    └── actions/      (server actions)
```

### 1.5 Verification

- [ ] Supabase project created and accessible
- [ ] All 10 tables visible in Supabase Table Editor
- [ ] 2 helper functions created (check in Database → Functions)
- [ ] RLS enabled on all tables (lock icon visible)
- [ ] Seed data: 2 funds exist
- [ ] Next.js app runs with `npm run dev`
- [ ] shadcn components installed (check components/ui folder)
- [ ] Environment variables set in `.env.local`

---

## Phase 2: Authentication

### Objective
Implement the complete auth flow from PRD Section 3.1.

### 2.1 Supabase Client Files

**Create three Supabase client utilities in `src/lib/supabase/`:**

| File | Purpose | Uses |
|------|---------|------|
| `client.ts` | Browser-side client | Client components |
| `server.ts` | Server-side client with cookies | Server components, Server actions |
| `admin.ts` | Service role client (bypasses RLS) | Admin operations like user deletion |

Reference: Supabase SSR documentation for Next.js App Router

### 2.2 TypeScript Types

**Create `src/lib/types.ts`:**

Define TypeScript interfaces matching each database table. Include:
- All column types
- Enum types (UserRole, FundStatus, etc.)
- Nullable fields marked appropriately

### 2.3 Auth Server Actions

**Create `src/lib/actions/auth.ts`:**

Implement server actions for:

| Action | Description | PRD Reference |
|--------|-------------|---------------|
| `checkEmail(email)` | Check AllowedLPs, determine if new/existing user | 3.1 Login Page UX |
| `sendMagicLink(email)` | Send OTP email for first-time users | 3.1 First-Time Login |
| `signInWithPassword(email, password)` | Password login, update last_login_at | 3.1 Subsequent Logins |
| `setupPassword(password)` | Set password for new user | 3.1 First-Time Login step 7 |
| `createUserRecord()` | Create Users row on first login | 3.1 First-Time Login step 8 |
| `resetPassword(email)` | Trigger password reset email | 3.1 Password Reset |
| `signOut()` | Sign out and redirect to login | - |
| `getCurrentUser()` | Get current user with allowed_lps data | - |
| `getUserFunds()` | Get funds user can access | - |

### 2.4 Middleware

**Create `src/middleware.ts`:**

Implement route protection:
- `/portal/*` → Requires authenticated user
- `/admin/*` → Requires authenticated user with role='admin'
- `/login` → Redirect to portal/admin if already authenticated
- `/` → Redirect to login

Reference: PRD Section 3.4 Access Control

### 2.5 Auth Pages

**Create these pages:**

| Route | Purpose | Key Elements |
|-------|---------|--------------|
| `/login` | Email entry → password or magic link | Two-step form, error states |
| `/auth/callback` | Handle magic link redirect | Route handler, redirect logic |
| `/auth/setup-password` | First-time password setup | Password validation per PRD 3.3 |
| `/auth/reset-password` | Password reset form | Similar to setup-password |

**Password validation (PRD 3.3):**
- Minimum 8 characters
- At least one uppercase
- At least one lowercase
- At least one number

### 2.6 Verification

- [ ] Unauthenticated user at `/portal` redirected to `/login`
- [ ] Email not in AllowedLPs shows "Contact ScOp for access"
- [ ] New user (in AllowedLPs, no User record) receives magic link
- [ ] Magic link → setup-password → User record created → redirected to portal
- [ ] Existing user sees password field, can log in
- [ ] Password reset flow works end-to-end
- [ ] Admin user redirected to `/admin` after login
- [ ] LP user cannot access `/admin/*` routes
- [ ] Logout clears session and redirects to login

---

## Phase 3: Admin Portal

### Objective
Build admin interface for managing all data. Reference PRD Section 5.

### 3.1 Admin Layout

**Create `/admin/layout.tsx`:**
- Verify user is admin (redirect if not)
- Navigation: Dashboard, Metrics, LPs, Companies, Investments, Updates
- User dropdown with logout and "LP Portal" link
- Reference: PRD Section 5 intro

### 3.2 Dashboard

**Route:** `/admin`

**Components:**
- Quick stats cards (total LPs, published updates, last metrics update)
- Quick action buttons linking to add LP, new update, update metrics

**Data needed:**
- Count from `allowed_lps`
- Count from `updates` where status='published'
- Latest `updated_at` from `fund_metrics`

Reference: PRD 5.1

### 3.3 LPs Management

**Route:** `/admin/lps`

**UI Pattern:** Table with inline editing (PRD 5.3)

**Columns:** Email | Name | Organization | Funds | Last Login

**Features:**
- Add new LP via modal (email, name, org, fund checkboxes)
- Inline edit cells (auto-save on blur)
- Delete with confirmation dialog
- Last Login shows "Never" if no User record

**Data operations:**
- List: Query `allowed_lps` joined with `lp_fund_access` and `users`
- Create: Insert `allowed_lps` + `lp_fund_access` rows
- Update: Update `allowed_lps`, sync `lp_fund_access`
- Delete: Transaction per PRD 3.1 LP Removal

Reference: PRD 5.3

### 3.4 Fund Metrics

**Route:** `/admin/metrics`

**UI Pattern:** Spreadsheet view (PRD 5.2)

**Layout:**
- Fund tabs (Fund I / Fund II)
- Rows = metrics (fixed, from schema)
- Columns = quarters (dynamic)
- "+ Add Quarter" button

**Features:**
- Click cell to edit, auto-save on blur
- Add quarter modal (Quarter dropdown 1-4, Year dropdown)
- Quarters cannot be deleted

**Data operations:**
- Query `fund_metrics` for selected fund, ordered by year/quarter
- Transpose data: metrics as rows, quarters as columns
- Update individual metric values
- Insert new quarter row with nulls

Reference: PRD 5.2

### 3.5 Companies

**Route:** `/admin/companies`

**UI Pattern:** Table with inline editing (PRD 5.4)

**Columns:** Name | Funds | Sector | Location | Status | Ownership % | Website

**Features:**
- Add company via modal
- Inline edit cells
- Funds: multi-select checkboxes
- Delete: blocked if investments exist, cascades to `company_funds`

**Data operations:**
- List: Query `companies` joined with `company_funds`
- Create: Insert `companies` + `company_funds` rows
- Delete: Check for investments first

Reference: PRD 5.4

### 3.6 Investments

**Route:** `/admin/investments`

**UI Pattern:** Table with inline editing (PRD 5.5)

**Columns:** Company | Fund | Date | Type | Stage | Amount | Ownership % | Role | Post-Money

**Features:**
- Add investment via modal
- Company dropdown (from companies table)
- Fund dropdown
- **On save: Show reminder dialog** (PRD 5.5)

**Reminder dialog text:**
> "Don't forget to update {Company}'s total ownership and invested amount on the Companies page if needed."

Reference: PRD 5.5

### 3.7 Updates

**Routes:**
- `/admin/updates` - List view
- `/admin/updates/new` - Create
- `/admin/updates/[id]` - Edit

**List view (PRD 5.6):**
- Cards showing: Title, Funds (visible to), Status, Date
- Click card → edit page
- Delete button with confirmation

**Editor:**
- Title field
- Fund visibility checkboxes
- Markdown textarea with live preview (side-by-side)
- Save Draft / Publish buttons
- Back link

**Data operations:**
- List: Query `updates` joined with `update_fund_visibility`
- Create/Update: Upsert `updates` + sync `update_fund_visibility`
- Publish: Set status='published', published_at=now()

Reference: PRD 5.6

### 3.8 Verification

- [ ] Dashboard shows accurate counts
- [ ] Can add LP with fund access, appears in table
- [ ] Can edit LP inline, changes persist
- [ ] Can delete LP, triggers full removal transaction
- [ ] Fund Metrics tabs switch between funds
- [ ] Can add quarter, new column appears
- [ ] Can edit metric values inline
- [ ] Can add company with multiple fund associations
- [ ] Cannot delete company with investments (shows error)
- [ ] Can add investment, reminder dialog appears on save
- [ ] Can create update, set fund visibility
- [ ] Can publish/unpublish updates
- [ ] Markdown preview renders correctly

---

## Phase 4: LP Portal

### Objective
Build read-only LP interface. Reference PRD Section 4.

### 4.1 LP Layout

**Create `/portal/layout.tsx`:**
- Verify user is authenticated
- Navigation: Logo → Home, Fund Stats, Portfolio, Updates
- Fund selector (if user has multiple funds)
- User dropdown with logout

**Fund selection logic:**
- Query user's accessible funds via `lp_fund_access`
- If single fund: no selector, use that fund
- If multiple funds: show dropdown
- Store selection in URL param `?fund=fund_i`
- Default to first fund alphabetically

Reference: PRD 4.5

### 4.2 Fund Selector Component

**Create `src/components/fund-selector.tsx`:**
- Client component (needs interactivity)
- Read current fund from URL searchParams
- On change: update URL param, triggering data refresh
- Only render if user has multiple funds

### 4.3 Home Page

**Route:** `/portal`

**Layout:**
- Welcome message
- Three large navigation cards: Fund Stats, Portfolio, Updates

**No data fetching needed** - just navigation

Reference: PRD 4.1

### 4.4 Fund Stats

**Route:** `/portal/stats`

**Layout:**
- Fund name at top
- Line chart (recharts)
- Metric selector dropdown
- Full metrics table

**Chart:**
- X-axis: quarters
- Y-axis: selected metric value
- Metric selector to switch between TVPI, DPI, MOIC, IRR, etc.

**Table:**
- Rows = metrics
- Columns = quarters (most recent on right)
- Show "As of" date from `as_of_date` field

**Data:**
- Query `fund_metrics` for selected fund
- Order by year, quarter ascending

Reference: PRD 4.2

### 4.5 Portfolio

**Route:** `/portal/portfolio`

**Layout:**
- Fund name at top
- Tabs: Companies | Investments
- Sortable table per tab

**Companies tab (PRD 4.3):**
- Columns: Name, Sector, Location, Status, Total Invested, Ownership %, First Investment Date
- Data: Query `companies` via `company_funds` for fund

**Investments tab:**
- Columns: Company, Date, Type, Stage, Amount, Ownership %, Role, Post-Money
- Data: Query `investments` for fund, join company name

**Both tabs:** Use @tanstack/react-table for sorting

Reference: PRD 4.3

### 4.6 Updates

**Routes:**
- `/portal/updates` - List
- `/portal/updates/[id]` - Detail

**List:**
- Title + published date
- Sorted by published_at descending
- Click to view full post
- RLS automatically filters by fund visibility

**Detail:**
- Title
- Published date
- Body rendered as markdown (react-markdown)

Reference: PRD 4.4

### 4.7 Verification

- [ ] LP with single fund sees no fund selector
- [ ] LP with multiple funds can switch funds
- [ ] Fund selection persists across navigation
- [ ] Fund Stats shows correct fund's metrics
- [ ] Chart renders and metric selector works
- [ ] Portfolio Companies shows fund's companies only
- [ ] Portfolio Investments shows fund's investments only
- [ ] Tables are sortable
- [ ] Updates list shows only published updates for accessible funds
- [ ] Update detail renders markdown correctly
- [ ] LP cannot see unpublished updates
- [ ] LP cannot see other funds' data

---

## Phase 5: Polish & Launch

### Objective
Add loading/error states, test thoroughly, deploy.

### 5.1 Loading States

**Create `loading.tsx` files:**
- `/portal/loading.tsx`
- `/portal/stats/loading.tsx`
- `/portal/portfolio/loading.tsx`
- `/portal/updates/loading.tsx`
- `/admin/loading.tsx`
- (etc. for admin subroutes)

**Content:** Simple "Loading..." text (PRD 8.7)

### 5.2 Error Handling

**Create `error.tsx` files:**
- Root `/error.tsx`
- Route-specific as needed

**Content:** Error message with retry button (PRD 8.7)

**Form validation:**
- Red text below fields for validation errors
- Toast for save errors

**Success feedback:**
- Brief "Saved" confirmation, fades after 2 seconds

### 5.3 Testing Checklist

**Authentication:**
- [ ] New LP signup flow (magic link → password setup → portal)
- [ ] Returning LP login
- [ ] Password reset flow
- [ ] Admin login → admin portal
- [ ] Session persists across refresh
- [ ] Logout clears session
- [ ] Cannot access protected routes without auth

**Authorization (RLS):**
- [ ] LP sees only their fund(s) data
- [ ] LP cannot see unpublished updates
- [ ] LP cannot access admin routes
- [ ] Admin sees all data
- [ ] Direct Supabase queries respect RLS

**Admin CRUD:**
- [ ] Create/Read/Update/Delete for each entity
- [ ] LP deletion transaction works correctly
- [ ] Cascades work (company deletion removes company_funds)
- [ ] Blocks work (cannot delete company with investments)

**LP Portal:**
- [ ] All pages render correctly
- [ ] Fund switching works
- [ ] Data is accurate per fund
- [ ] Sorting works on tables
- [ ] Markdown renders correctly

### 5.4 Production Configuration

**Supabase Dashboard:**
1. Authentication → Settings → Site URL: `https://lp.scopvc.com`
2. Authentication → URL Configuration → Redirect URLs: Add `https://lp.scopvc.com/auth/callback`
3. Authentication → Settings → Password Requirements: Verify settings match PRD 3.3

**Environment Variables (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5.5 Deployment

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Configure custom domain `lp.scopvc.com`
6. Update Supabase redirect URLs

### 5.6 Initial Admin Setup

After deployment, seed admin user(s):

1. Add admin email to `allowed_lps` (via Supabase dashboard)
2. Add `lp_fund_access` rows for both funds
3. Admin signs up via magic link
4. Manually update `users.role` to 'admin' using service role key or Supabase dashboard

Reference: PRD 9 Phase 1.3 Seed Data

### 5.7 Go-Live Checklist

- [ ] Production environment variables set
- [ ] Domain configured with SSL
- [ ] Supabase redirect URLs updated for production
- [ ] Admin user created and role set to admin
- [ ] Test login flow in production
- [ ] Initial fund metrics entered
- [ ] Initial companies/investments entered (if any)
- [ ] First update published (optional)

---

## Quick Reference

### PRD Section Mapping

| Implementation | PRD Section |
|----------------|-------------|
| Auth flow | 3.1 |
| Password requirements | 3.3 |
| RLS policies | 9 Phase 5.1 |
| LP Portal pages | 4.1 - 4.5 |
| Admin Portal pages | 5.1 - 5.6 |
| Data model | 6 |
| Tech stack | 7 |
| Design guidelines | 8 |

### Key Patterns

| Pattern | Used In |
|---------|---------|
| Server Actions | All mutations (create, update, delete) |
| Server Components | Data fetching, layouts |
| Client Components | Interactive UI (forms, dropdowns, tabs) |
| URL params for state | Fund selection |
| Inline editing | Admin tables |
| Modal for create | Admin add forms |

---

*Implementation Guide v1.0 - Corresponds to PRD.md v1.0*
