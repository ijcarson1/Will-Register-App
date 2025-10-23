-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  firm_id TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  type TEXT NOT NULL CHECK (type IN ('allocation', 'usage', 'refund', 'adjustment')),
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  
  -- Context
  search_id TEXT,
  search_type TEXT CHECK (search_type IN ('basic', 'advanced')),
  reason TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_firm_id ON credit_transactions(firm_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_search_id ON credit_transactions(search_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
