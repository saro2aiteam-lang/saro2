-- 简化清理脚本 - 只删除表和函数
-- 由于表不存在，直接跳过策略删除

-- 1. 删除可能存在的表（如果创建失败）
DROP TABLE IF EXISTS email_matching_logs CASCADE;
DROP TABLE IF EXISTS unmatched_payment_emails CASCADE;
DROP TABLE IF EXISTS user_email_aliases CASCADE;

-- 2. 删除可能存在的函数
DROP FUNCTION IF EXISTS log_email_matching(VARCHAR(255), UUID, VARCHAR(255), VARCHAR(50), VARCHAR(100), JSONB);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. 确认清理完成
SELECT 'Cleanup completed. Now run email-matching-tables-fixed.sql' as status;
