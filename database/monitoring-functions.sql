-- 监控查询函数
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 检查单个用户积分一致性
CREATE OR REPLACE FUNCTION check_credit_consistency(p_user_id UUID)
RETURNS TABLE(
  user_balance INTEGER,
  calculated_balance INTEGER,
  transaction_count INTEGER,
  is_consistent BOOLEAN
) AS $$
DECLARE
  user_credits INTEGER;
  calculated_credits INTEGER;
  tx_count INTEGER;
BEGIN
  -- 获取用户表中的积分
  SELECT credits_balance INTO user_credits FROM users WHERE id = p_user_id;
  
  -- 计算实际积分（所有交易的总和）
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN transaction_type = 'credit' THEN amount
        WHEN transaction_type = 'debit' THEN -amount
        ELSE 0
      END
    ), 0),
    COUNT(*)
  INTO calculated_credits, tx_count
  FROM credit_transactions 
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    user_credits,
    calculated_credits,
    tx_count,
    (user_credits = calculated_credits) as is_consistent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 查找所有积分不一致的用户
CREATE OR REPLACE FUNCTION find_credit_inconsistencies()
RETURNS TABLE(
  user_id UUID,
  user_email VARCHAR,
  user_balance INTEGER,
  calculated_balance INTEGER,
  difference INTEGER,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email as user_email,
    COALESCE(u.credits_balance, 0) as user_balance,
    COALESCE(calculated.calculated_balance, 0) as calculated_balance,
    (COALESCE(u.credits_balance, 0) - COALESCE(calculated.calculated_balance, 0)) as difference,
    COALESCE(calculated.tx_count, 0) as transaction_count
  FROM users u
  LEFT JOIN (
    SELECT 
      ct.user_id,
      SUM(
        CASE 
          WHEN ct.transaction_type = 'credit' THEN ct.amount
          WHEN ct.transaction_type = 'debit' THEN -ct.amount
          ELSE 0
        END
      ) as calculated_balance,
      COUNT(*) as tx_count
    FROM credit_transactions ct
    GROUP BY ct.user_id
  ) calculated ON u.id = calculated.user_id
  WHERE COALESCE(u.credits_balance, 0) != COALESCE(calculated.calculated_balance, 0)
  ORDER BY ABS(COALESCE(u.credits_balance, 0) - COALESCE(calculated.calculated_balance, 0)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 获取最近的webhook失败记录
CREATE OR REPLACE FUNCTION get_recent_webhook_failures(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  id UUID,
  payment_id VARCHAR,
  customer_id VARCHAR,
  plan_id VARCHAR,
  error_message TEXT,
  retry_count INTEGER,
  status VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wf.id,
    wf.payment_id,
    wf.customer_id,
    wf.plan_id,
    wf.error_message,
    wf.retry_count,
    wf.status,
    wf.created_at
  FROM webhook_failures wf
  WHERE wf.created_at >= NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY wf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 获取待匹配的积分
CREATE OR REPLACE FUNCTION get_pending_user_credits(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  id UUID,
  customer_id VARCHAR,
  customer_email VARCHAR,
  payment_id VARCHAR,
  plan_id VARCHAR,
  credit_amount INTEGER,
  status VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    puc.id,
    puc.customer_id,
    puc.customer_email,
    puc.payment_id,
    puc.plan_id,
    puc.credit_amount,
    puc.status,
    puc.created_at
  FROM pending_user_credits puc
  WHERE puc.created_at >= NOW() - INTERVAL '1 hour' * p_hours
  ORDER BY puc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 获取系统健康状态汇总
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE(
  metric_name VARCHAR,
  metric_value INTEGER,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'webhook_failures_24h'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Webhook failures in last 24 hours'::TEXT as description
  FROM webhook_failures 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'pending_user_credits_24h'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Pending user credits in last 24 hours'::TEXT as description
  FROM pending_user_credits 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'failed_generations_24h'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Failed generations in last 24 hours'::TEXT as description
  FROM failed_generations 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'credit_inconsistencies'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Users with credit inconsistencies'::TEXT as description
  FROM find_credit_inconsistencies()
  
  UNION ALL
  
  SELECT 
    'total_users'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Total registered users'::TEXT as description
  FROM users
  
  UNION ALL
  
  SELECT 
    'total_credit_transactions'::VARCHAR as metric_name,
    COUNT(*)::INTEGER as metric_value,
    'Total credit transactions'::TEXT as description
  FROM credit_transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 获取用户积分统计
CREATE OR REPLACE FUNCTION get_user_credit_stats()
RETURNS TABLE(
  user_id UUID,
  email VARCHAR,
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER,
  last_transaction_at TIMESTAMP,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    COALESCE(u.credits_balance, 0) as credits_balance,
    COALESCE(u.credits_total, 0) as credits_total,
    COALESCE(u.credits_spent, 0) as credits_spent,
    MAX(ct.created_at) as last_transaction_at,
    COUNT(ct.id) as transaction_count
  FROM users u
  LEFT JOIN credit_transactions ct ON u.id = ct.user_id
  GROUP BY u.id, u.email, u.credits_balance, u.credits_total, u.credits_spent
  ORDER BY u.credits_balance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 验证函数创建成功
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'check_credit_consistency',
    'find_credit_inconsistencies',
    'get_recent_webhook_failures',
    'get_pending_user_credits',
    'get_system_health_summary',
    'get_user_credit_stats'
  )
ORDER BY routine_name;
