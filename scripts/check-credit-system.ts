/**
 * 积分系统全面检查脚本
 * 检查所有积分相关的函数、API 和可能的问题
 * 运行: npx tsx scripts/check-credit-system.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';

async function checkCreditSystem() {
  const supabase = getSupabaseAdmin();
  
  console.log('\n🔍 积分系统全面检查\n');
  console.log('='.repeat(60));
  
  // 1. 检查数据库函数是否存在
  console.log('\n📋 1. 检查数据库函数...');
  const functionsToCheck = [
    'credit_user_credits_transaction',
    'debit_user_credits_transaction',
    'refund_user_credits'
  ];
  
  for (const funcName of functionsToCheck) {
    try {
      // 尝试调用函数（使用无效参数来测试是否存在）
      const { error } = await supabase.rpc(funcName as any, {
        p_user_id: '00000000-0000-0000-0000-000000000000' as any,
        p_amount: 0,
        p_reason: null,
        p_metadata: null
      });
      
      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42883') {
          console.log(`  ❌ ${funcName}: 函数不存在`);
        } else if (error.code === 'P0003' || error.message?.includes('positive')) {
          console.log(`  ✅ ${funcName}: 存在（参数验证正常）`);
        } else if (error.code === 'P0005' || error.message?.includes('not found')) {
          console.log(`  ✅ ${funcName}: 存在（用户验证正常）`);
        } else {
          console.log(`  ⚠️  ${funcName}: 存在但返回错误: ${error.code} - ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  ${funcName}: 存在（但意外成功，可能函数逻辑有问题）`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ❌ ${funcName}: 函数不存在`);
        } else {
          console.log(`  ❌ ${funcName}: 检查失败 - ${error.message}`);
        }
      }
    }
  }
  
  // 2. 检查函数返回类型
  console.log('\n📋 2. 检查函数返回类型...');
  try {
    // 使用一个真实用户来测试（kellyzhaoning@gmail.com）
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'kellyzhaoning@gmail.com')
      .maybeSingle();
    
    if (user) {
      // 测试 credit 函数返回类型
      const { data: creditData, error: creditError } = await supabase.rpc('credit_user_credits_transaction', {
        p_user_id: user.id,
        p_amount: 1,
        p_reason: 'system_check',
        p_metadata: { check: true }
      });
      
      if (!creditError && creditData) {
        const row = (creditData as any[])?.[0];
        const fields = Object.keys(row || {});
        console.log(`  ✅ credit_user_credits_transaction 返回字段: ${fields.join(', ')}`);
        
        // 检查是否有 subscription_credits_balance 和 flex_credits_balance
        if (fields.includes('subscription_credits_balance') && fields.includes('flex_credits_balance')) {
          console.log(`     ⚠️  返回 5 个字段（包含 split credits），但代码可能期望 3 个字段`);
        } else if (fields.length === 3) {
          console.log(`     ✅ 返回 3 个字段（标准格式）`);
        }
        
        // 立即退还测试积分
        await supabase.rpc('debit_user_credits_transaction', {
          p_user_id: user.id,
          p_amount: 1,
          p_reason: 'system_check_revert',
          p_metadata: { check: true, revert: true }
        });
      }
      
      // 测试 debit 函数返回类型
      const { data: debitData, error: debitError } = await supabase.rpc('debit_user_credits_transaction', {
        p_user_id: user.id,
        p_amount: 0, // 使用 0 来触发参数验证错误
        p_reason: 'system_check',
        p_metadata: { check: true }
      });
      
      if (debitError && debitError.code === 'P0003') {
        console.log(`  ✅ debit_user_credits_transaction: 函数存在且参数验证正常`);
      } else if (debitError && debitError.code === '42702') {
        console.log(`  ❌ debit_user_credits_transaction: 存在列名歧义错误！需要修复`);
      } else if (debitError) {
        console.log(`  ⚠️  debit_user_credits_transaction: ${debitError.code} - ${debitError.message}`);
      }
    }
  } catch (error) {
    console.error(`  ❌ 检查返回类型失败:`, error);
  }
  
  // 3. 检查 credit_transactions 表
  console.log('\n📋 3. 检查 credit_transactions 表...');
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log(`  ❌ credit_transactions 表不存在！`);
      } else {
        console.log(`  ⚠️  查询失败: ${error.message}`);
      }
    } else {
      console.log(`  ✅ credit_transactions 表存在`);
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`     表字段: ${columns.join(', ')}`);
      }
    }
  } catch (error) {
    console.error(`  ❌ 检查表失败:`, error);
  }
  
  // 4. 检查 users 表的积分字段
  console.log('\n📋 4. 检查 users 表积分字段...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent, subscription_credits_balance, flex_credits_balance')
      .limit(1);
    
    if (error) {
      console.log(`  ⚠️  查询失败: ${error.message}`);
    } else if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      console.log(`  ✅ 找到积分字段: ${fields.join(', ')}`);
      
      const hasSplitCredits = fields.includes('subscription_credits_balance') && fields.includes('flex_credits_balance');
      if (hasSplitCredits) {
        console.log(`     ⚠️  有 split credits 字段，但函数可能不支持`);
      }
    }
  } catch (error) {
    console.error(`  ❌ 检查字段失败:`, error);
  }
  
  // 5. 检查代码中的不一致
  console.log('\n📋 5. 检查代码一致性...');
  console.log(`  ✅ src/lib/credits.ts 使用标准函数: debitCredits, creditCredits, refundCredits`);
  console.log(`  ⚠️  部分 API 直接调用 RPC，部分使用 credits.ts 函数`);
  console.log(`  ⚠️  需要统一使用 credits.ts 中的函数`);
  
  // 6. 总结和建议
  console.log('\n📊 检查总结:');
  console.log('='.repeat(60));
  console.log('\n⚠️  发现的问题:');
  console.log('  1. debit_user_credits_transaction 函数可能存在列名歧义');
  console.log('  2. 函数返回类型可能不一致（3 字段 vs 5 字段）');
  console.log('  3. 部分 API 直接调用 RPC，应该统一使用 credits.ts 函数');
  console.log('\n✅ 建议的修复步骤:');
  console.log('  1. 在 Supabase Dashboard 执行 database/fix-debit-function.sql');
  console.log('  2. 确认所有函数返回类型一致');
  console.log('  3. 统一 API 使用 credits.ts 中的函数');
  console.log('\n✅ 检查完成!\n');
}

// 运行检查
checkCreditSystem().catch(console.error);

