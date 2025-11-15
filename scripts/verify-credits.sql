-- 在 Supabase SQL Editor 中运行此查询来验证用户积分

-- 1. 查看用户积分
SELECT 
  id,
  email,
  credits_balance,
  credits_total,
  credits_spent,
  updated_at
FROM users
WHERE email = 'fujashihao@gmail.com';

-- 2. 查看积分交易记录
SELECT 
  id,
  user_id,
  amount,
  transaction_type,
  reason,
  metadata,
  created_at
FROM credit_transactions
WHERE user_id = (SELECT id FROM users WHERE email = 'fujashihao@gmail.com')
ORDER BY created_at DESC
LIMIT 10;

