/**
 * 诊断积分系统错误
 * 检查 RPC 函数是否存在以及用户记录是否正常
 * 运行: npx tsx scripts/diagnose-credit-error.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';

async function diagnoseCreditError() {
  const supabase = getSupabaseAdmin();
  const email = 'kellyzhaoning@gmail.com';
  
  console.log(`\n🔍 诊断积分系统错误 - ${email}\n`);
  
  // 1. 查找用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total, credits_spent')
    .eq('email', email)
    .maybeSingle();
  
  if (userError) {
    console.error('❌ 查找用户失败:', userError);
    return;
  }
  
  if (!user) {
    console.error(`❌ 用户不存在: ${email}`);
    return;
  }
  
  console.log('✅ 找到用户:', {
    id: user.id,
    email: user.email,
    credits_balance: user.credits_balance,
    credits_total: user.credits_total,
    credits_spent: user.credits_spent,
  });
  
  // 2. 检查 RPC 函数是否存在（通过尝试调用来检查）
  console.log('\n🔍 检查 RPC 函数...');
  console.log('   将通过实际调用测试函数是否存在...');
  
  // 3. 测试调用 RPC 函数（使用无效参数来测试函数是否存在）
  console.log('\n🔍 测试 RPC 函数调用...');
  try {
    // 使用 0 金额来触发参数验证错误，这样可以测试函数是否存在而不实际扣除积分
    const { data: testResult, error: testError } = await supabase.rpc('debit_user_credits_transaction', {
      p_user_id: user.id,
      p_amount: 0, // 使用 0 来触发参数验证错误，而不是实际扣除
      p_reason: 'diagnostic_test',
      p_metadata: { test: true }
    });
    
    if (testError) {
      if (testError.code === 'P0003') {
        console.log('✅ RPC 函数存在且正常工作（参数验证正常）');
        console.log(`   错误代码: ${testError.code} (这是预期的，因为我们传入了无效参数)`);
      } else if (testError.message?.includes('does not exist') || testError.message?.includes('function')) {
        console.error('❌ RPC 函数不存在！');
        console.error('   需要在 Supabase Dashboard 中执行以下 SQL 文件之一：');
        console.error('   - database/fix-rpc-function-complete.sql');
        console.error('   - database/credit-transactions-safe.sql');
      } else {
        console.log('⚠️  RPC 函数调用返回错误:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        });
        console.log('   这可能是正常的，取决于错误类型');
      }
    } else {
      console.log('✅ RPC 函数调用成功（但这是意外的，因为我们传入了 0 金额）');
    }
  } catch (error) {
    console.error('❌ RPC 函数调用异常:', error);
    if (error instanceof Error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.error('   ⚠️  函数不存在！需要在 Supabase Dashboard 中执行 fix-rpc-function-complete.sql');
      } else if (error.message.includes('permission denied')) {
        console.error('   ⚠️  权限问题！检查 RLS 策略和函数权限');
      } else {
        console.error('   错误详情:', error.message);
      }
    }
  }
  
  // 4. 检查 credit_transactions 表
  console.log('\n🔍 检查积分交易记录...');
  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('id, amount, transaction_type, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (txError) {
    console.error('❌ 查询积分交易失败:', txError);
    if (txError.code === '42P01') {
      console.error('   ⚠️  表不存在！需要创建 credit_transactions 表');
    }
  } else {
    console.log(`✅ 找到 ${transactions?.length || 0} 条最近的交易记录`);
    transactions?.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.transaction_type}: ${tx.amount}, 原因: ${tx.reason}, 时间: ${tx.created_at}`);
    });
  }
  
  // 5. 检查用户积分字段是否为 NULL
  console.log('\n🔍 检查用户积分字段...');
  const hasNullFields = 
    user.credits_balance === null || 
    user.credits_total === null || 
    user.credits_spent === null;
  
  if (hasNullFields) {
    console.warn('⚠️  用户积分字段包含 NULL 值:');
    if (user.credits_balance === null) console.warn('   - credits_balance 为 NULL');
    if (user.credits_total === null) console.warn('   - credits_total 为 NULL');
    if (user.credits_spent === null) console.warn('   - credits_spent 为 NULL');
    console.warn('   建议：更新这些字段为 0');
  } else {
    console.log('✅ 用户积分字段正常（无 NULL 值）');
  }
  
  // 6. 总结
  console.log('\n📊 诊断总结:');
  console.log('   如果看到 "Credit system error"，可能的原因：');
  console.log('   1. RPC 函数不存在 - 需要在 Supabase Dashboard 执行 fix-rpc-function.sql');
  console.log('   2. 用户积分字段为 NULL - 需要更新为 0');
  console.log('   3. 数据库连接问题 - 检查环境变量');
  console.log('   4. 权限问题 - 检查 RLS 策略');
  console.log('\n✅ 诊断完成!\n');
}

// 运行脚本
diagnoseCreditError().catch(console.error);

