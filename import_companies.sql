-- Import companies from CSV
-- First, insert companies
-- Then, link them to funds via company_funds junction table

-- Insert all companies
INSERT INTO companies (name, website_url, description, location, first_investment_date, ownership_percentage, total_invested)
VALUES
  ('Designalytics', 'https://www.designalytics.com/', 'Packaging design testing using customer panels', 'San Diego, CA', '2020-12-27', 9.8, 750000),
  ('Cloverleaf', 'https://cloverleaf.me/', 'Personality tests and feedback for teams', 'Cincinnati, OH', '2021-01-19', 6.2, 1860000),
  ('CLIQ', 'https://www.cliqproducts.com/', 'Compact and foldable chairs sold DTC', 'Santa Barbara, CA', '2021-03-22', 4.1, 630000),
  ('FreightPOP', 'https://www.freightpop.com/', 'Logistics abstraction layer for multi-carrier operations', 'Irvine, CA', '2021-05-11', 4.9, 1400000),
  ('Tovuti', 'https://www.tovutilms.com/', 'Learning management system', 'Boise, ID', '2021-06-28', 9.0, 3890000),
  ('Snag', 'https://snagdelivery.app/', 'Online convenience store delivery for college campuses', 'Bowling Green, OH', '2021-09-01', 26.8, 3400000),
  ('Guava', 'https://guavahealth.com/', 'Centralized tracking for all medical records and biometric data', 'Santa Barbara, CA', '2021-10-01', 7.5, 750000),
  ('HeyTutor', 'https://heytutor.com/', 'Supplementary tutoring for public school students', 'Los Angeles, CA', '2021-10-22', 13.8, 2700000),
  ('Voyager', 'https://www.voyagerportal.com/', 'Workflow management for bulk marine operations', 'Houston, TX', '2021-11-03', 8.9, 3000000),
  ('FLIP', 'https://flipcx.com/', 'Automated customer support using synthetic voice', 'New York, NY', '2021-11-16', 10.2, 3800000),
  ('Yogi', 'https://www.meetyogi.com/', 'CPG reviews and ratings at scale using AI', 'New York, NY', '2021-12-02', 10.0, 2900000),
  ('Pearly', 'https://www.pearly.co/', 'Dental revenue automation software', 'Santa Barbara, CA', '2022-01-25', 7.9, 2750000),
  ('Aavenir', 'https://aavenir.com/', 'Sourcing, Contract Management, and AP Automation workflows', 'McKinney, TX', '2022-02-03', 5.7, 2000000),
  ('Unwrap.ai', 'https://www.unwrap.ai/', 'Customer feedback at scale with AI', 'Santa Barbara, CA', '2022-03-22', 8.3, 1540000),
  ('BuyerCaddy', 'https://buyercaddy.com/', 'Intelligence platform for tech stack benchmarking', 'Santa Barbara, CA', '2022-05-23', 2.5, 550000),
  ('Userpilot', 'https://userpilot.com/', 'Onboarding and engagement tool for SaaS products', 'Distributed', '2022-07-29', 7.2, 1750000),
  ('Lionize', 'https://lionize.ai/', 'Managed marketplace for influencer marketing', 'New York, NY', '2022-08-12', 9.2, 1160000),
  ('Rogo', 'https://rogodata.com/', 'AI assistant for financial analysts and consultants', 'New York, NY', '2022-09-19', 2.7, 750000),
  ('Customers.ai', 'https://customers.ai/', 'Web traffic analytics and intelligence', 'Boston, MA', '2022-10-12', 9.9, 3000000),
  ('FoodReady', 'https://foodready.ai/', 'Food safety compliance software', 'Chicago, IL', '2023-08-25', 12.0, 2400000),
  ('HealthArc', 'https://www.healtharc.io/', 'Portal for remote patient monitoring', 'Montvale, NJ', '2023-11-02', 11.3, 3500000),
  ('ChipAgents', NULL, NULL, NULL, '2024-07-23', 8.6, 2460000),
  ('PromptLayer', NULL, NULL, NULL, '2024-10-31', 10.0, 2000000),
  ('SuiteOp', NULL, NULL, NULL, '2024-12-23', 15.0, 2000000),
  ('SmartBarrel', NULL, NULL, NULL, '2025-04-16', 9.7, 3000000),
  ('Pangram', NULL, NULL, NULL, '2025-04-16', 13.8, 2000000),
  ('Lifeguard', NULL, NULL, NULL, '2025-05-21', 14.1, 1000000),
  ('Fewshot', NULL, NULL, NULL, '2025-10-03', NULL, 1000000),
  ('Spacture', NULL, NULL, NULL, '2025-12-11', 8.0, 2000000),
  ('Artiphishell', NULL, NULL, NULL, '2026-02-04', 10.0, 900000);

-- Link companies to Fund 1 (first 21 companies)
INSERT INTO company_funds (company_id, fund_id)
SELECT
  c.id,
  (SELECT id FROM funds WHERE slug = 'fund_i')
FROM companies c
WHERE c.name IN (
  'Designalytics', 'Cloverleaf', 'CLIQ', 'FreightPOP', 'Tovuti', 'Snag', 'Guava',
  'HeyTutor', 'Voyager', 'FLIP', 'Yogi', 'Pearly', 'Aavenir', 'Unwrap.ai',
  'BuyerCaddy', 'Userpilot', 'Lionize', 'Rogo', 'Customers.ai', 'FoodReady', 'HealthArc'
)
ON CONFLICT (company_id, fund_id) DO NOTHING;

-- Link companies to Fund 2 (last 9 companies)
INSERT INTO company_funds (company_id, fund_id)
SELECT
  c.id,
  (SELECT id FROM funds WHERE slug = 'fund_ii')
FROM companies c
WHERE c.name IN (
  'ChipAgents', 'PromptLayer', 'SuiteOp', 'SmartBarrel', 'Pangram',
  'Lifeguard', 'Fewshot', 'Spacture', 'Artiphishell'
)
ON CONFLICT (company_id, fund_id) DO NOTHING;

-- Verify the import
SELECT
  c.name,
  f.name as fund,
  c.first_investment_date,
  c.ownership_percentage,
  c.total_invested
FROM companies c
JOIN company_funds cf ON c.id = cf.company_id
JOIN funds f ON cf.fund_id = f.id
ORDER BY c.first_investment_date;
