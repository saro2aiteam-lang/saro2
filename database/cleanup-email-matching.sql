-- 修复邮箱匹配表 - 清理和重建
-- 如果之前执行失败，先运行这个脚本清理，然后执行 email-matching-tables-fixed.sql

-- 1. 删除可能存在的错误策略（使用DO块处理不存在的表）
DO $$
BEGIN
    -- 尝试删除策略，如果表不存在会忽略错误
    BEGIN
        DROP POLICY IF EXISTS "Admins can manage all email aliases" ON user_email_aliases;
    EXCEPTION WHEN undefined_table THEN
        -- 表不存在，忽略错误
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can manage unmatched payment emails" ON unmatched_payment_emails;
    EXCEPTION WHEN undefined_table THEN
        -- 表不存在，忽略错误
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can view email matching logs" ON email_matching_logs;
    EXCEPTION WHEN undefined_table THEN
        -- 表不存在，忽略错误
    END;
END $$;

-- 2. 删除可能存在的表（如果创建失败）
DROP TABLE IF EXISTS email_matching_logs CASCADE;
DROP TABLE IF EXISTS unmatched_payment_emails CASCADE;
DROP TABLE IF EXISTS user_email_aliases CASCADE;

-- 3. 删除可能存在的函数
DROP FUNCTION IF EXISTS log_email_matching(VARCHAR(255), UUID, VARCHAR(255), VARCHAR(50), VARCHAR(100), JSONB);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 4. 确认清理完成
SELECT 'Cleanup completed. Now run email-matching-tables-fixed.sql' as status;
