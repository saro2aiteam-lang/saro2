-- 日常健康检查脚本
-- 可在 Supabase Dashboard > SQL Editor 中执行，或设置为定时任务

-- 1. 生成健康检查报告
CREATE OR REPLACE FUNCTION generate_health_check_report()
RETURNS TABLE(
  check_name VARCHAR,
  status VARCHAR,
  details TEXT,
  severity VARCHAR
) AS $$
BEGIN
  -- 检查积分不一致
  RETURN QUERY
  SELECT 
    'Credit Consistency Check'::VARCHAR as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'All user credits are consistent'::TEXT
      ELSE CONCAT('Found ', COUNT(*), ' users with credit inconsistencies')::TEXT
    END as details,
    CASE 
      WHEN COUNT(*) = 0 THEN 'INFO'::VARCHAR
      WHEN COUNT(*) <= 5 THEN 'WARNING'::VARCHAR
      ELSE 'CRITICAL'::VARCHAR
    END as severity
  FROM find_credit_inconsistencies()
  
  UNION ALL
  
  -- 检查webhook失败
  SELECT 
    'Webhook Failures Check'::VARCHAR as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::VARCHAR
      WHEN COUNT(*) <= 3 THEN 'WARNING'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'No webhook failures in last 24h'::TEXT
      ELSE CONCAT('Found ', COUNT(*), ' webhook failures in last 24h')::TEXT
    END as details,
    CASE 
      WHEN COUNT(*) = 0 THEN 'INFO'::VARCHAR
      WHEN COUNT(*) <= 3 THEN 'WARNING'::VARCHAR
      ELSE 'CRITICAL'::VARCHAR
    END as severity
  FROM webhook_failures 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  -- 检查待匹配积分
  SELECT 
    'Pending User Credits Check'::VARCHAR as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::VARCHAR
      WHEN COUNT(*) <= 2 THEN 'WARNING'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'No pending user credits in last 24h'::TEXT
      ELSE CONCAT('Found ', COUNT(*), ' pending user credits in last 24h')::TEXT
    END as details,
    CASE 
      WHEN COUNT(*) = 0 THEN 'INFO'::VARCHAR
      WHEN COUNT(*) <= 2 THEN 'WARNING'::VARCHAR
      ELSE 'CRITICAL'::VARCHAR
    END as severity
  FROM pending_user_credits 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  -- 检查失败生成任务
  SELECT 
    'Failed Generations Check'::VARCHAR as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::VARCHAR
      WHEN COUNT(*) <= 5 THEN 'WARNING'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END as status,
    CASE 
      WHEN COUNT(*) = 0 THEN 'No failed generations in last 24h'::TEXT
      ELSE CONCAT('Found ', COUNT(*), ' failed generations in last 24h')::TEXT
    END as details,
    CASE 
      WHEN COUNT(*) = 0 THEN 'INFO'::VARCHAR
      WHEN COUNT(*) <= 5 THEN 'WARNING'::VARCHAR
      ELSE 'CRITICAL'::VARCHAR
    END as severity
  FROM failed_generations 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  -- 检查数据库连接
  SELECT 
    'Database Connection Check'::VARCHAR as check_name,
    'PASS'::VARCHAR as status,
    'Database connection is healthy'::TEXT as details,
    'INFO'::VARCHAR as severity
  
  UNION ALL
  
  -- 检查关键表是否存在
  SELECT 
    'Critical Tables Check'::VARCHAR as check_name,
    CASE 
      WHEN COUNT(*) = 4 THEN 'PASS'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END as status,
    CASE 
      WHEN COUNT(*) = 4 THEN 'All critical tables exist'::TEXT
      ELSE CONCAT('Missing tables: ', 4 - COUNT(*), ' tables not found')::TEXT
    END as details,
    CASE 
      WHEN COUNT(*) = 4 THEN 'INFO'::VARCHAR
      ELSE 'CRITICAL'::VARCHAR
    END as severity
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('users', 'credit_transactions', 'webhook_failures', 'pending_user_credits');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 获取需要立即关注的问题
CREATE OR REPLACE FUNCTION get_critical_issues()
RETURNS TABLE(
  issue_type VARCHAR,
  issue_count INTEGER,
  description TEXT,
  action_required TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- 积分不一致问题
  SELECT 
    'Credit Inconsistencies'::VARCHAR as issue_type,
    COUNT(*)::INTEGER as issue_count,
    'Users with mismatched credit balances'::TEXT as description,
    'Run manual credit reconciliation'::TEXT as action_required
  FROM find_credit_inconsistencies()
  WHERE ABS(difference) > 0
  
  UNION ALL
  
  -- 长时间未处理的webhook失败
  SELECT 
    'Stale Webhook Failures'::VARCHAR as issue_type,
    COUNT(*)::INTEGER as issue_count,
    'Webhook failures older than 1 hour'::TEXT as description,
    'Review and manually process failed webhooks'::TEXT as action_required
  FROM webhook_failures 
  WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '1 hour'
  
  UNION ALL
  
  -- 长时间未匹配的积分
  SELECT 
    'Stale Pending Credits'::VARCHAR as issue_type,
    COUNT(*)::INTEGER as issue_count,
    'Pending credits older than 1 hour'::TEXT as description,
    'Manually match users to pending credits'::TEXT as action_required
  FROM pending_user_credits 
  WHERE status = 'pending_match' 
    AND created_at < NOW() - INTERVAL '1 hour'
  
  UNION ALL
  
  -- 需要退款的失败生成
  SELECT 
    'Failed Generations Needing Refund'::VARCHAR as issue_type,
    COUNT(*)::INTEGER as issue_count,
    'Failed generations that need credit refund'::TEXT as description,
    'Process refunds for failed generations'::TEXT as action_required
  FROM failed_generations 
  WHERE status = 'pending' 
    AND credits_deducted > 0
    AND created_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 清理旧数据（可选，谨慎使用）
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  table_name VARCHAR,
  deleted_count INTEGER
) AS $$
DECLARE
  webhook_count INTEGER := 0;
  pending_count INTEGER := 0;
  failed_count INTEGER := 0;
BEGIN
  -- 清理旧的已处理webhook失败记录
  WITH deleted_webhooks AS (
    DELETE FROM webhook_failures 
    WHERE status = 'processed' 
      AND processed_at < NOW() - INTERVAL '1 day' * p_days
    RETURNING id
  )
  SELECT COUNT(*) INTO webhook_count FROM deleted_webhooks;
  
  -- 清理旧的已处理待匹配积分
  WITH deleted_pending AS (
    DELETE FROM pending_user_credits 
    WHERE status = 'processed' 
      AND processed_at < NOW() - INTERVAL '1 day' * p_days
    RETURNING id
  )
  SELECT COUNT(*) INTO pending_count FROM deleted_pending;
  
  -- 清理旧的已处理失败生成
  WITH deleted_failed AS (
    DELETE FROM failed_generations 
    WHERE status = 'processed' 
      AND processed_at < NOW() - INTERVAL '1 day' * p_days
    RETURNING id
  )
  SELECT COUNT(*) INTO failed_count FROM deleted_failed;
  
  -- 返回结果
  RETURN QUERY
  SELECT 'webhook_failures'::VARCHAR as table_name, webhook_count::INTEGER as deleted_count
  UNION ALL
  SELECT 'pending_user_credits'::VARCHAR as table_name, pending_count::INTEGER as deleted_count
  UNION ALL
  SELECT 'failed_generations'::VARCHAR as table_name, failed_count::INTEGER as deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 使用示例查询
-- 生成健康检查报告
-- SELECT * FROM generate_health_check_report();

-- 获取关键问题
-- SELECT * FROM get_critical_issues();

-- 获取系统健康汇总
-- SELECT * FROM get_system_health_summary();

-- 清理30天前的旧数据（谨慎使用）
-- SELECT * FROM cleanup_old_monitoring_data(30);
