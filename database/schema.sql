-- Sora2 Database Schema
-- Execute this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_end_date TIMESTAMP,
  credits_used INTEGER DEFAULT 0,
  credits_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  video_limit INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  creem_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video generation jobs table
CREATE TABLE video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  prompt TEXT,
  image_url TEXT,
  aspect_ratio VARCHAR(10),
  quality VARCHAR(20),
  duration INTEGER DEFAULT 10,
  result_url TEXT,
  preview_url TEXT,
  error_message TEXT,
  cost_credits INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  creem_payment_id VARCHAR(255),
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage statistics table
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  videos_generated INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, video_limit, features) VALUES
('basic', 4900, 48000, 100, '{"hd_quality": true, "text_to_video": true, "email_support": true}'),
('creator', 12900, 120000, 300, '{"hd_quality": true, "text_to_video": true, "image_to_video": true, "style_control": true, "priority_support": true}'),
('pro', 39900, 360000, 1000, '{"hd_quality": true, "4k_quality": true, "text_to_video": true, "image_to_video": true, "advanced_style": true, "api_access": true, "team_collaboration": true}');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX idx_video_jobs_status ON video_jobs(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_usage_stats_user_date ON usage_stats(user_id, date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own video jobs" ON video_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own video jobs" ON video_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage stats" ON usage_stats FOR SELECT USING (auth.uid() = user_id);

-- Public access to subscription plans
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);
