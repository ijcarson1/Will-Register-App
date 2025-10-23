-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  firm_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  type TEXT NOT NULL CHECK (type IN ('subscription', 'pay-as-you-go', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'invoice', 'bank_transfer')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Context
  subscription_id TEXT,
  search_id TEXT,
  description TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_firm_id ON payment_transactions(firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
