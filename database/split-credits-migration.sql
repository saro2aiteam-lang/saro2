-- Split subscription vs flexible credits and update transactional RPCs

-- 1) Add split columns and trigger to maintain credits_balance
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_credits_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flex_credits_balance INTEGER NOT NULL DEFAULT 0;

-- Backfill: treat existing credits_balance as flexible credits once
UPDATE users
SET flex_credits_balance = COALESCE(flex_credits_balance, 0) + COALESCE(credits_balance, 0)
WHERE (flex_credits_balance IS NULL OR flex_credits_balance = 0)
  AND COALESCE(credits_balance, 0) > 0;

-- Trigger: credits_balance = subscription + flex
CREATE OR REPLACE FUNCTION maintain_credits_balance()
RETURNS trigger AS $$
BEGIN
  NEW.credits_balance := GREATEST(0, COALESCE(NEW.subscription_credits_balance,0) + COALESCE(NEW.flex_credits_balance,0));
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_maintain_balance ON users;
CREATE TRIGGER trg_users_maintain_balance
BEFORE INSERT OR UPDATE OF subscription_credits_balance, flex_credits_balance ON users
FOR EACH ROW EXECUTE FUNCTION maintain_credits_balance();


-- Drop old function signatures to allow return type changes
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'debit_user_credits_transaction',
        'credit_user_credits_transaction',
        'debit_user_credits',
        'credit_user_credits'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s);', r.nspname, r.proname, r.args);
  END LOOP;
END $$;


-- 2) Transactional RPCs with split logic
DO $$ BEGIN
  CREATE TYPE credit_bucket AS ENUM ('subscription','flex');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Credit RPC: allow specifying bucket (default flex)
CREATE OR REPLACE FUNCTION credit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_bucket credit_bucket DEFAULT 'flex'
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER,
  subscription_credits_balance INTEGER,
  flex_credits_balance INTEGER
) AS $$
DECLARE
  max_allowed INTEGER := 100000;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF p_amount > max_allowed THEN RAISE EXCEPTION 'Amount too large'; END IF;

  UPDATE users SET
    subscription_credits_balance = subscription_credits_balance + CASE WHEN p_bucket='subscription' THEN p_amount ELSE 0 END,
    flex_credits_balance = flex_credits_balance + CASE WHEN p_bucket='flex' THEN p_amount ELSE 0 END,
    credits_total = COALESCE(credits_total,0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions(user_id, amount, transaction_type, reason, metadata)
  VALUES(p_user_id, p_amount, 'credit', p_reason, COALESCE(p_metadata,'{}'::jsonb) || jsonb_build_object('bucket', p_bucket));

  RETURN QUERY
  SELECT u.credits_balance, u.credits_total, u.credits_spent, u.subscription_credits_balance, u.flex_credits_balance
  FROM users u WHERE u.id = p_user_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Debit RPC: consume subscription first, then flex
CREATE OR REPLACE FUNCTION debit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER,
  subscription_credits_balance INTEGER,
  flex_credits_balance INTEGER
) AS $$
DECLARE
  need INTEGER := p_amount;
  from_sub INTEGER := 0;
  from_flex INTEGER := 0;
  s INTEGER;
  f INTEGER;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT subscription_credits_balance, flex_credits_balance INTO s, f FROM users WHERE id = p_user_id FOR UPDATE;
  IF s IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF COALESCE(s,0) + COALESCE(f,0) < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0008';
  END IF;

  from_sub := LEAST(need, GREATEST(s,0));
  need := need - from_sub;
  from_flex := LEAST(need, GREATEST(f,0));
  need := need - from_flex; -- should be 0

  UPDATE users SET
    subscription_credits_balance = subscription_credits_balance - from_sub,
    flex_credits_balance = flex_credits_balance - from_flex,
    credits_spent = COALESCE(credits_spent,0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions(user_id, amount, transaction_type, reason, metadata)
  VALUES(
    p_user_id,
    p_amount,
    'debit',
    p_reason,
    COALESCE(p_metadata,'{}'::jsonb) || jsonb_build_object('split', jsonb_build_object('subscription', from_sub, 'flex', from_flex))
  );

  RETURN QUERY
  SELECT u.credits_balance, u.credits_total, u.credits_spent, u.subscription_credits_balance, u.flex_credits_balance
  FROM users u WHERE u.id = p_user_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3) Periodic reset for subscription bucket only
CREATE OR REPLACE FUNCTION reset_subscription_credits_for_period(
  p_user_id UUID,
  p_period_credits INTEGER,
  p_reason TEXT DEFAULT 'subscription_period_reset',
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  subscription_credits_balance INTEGER,
  flex_credits_balance INTEGER
) AS $$
BEGIN
  IF p_period_credits < 0 THEN RAISE EXCEPTION 'period credits negative'; END IF;

  UPDATE users SET
    subscription_credits_balance = p_period_credits,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions(user_id, amount, transaction_type, reason, metadata)
  VALUES(p_user_id, 0, 'admin_action', p_reason, COALESCE(p_metadata,'{}'::jsonb) || jsonb_build_object('period_credits', p_period_credits));

  RETURN QUERY SELECT credits_balance, subscription_credits_balance, flex_credits_balance FROM users WHERE id = p_user_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

