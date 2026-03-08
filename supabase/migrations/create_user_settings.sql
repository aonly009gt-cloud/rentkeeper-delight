-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  dorm_name TEXT DEFAULT 'หอพักของฉัน',
  default_rent INTEGER DEFAULT 3000,
  electricity_rate INTEGER DEFAULT 8,
  default_water_cost INTEGER DEFAULT 100,
  bank_name TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  account_name TEXT DEFAULT '',
  qr_code_url TEXT DEFAULT '',
  billing_day INTEGER DEFAULT 1,
  payment_deadline_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (true);
