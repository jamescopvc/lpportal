# ScOp Venture Capital LP Portal
## Product Requirements Specification

**Version:** 1.0  
**Date:** January 28, 2026  
**Author:** James / ScOp Venture Capital

---

## 1. Executive Summary

The ScOp LP Portal is a web application that enables ScOp Venture Capital to share fund performance metrics, portfolio information, and updates with Limited Partners (LPs) in a secure, professional environment. The portal serves two funds (Fund I and Fund II) with approximately 50-100 LPs total.

### Core Value Proposition
- Centralized, secure location for LP communications
- Professional presentation of fund performance data
- Streamlined content management for the ScOp team
- Self-service access for LPs to view fund information

---

## 2. User Roles & Access

### 2.1 Administrators
- **Users:** ScOp partners and James
- **Permissions:** Full access to all features
- **Capabilities:**
  - Manage LP access (create, edit, remove)
  - Enter and update fund metrics
  - Create, edit, and publish updates
  - Manage portfolio companies and investments
  - View all data across both funds

### 2.2 Limited Partners (LPs)
- **Users:** ~50-100 investors across Fund I and Fund II
- **Permissions:** Read-only access to their fund(s)
- **Capabilities:**
  - View fund metrics and historical performance
  - View portfolio companies and investments
  - Read updates
  - Switch between funds (if invested in multiple)

---

## 3. Authentication & Security

### 3.1 Authentication Flow

**Login Page UX:**
1. User enters email, clicks "Continue"
2. Server action checks:
   - Query AllowedLPs for this email
   - If not found → show "Contact ScOp for access"
   - If found → query our Users table for this email
     - User record exists → show password field (returning user)
     - No User record → send magic link (first-time user)

**First-Time Login (Magic Link):**
1. Admin pre-loads LP email into AllowedLPs table and adds fund access via LPFundAccess
2. LP visits `/login`, enters email, clicks "Continue"
3. Server: email in AllowedLPs, no User record → first-time user
4. `supabase.auth.signInWithOtp({ email })` sends magic link
5. LP clicks link → redirects to `/auth/callback`
6. `/auth/callback`:
   - `const { data: { user } } = await supabase.auth.getUser()` gets authenticated user
   - Check our Users table - no record exists
   - Show password setup form
7. LP enters password → `supabase.auth.updateUser({ password })`
8. Create User record: `{ id: user.id, email: user.email, allowed_lp_id: <from AllowedLPs lookup>, role: 'lp' }`
9. Redirect to `/portal`

**Subsequent Logins (Password):**
1. LP visits `/login`, enters email, clicks "Continue"
2. Server: email in AllowedLPs AND User record exists → show password field
3. LP enters password → `supabase.auth.signInWithPassword({ email, password })`
4. Update `last_login_at` on User record
5. Redirect to `/portal` (or `/admin` if role is admin)

**Password Reset:**
1. LP clicks "Forgot password" on `/login`
2. `supabase.auth.resetPasswordForEmail(email)`
3. LP receives reset email, clicks link → `/auth/callback`
4. Show new password form → `supabase.auth.updateUser({ password })`

**LP Removal:**
When admin deletes LP from AllowedLPs, execute as a transaction:
1. Look up their User record by allowed_lp_id
2. If User record exists:
   a. Delete their Supabase Auth user: `supabase.auth.admin.deleteUser(userId)`
   b. Delete their User record from our DB
3. Delete the AllowedLPs record (cascades LPFundAccess via ON DELETE CASCADE)
4. Any active sessions are immediately invalidated

Note: Wrap steps 2-3 in a try/catch. If auth deletion fails, roll back and show error to admin. The AllowedLPs → LPFundAccess cascade is handled by the database.

### 3.2 Security Requirements
- Supabase Auth handles password hashing and session management
- Magic links are single-use and expire after 24 hours
- HTTPS required for all connections
- Rate limiting handled by Supabase
- Email check against AllowedLPs happens server-side
- **Session timeout:** 7 days of inactivity (configured in Supabase Auth settings)

### 3.3 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Validated client-side before submission
- **Note:** Configure password requirements in Supabase Dashboard (Auth → Settings → Password Requirements) to match these rules

### 3.4 Access Control
- Row Level Security (RLS) policies enforce fund-based access
- LPs can only query data for funds they are assigned to
- Admin role checked at application level
- No LP self-registration; email must be in AllowedLPs

---

## 4. LP Portal Features

### 4.1 Home
Landing page after login. Clean entry point with no data display.

**Layout:**
- Welcome message (e.g., "Welcome to ScOp LP Portal")
- Three large navigation links: Fund Stats, Portfolio, Updates
- Simple, elegant, uncluttered
- If LP has access to both funds, fund selector is in header (not on this page)

### 4.2 Fund Stats
All fund metrics with historical chart.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Line chart - metric over time]              Metric: [TVPI ▾]  │
├─────────────────────────────────────────────────────────────────┤
│                  Q1 2024   Q2 2024   Q3 2024   Q4 2024          │
│  TVPI            1.20      1.25      1.31      1.45             │
│  DPI             0.00      0.00      0.10      0.15             │
│  MOIC            1.30      1.35      1.42      1.55             │
│  IRR             12%       14%       15%       18%              │
│  Fund Size       $46M      $46M      $46M      $46M             │
│  Capital Called  $12M      $15M      $18M      $20M             │
│  Invested        $10M      $13M      $16M      $18M             │
│  Distributed     $0        $0        $2M       $3M              │
│  Dry Powder      $34M      $31M      $28M      $26M             │
│  # Investments   12        15        18        21               │
│  # Primary       10        12        14        16               │
│  # Follow-on     2         3         4         5                │
│  Med. Check      $1.5M     $1.5M     $1.6M     $1.6M            │
│  Med. Valuation  $15M      $15M      $16M      $16M             │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Current fund name displayed prominently at top of page (e.g., "ScOp Fund I")
- Chart shows selected metric over time (dropdown selector)
- Table shows ALL metrics from FundMetrics, quarters as columns
- Most recent quarter on the right
- "As of" date shown from `as_of_date` field

### 4.3 Portfolio
Company and investment data in tabbed table view.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Portfolio                                      [Companies ▾]   │
│                                                 [Investments]   │
├─────────────────────────────────────────────────────────────────┤
│  Company      Sector    Status   Invested   Ownership   Date    │
│  ──────────────────────────────────────────────────────────────│
│  Snag         AI        Active   $2.1M      8.5%        2021    │
│  FLIP         SaaS      Active   $1.8M      6.2%        2022    │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Companies Tab:**
- Current fund name displayed prominently at top of page
- Name, Sector, Location, Status, Total Invested, Ownership %, First Investment Date
- Sortable columns

**Investments Tab:**
- Company, Date, Type, Stage, Amount, Ownership %, Role, Post-Money
- Sortable columns

### 4.4 Updates
Simple reverse-chronological list.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Updates                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Q4 2024 Fund Update                                            │
│  January 15, 2025                                               │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Portfolio Milestone: Snag Raises Series B                      │
│  December 20, 2024                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Title + published date (from `published_at` field)
- Click to view full post
- Filtered by fund visibility
- Sorted by `published_at` descending

### 4.5 Navigation & Layout

**Header:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ScOp    Fund Stats   Portfolio   Updates         [Fund▾] [User▾] │
└─────────────────────────────────────────────────────────────────┘
```

- Logo on left (links to Home)
- Three nav links
- Fund selector dropdown (if LP has access to both funds)
  - Selected fund stored in URL query param: `?fund=fund_i`
  - Persists across navigation
  - Default (no param): use first fund alphabetically (fund_i)
  - If LP has single fund access: no dropdown, auto-use their fund
- User menu (logout)
- No footer needed

---

## 5. Admin Portal Features

The admin portal uses three UI patterns:

1. **Spreadsheet view** (metrics × quarters) - for Fund Metrics
2. **Table view** (fixed columns, add/edit rows inline) - for LPs, Companies, Investments
3. **List + editor** - for Updates

### 5.1 Admin Dashboard
Overview and quick actions.

**Components:**
- Quick stats (total LPs, updates published, last metrics update)
- Quick action buttons (add LP, new update, update metrics)

### 5.2 Fund Metrics
Spreadsheet-style interface where metrics are rows and quarters are columns.

**UI Layout:**
```
Fund I Metrics                                    [+ Add Quarter]
┌─────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Metric                  │ Q1 2024  │ Q2 2024  │ Q3 2024  │ Q4 2024  │
├─────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ TVPI                    │ 1.20     │ 1.25     │ 1.31     │ 1.45     │
│ DPI                     │ 0.00     │ 0.00     │ 0.10     │ 0.15     │
│ MOIC                    │ 1.30     │ 1.35     │ 1.42     │ 1.55     │
│ ...                     │ ...      │ ...      │ ...      │ ...      │
└─────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

**Behavior:**
- Fund selector tabs (Fund I / Fund II)
- Metrics rows are fixed (defined by data model)
- Click cell to edit, auto-save on blur
- "+ Add Quarter" button:
  - Opens modal with Quarter (1-4) and Year dropdowns
  - Defaults to next quarter after most recent
  - Creates new FundMetrics row with null values
  - New column appears, admin fills in values
- Quarters cannot be deleted (data integrity); edit values to correct mistakes

### 5.3 LPs
Table view for managing LP access.

**Columns:** Email | Name | Organization | Funds | Last Login

**Behavior:**
- Click "+ Add Row" to add new LP (modal with email, name, org, fund checkboxes)
- Click cell to edit inline
- Delete row with confirmation dialog ("Remove LP access for {email}?")
- Last Login shows "Never" if User record doesn't exist yet

### 5.4 Companies
Table view for portfolio companies.

**Columns:** Name | Funds | Sector | Location | Status | Ownership % | Website

**Behavior:**
- Click "+ Add Row" to add new company
- Click cell to edit inline
- Funds field: multi-select (Fund I, Fund II, or both)
- Delete row with confirmation (cascades to CompanyFunds; blocked if Investments exist)

### 5.5 Investments
Table view for individual investments.

**Columns:** Company | Fund | Date | Type | Stage | Amount | Ownership % | Role | Post-Money

**Behavior:**
- Click "+ Add Row" to add new investment
- Company dropdown pulls from Companies table
- Click cell to edit inline
- Delete row with confirmation dialog
- **On save (new or edit):** Show reminder dialog: "Don't forget to update {Company}'s total ownership and invested amount on the Companies page if needed." with "Got it" button

### 5.6 Updates
List + markdown editor for content management.

**List View** (`/admin/updates`):
- Cards showing: Title, Fund, Status (Draft/Published), Date
- Click card to edit → `/admin/updates/[id]`
- "+ New Update" button → `/admin/updates/new`
- Delete button on each card with confirmation

**Editor** (`/admin/updates/[id]` or `/admin/updates/new`):
- Title field
- Fund visibility checkboxes (Fund I, Fund II - select one or both)
- Markdown textarea with live preview side-by-side
- Save Draft / Publish buttons
- Back link to list

---

## 6. Data Model

### 6.1 Core Entities

```
AllowedLPs
├── id (uuid, primary key)
├── email (text, unique, not null)
├── name (text)
├── organization (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

LPFundAccess (junction table)
├── allowed_lp_id (uuid, fk → AllowedLPs, ON DELETE CASCADE)
├── fund_id (uuid, fk → Funds, ON DELETE RESTRICT)
└── primary key (allowed_lp_id, fund_id)

Users (created on first login)
├── id (uuid, primary key, references auth.users)
├── email (text, not null)
├── allowed_lp_id (uuid, fk → AllowedLPs)
├── role (enum: admin | lp, default: lp)
├── last_login_at (timestamptz)
├── created_at (timestamptz)
└── updated_at (timestamptz)

Funds
├── id (uuid, primary key)
├── name (text, not null) -- e.g., "ScOp Fund I"
├── slug (text, unique) -- "fund_i" or "fund_ii"
├── start_date (date)
└── status (enum: active | closed)

FundMetrics (one row per fund per quarter)
├── id (uuid, primary key)
├── fund_id (uuid, fk → Funds, not null)
├── quarter (int, 1-4)
├── year (int)
├── as_of_date (date)
├── tvpi (decimal)
├── dpi (decimal)
├── moic (decimal)
├── irr (decimal, nullable)
├── fund_size (decimal)
├── capital_called (decimal)
├── invested_capital (decimal)
├── capital_distributed (decimal)
├── dry_powder (decimal)
├── num_investments (int)
├── primary_investments (int)
├── follow_on_investments (int)
├── median_initial_check (decimal)
├── median_initial_valuation (decimal)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── unique(fund_id, quarter, year)

Companies
├── id (uuid, primary key)
├── name (text, not null)
├── sector (text)
├── location (text)
├── status (enum: active | exited | written_off)
├── ownership_percentage (decimal) -- current total ownership, manually maintained
├── total_invested (decimal) -- sum of all investments, manually maintained
├── first_investment_date (date)
├── website_url (text)
├── description (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

Note: ownership_percentage and total_invested on Companies are manually maintained summary fields. They should reflect totals across all Investments but are not auto-computed. Admin updates these when adding investments.

CompanyFunds (junction table)
├── company_id (uuid, fk → Companies, ON DELETE CASCADE)
├── fund_id (uuid, fk → Funds, ON DELETE RESTRICT)
└── primary key (company_id, fund_id)

Investments
├── id (uuid, primary key)
├── company_id (uuid, fk → Companies ON DELETE RESTRICT, not null)
├── fund_id (uuid, fk → Funds ON DELETE RESTRICT, not null)
├── investment_date (date)
├── investment_type (enum: safe | equity)
├── stage (enum: initial | follow_on)
├── amount (decimal)
├── ownership_percentage (decimal)
├── role (enum: lead | co_lead | follow)
├── post_money_valuation (decimal)
├── created_at (timestamptz)
└── updated_at (timestamptz)

Updates
├── id (uuid, primary key)
├── title (text, not null)
├── body (text) -- markdown
├── status (enum: draft | published)
├── published_at (timestamptz)
├── created_at (timestamptz)
└── updated_at (timestamptz)

UpdateFundVisibility (junction table)
├── update_id (uuid, fk → Updates, ON DELETE CASCADE)
├── fund_id (uuid, fk → Funds, ON DELETE RESTRICT)
└── primary key (update_id, fund_id)

Note: An update visible to both funds has two rows in UpdateFundVisibility.
```

Note: Auth (sessions, password resets) handled by Supabase Auth.

---

## 7. Technical Architecture

### 7.1 Stack & Packages

**Core:**
```bash
npx create-next-app@latest lp-portal --typescript --tailwind --app
npm install @supabase/supabase-js @supabase/ssr
```

**UI Components (shadcn/ui):**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card table tabs dropdown-menu select dialog textarea
```

**Additional Packages:**
```bash
npm install recharts              # Charts for Fund Stats
npm install react-markdown        # Render markdown in Updates
npm install @tanstack/react-table # Sortable tables for Portfolio
```

**Full package.json dependencies:**
```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "@tanstack/react-table": "^8.x",
  "recharts": "^2.x",
  "react-markdown": "^9.x",
  "tailwindcss": "^3.x",
  "class-variance-authority": "^0.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

### 7.2 Component Mapping

| Feature | Component |
|---------|-----------|
| Navigation | Custom header with shadcn `Button`, `DropdownMenu` |
| Fund Stats chart | `recharts` LineChart |
| Fund Stats table | HTML table (simple, metrics × quarters) |
| Portfolio tables | `@tanstack/react-table` with shadcn `Table` |
| Updates list | Custom list with shadcn `Card` |
| Updates editor | `textarea` + `react-markdown` preview |
| Admin tables | `@tanstack/react-table` with inline editing |
| Forms | shadcn `Input`, `Select`, `Button` |

### 7.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Next.js App                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  LP Portal  │  │ Admin Portal│  │   Server    │  │    │
│  │  │   (React)   │  │   (React)   │  │   Actions   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  PostgreSQL │  │    Auth     │                           │
│  │  + RLS      │  │ (Magic Link)│                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Server-side only, for admin operations
```

### 7.5 Route Structure

```
/                    → Redirect to /login
/login               → Email + password form
/auth/callback       → Magic link redirect handler

/portal              → Home (welcome + 3 nav links)
/portal/stats        → Fund Stats (chart + metrics table)
/portal/portfolio    → Portfolio (companies/investments tabs)
/portal/updates      → Updates list
/portal/updates/[id] → Single update view

/admin               → Dashboard
/admin/metrics       → Fund metrics spreadsheet
/admin/lps           → LP access table
/admin/companies     → Companies table
/admin/investments   → Investments table
/admin/updates       → Updates list
/admin/updates/new   → Create new update
/admin/updates/[id]  → Edit existing update
```

---

## 8. Design Guidelines

### 8.1 Layout Principles
- **Top navigation only** - no sidebar, saves horizontal space
- **Three pages** - Fund Stats, Portfolio, Updates (plus Home)
- **Tables over cards** - dense, sortable, professional
- **No decorative elements** - content only

### 8.2 Navigation Header
```
┌─────────────────────────────────────────────────────────────────┐
│ ScOp    Fund Stats   Portfolio   Updates         [Fund▾] [User▾] │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Color Scheme
- White background (#FFFFFF), black text (#000000)
- No accent colors - use underlines for links

### 8.4 Typography
- Font: Inter (shadcn/ui default)
- Page title: 24px semibold
- Section headers: 18px medium
- Body/tables: 14px regular
- Labels: 12px regular

### 8.5 Spacing
- Page margins: 24px
- Section gaps: 16px
- Generous whitespace throughout

### 8.6 What NOT to Do
- No gradients, shadows, or flourishes
- No colored status badges (use text)
- No icons unless essential
- No animations
- No hero images
- No cards when lists work

### 8.7 Loading & Error States
- **Loading:** Simple "Loading..." text, no spinners
- **Empty states:** "No updates yet" / "No companies found" - simple text
- **Errors:** Red text below form fields for validation; toast for save errors
- **Success:** Brief "Saved" confirmation that fades after 2 seconds

---

## 9. Implementation Order of Operations

### Phase 1: Foundation

**1.1 Infrastructure**
1. Create Supabase project
2. In Supabase dashboard: enable Email auth, configure Site URL to `https://lp.scopvc.com`
3. Create Next.js 14 project (App Router)
4. Install: `@supabase/supabase-js`, `@supabase/ssr`
5. Set up environment variables
6. Deploy to Vercel
7. Configure lp.scopvc.com domain
8. Add domain to Supabase Auth allowed redirect URLs

**1.2 Database Schema**
```sql
-- Create tables in order:
-- 1. Funds
-- 2. AllowedLPs
-- 3. LPFundAccess (junction: AllowedLPs ↔ Funds)
-- 4. Users (depends on AllowedLPs)
-- 5. FundMetrics (depends on Funds)
-- 6. Companies
-- 7. CompanyFunds (junction: Companies ↔ Funds)
-- 8. Investments (depends on Companies, Funds)
-- 9. Updates
-- 10. UpdateFundVisibility (junction: Updates ↔ Funds)

-- Enable RLS on all tables:
ALTER TABLE allowed_lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_fund_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_fund_visibility ENABLE ROW LEVEL SECURITY;
```

**1.3 Seed Data**
Use Supabase dashboard or service role key (bypasses RLS):
1. Create Fund records:
   - Fund I: `name: "ScOp Fund I", slug: "fund_i", status: "active"`
   - Fund II: `name: "ScOp Fund II", slug: "fund_ii", status: "active"`
2. Add admin emails to AllowedLPs
3. Add rows to LPFundAccess linking admin's allowed_lp_id to both fund_ids
4. Admins log in via magic link, set password
5. Using service role key, update their User record: `role: admin`

**1.4 Design System**
1. Configure Tailwind
2. Set up shadcn/ui
3. Create base layout components

---

### Phase 2: Auth

**2.1 Supabase Config**
1. Enable email auth in Supabase
2. Configure magic link settings
3. Set redirect URLs

**2.2 Auth Flow**
1. `/login` page - email input for first-time, email+password for returning
2. Server action: check AllowedLPs, trigger magic link if found
3. `/auth/callback` - handle redirect, prompt password setup, create User record
4. Password login for returning users
5. Logout

**2.3 Middleware**
1. Protect `/portal/*` and `/admin/*`
2. Role check for admin routes

**2.4 Test**
1. Add test LP to AllowedLPs
2. Test full flow end-to-end

---

### Phase 3: Admin Portal

**3.1 Layout**
1. `/admin` layout with nav (Dashboard, Metrics, LPs, Companies, Investments, Updates)
2. Dashboard with quick stats

**3.2 LPs Table** (`/admin/lps`)
1. Table with inline editing
2. Add/delete rows

**3.3 Fund Metrics** (`/admin/metrics`)
1. Fund selector tabs
2. Spreadsheet: metrics as rows, quarters as columns
3. Add quarter functionality
4. Inline cell editing

**3.4 Companies Table** (`/admin/companies`)
1. Table with inline editing
2. Add/delete rows

**3.5 Investments Table** (`/admin/investments`)
1. Table with inline editing
2. Company dropdown
3. Add/delete rows

**3.6 Updates** (`/admin/updates`)
1. Update list view
2. Markdown editor
3. Draft/Publish toggle

---

### Phase 4: LP Portal

**4.1 Layout**
1. `/portal` layout with top nav
2. Fund switcher (if LP has both funds)

**4.2 Home** (`/portal`)
1. Welcome message
2. Three navigation links: Fund Stats, Portfolio, Updates

**4.3 Fund Stats** (`/portal/stats`)
1. Line chart with metric selector
2. Full metrics table (metrics as rows, quarters as columns)

**4.4 Portfolio** (`/portal/portfolio`)
1. Companies tab
2. Investments tab
3. Tab switching, sortable columns

**4.5 Updates** (`/portal/updates`)
1. Update list (title + date)
2. Single update view

---

### Phase 5: RLS & Launch

**5.1 Row Level Security**

```sql
-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: Check if user can access a fund (via LPFundAccess junction)
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

-- AllowedLPs: admin only
CREATE POLICY "Admin full access" ON allowed_lps FOR ALL USING (is_admin());

-- LPFundAccess: LPs can read their own access, admin full access
CREATE POLICY "LPs read own access" ON lp_fund_access FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.allowed_lp_id = lp_fund_access.allowed_lp_id
    )
  );
CREATE POLICY "Admin full access" ON lp_fund_access FOR ALL USING (is_admin());

-- Users: own record or admin, with role protection
CREATE POLICY "Read own or admin" ON users FOR SELECT 
  USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users create own record" ON users FOR INSERT
  WITH CHECK (id = auth.uid() AND role = 'lp');
CREATE POLICY "Users update own record" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (role = 'lp');
CREATE POLICY "Admin full access" ON users FOR ALL USING (is_admin());

-- Funds: all authenticated can read
CREATE POLICY "Authenticated read" ON funds FOR SELECT 
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write" ON funds FOR ALL USING (is_admin());

-- FundMetrics: by fund access
CREATE POLICY "Read by fund access" ON fund_metrics FOR SELECT 
  USING (can_access_fund(fund_id));
CREATE POLICY "Admin write" ON fund_metrics FOR ALL USING (is_admin());

-- Companies: via CompanyFunds junction
CREATE POLICY "Read by fund access" ON companies FOR SELECT 
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM company_funds cf 
      WHERE cf.company_id = companies.id 
      AND can_access_fund(cf.fund_id)
    )
  );
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

-- Updates: published + fund visibility via junction table
CREATE POLICY "Read published by fund" ON updates FOR SELECT 
  USING (
    is_admin() OR
    (status = 'published' AND EXISTS (
      SELECT 1 FROM update_fund_visibility ufv
      WHERE ufv.update_id = updates.id
      AND can_access_fund(ufv.fund_id)
    ))
  );
CREATE POLICY "Admin write" ON updates FOR ALL USING (is_admin());
```

**5.2 Final Testing**
1. Test as LP (both funds, single fund)
2. Test as admin
3. Test unauthorized access

**5.3 Launch**
1. Import LP emails
2. Enter fund metrics
3. Add companies/investments
4. Go live

---

### Time Estimates

| Phase | Time |
|-------|------|
| Foundation | 2 hrs |
| Auth | 3 hrs |
| Admin Portal | 5 hrs |
| LP Portal | 4 hrs |
| RLS & Launch | 2 hrs |
| **Total** | **16 hrs** |

---

### v2 - Future Enhancements
- Multiple emails per LP (normalize AllowedLPs → LPs + LPEmails)
- Job postings section
- LP analytics (who viewed what)
- Bulk LP import via CSV
- Email notifications for new content
- Document/PDF attachments

---

## 10. Security Considerations

- All data transmission over HTTPS
- Passwords handled by Supabase Auth (bcrypt)
- Magic links handled by Supabase (single-use, time-limited)
- Row Level Security (RLS) enforces data access at database level
- SQL injection prevention via Supabase client parameterized queries
- XSS prevention via React's default escaping
- Input validation on all forms
- Regular dependency updates

---

## 11. Confirmed Decisions

- **Domain:** lp.scopvc.com
- **Supabase:** New project
- **Data seeding:** Historical metrics entered manually at launch

## 12. Open Questions

1. **Launch timeline:** Target date for MVP?
2. **Admin accounts:** Which email addresses need admin access?

---

## 13. Success Criteria

- LPs can securely log in and view their fund information
- Admins can efficiently manage LPs, metrics, and content
- Professional, clean design
- Page load times under 2 seconds

---

*End of Specification*