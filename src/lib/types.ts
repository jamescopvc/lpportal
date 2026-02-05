export type UserRole = "admin" | "lp";
export type FundStatus = "active" | "closed";
export type CompanyStatus = "active" | "exited" | "written_off";
export type InvestmentType = "safe" | "equity";
export type InvestmentStage = "initial" | "follow_on";
export type InvestmentRole = "lead" | "co_lead" | "follow";
export type UpdateStatus = "draft" | "published";

export interface Fund {
  id: string;
  name: string;
  slug: string;
  start_date: string | null;
  status: FundStatus;
}

export interface AllowedLP {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  created_at: string;
  updated_at: string;
}

export interface LPFundAccess {
  allowed_lp_id: string;
  fund_id: string;
}

export interface User {
  id: string;
  email: string;
  allowed_lp_id: string | null;
  role: UserRole;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundMetrics {
  id: string;
  fund_id: string;
  quarter: number;
  year: number;
  as_of_date: string | null;
  tvpi: number | null;
  dpi: number | null;
  moic: number | null;
  irr: number | null;
  fund_size: number | null;
  capital_called: number | null;
  invested_capital: number | null;
  capital_distributed: number | null;
  dry_powder: number | null;
  num_investments: number | null;
  primary_investments: number | null;
  follow_on_investments: number | null;
  median_initial_check: number | null;
  median_initial_valuation: number | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string | null;
  location: string | null;
  status: CompanyStatus;
  ownership_percentage: number | null;
  total_invested: number | null;
  first_investment_date: string | null;
  website_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFund {
  company_id: string;
  fund_id: string;
}

export interface Investment {
  id: string;
  company_id: string;
  fund_id: string;
  investment_date: string | null;
  investment_type: InvestmentType | null;
  stage: InvestmentStage | null;
  amount: number | null;
  ownership_percentage: number | null;
  role: InvestmentRole | null;
  post_money_valuation: number | null;
  created_at: string;
  updated_at: string;
}

export interface Update {
  id: string;
  title: string;
  body: string | null;
  status: UpdateStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateFundVisibility {
  update_id: string;
  fund_id: string;
}
