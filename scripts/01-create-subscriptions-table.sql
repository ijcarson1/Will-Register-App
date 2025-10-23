-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  firm_id TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'individual')),
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled', 'past_due')),
  
  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  credits_per_month INTEGER NOT NULL,
  
  -- Dates
  trial_start_date TIMESTAMP,
  trial_end_date TIMESTAMP,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  
  -- Usage
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

-- Create index for firm lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_firm_id ON subscriptions(firm_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
