-- ============================================================
-- 数据库 Schema 验证脚本
-- 在 Supabase SQL Editor 中运行此脚本检查数据库是否完整
-- ============================================================

-- 1. 检查所有必需的表是否存在
SELECT 
  'Tables Check' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('users', 'user_subscriptions', 'video_jobs', 'credit_transactions', 'payments', 'api_keys', 'usage_stats', 'user_email_aliases', 'unmatched_payment_emails', 'system_config')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. 检查 users 表的字段（关键表）
SELECT 
  'Users Table Columns' as check_type,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'email', 'credits_balance', 'credits_total', 'credits_spent', 'credits_limit', 'subscription_plan', 'subscription_status')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 检查 users 表的外键关联
SELECT 
  'Users Foreign Keys' as check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  CASE 
    WHEN ccu.table_name = 'auth.users' THEN '✅ Correct'
    ELSE '❌ Wrong'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 4. 检查 user_subscriptions 表的字段
SELECT 
  'User Subscriptions Columns' as check_type,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'plan_type', 'plan_status', 'subscription_id', 'creem_subscription_id')
    THEN '✅ Important'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 检查 video_jobs 表的字段
SELECT 
  'Video Jobs Columns' as check_type,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'job_id', 'status', 'cost_credits', 'credit_cost', 'params', 'model')
    THEN '✅ Important'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_name = 'video_jobs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 检查 credit_transactions 表是否存在
SELECT 
  'Credit Transactions Table' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions' AND table_schema = 'public')
    THEN '✅ Exists'
    ELSE '❌ Missing - Critical!'
  END as status;

-- 7. 检查 RLS 策略
SELECT 
  'RLS Policies' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN tablename IN ('users', 'user_subscriptions', 'video_jobs', 'credit_transactions', 'payments')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. 检查积分函数是否存在
SELECT 
  'Credit Functions' as check_type,
  routine_name,
  CASE 
    WHEN routine_name IN ('credit_user_credits_transaction', 'debit_user_credits_transaction', 'refund_user_credits')
    THEN '✅ Exists'
    ELSE '⚠️ Missing'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'credit_user_credits_transaction',
    'debit_user_credits_transaction', 
    'refund_user_credits'
  )
ORDER BY routine_name;

-- 9. 检查索引
SELECT 
  'Indexes' as check_type,
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE 'idx_%' THEN '✅ Has Index'
    ELSE '⚠️ Check'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'video_jobs', 'credit_transactions', 'payments')
ORDER BY tablename, indexname;

-- 10. 检查触发器
SELECT 
  'Triggers' as check_type,
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name LIKE '%updated_at%' OR trigger_name LIKE '%new_user%'
    THEN '✅ Exists'
    ELSE '⚠️ Check'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================
-- 总结报告
-- ============================================================
SELECT 
  'SUMMARY' as check_type,
  'Run all checks above to see detailed status' as message,
  'If you see ❌ Missing, you need to fix it' as action;

