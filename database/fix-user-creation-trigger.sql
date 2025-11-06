-- ============================================================
-- 修复 Google 登录时 "Database error saving new user" 问题
-- ============================================================
-- 问题：RLS 策略缺少 INSERT 权限，导致触发器无法创建用户记录
-- 解决方案：添加允许系统插入新用户的策略
-- ============================================================

-- 1. 确保触发器函数存在且正确
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- 创建 users 表记录
  INSERT INTO users (id, email, full_name, credits_balance, credits_total, credits_spent, credits_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    3,  -- 免费用户初始 3 个积分
    3,  -- credits_total
    0,  -- credits_spent (新用户消费为 0)
    50  -- 默认积分上限
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
    updated_at = NOW();
  
  -- 创建 user_subscriptions 记录
  INSERT INTO user_subscriptions (user_id, plan_type, plan_status, credits, total_credits)
  VALUES (
    NEW.id,
    'free',
    'active',
    3,
    3
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. 添加允许系统插入新用户的 RLS 策略
-- 注意：SECURITY DEFINER 函数会以函数所有者的权限运行，但 RLS 仍然会检查策略
-- 我们需要添加一个策略允许触发器函数插入

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "System can insert new users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

-- 创建新策略：允许系统/触发器插入新用户
-- 这个策略允许插入 id 匹配 auth.uid() 的记录（即新创建的用户）
CREATE POLICY "Allow trigger to insert users" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. 同样为 user_subscriptions 添加 INSERT 策略（如果还没有）
DROP POLICY IF EXISTS "Allow trigger to insert subscriptions" ON user_subscriptions;
CREATE POLICY "Allow trigger to insert subscriptions" ON user_subscriptions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. 验证：检查策略是否正确创建
-- SELECT * FROM pg_policies WHERE tablename = 'users';
-- SELECT * FROM pg_policies WHERE tablename = 'user_subscriptions';

