/**
 * 补偿积分脚本
 * 给 fujashihao@gmail.com 额外补偿 100 积分
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';

async function addCompensationCredits() {
  const supabase = getSupabaseAdmin();
  const email = 'fujashihao@gmail.com';
  const compensationAmount = 100;
  
  console.log(`\n🎁 给 ${email} 补偿 ${compensationAmount} 积分\n`);
  
  // 1. 查找用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total')
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
    current_balance: user.credits_balance,
    current_total: user.credits_total,
  });
  
  // 2. 获取当前积分
  const currentBalance = Number(user.credits_balance || 0);
  const currentTotal = Number(user.credits_total || 0);
  const newBalance = currentBalance + compensationAmount;
  const newTotal = currentTotal + compensationAmount;
  
  console.log(`\n💰 积分变更:`);
  console.log(`  当前余额: ${currentBalance}`);
  console.log(`  补偿金额: +${compensationAmount}`);
  console.log(`  新余额: ${newBalance}`);
  
  // 3. 更新用户积分
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      credits_balance: newBalance,
      credits_total: newTotal,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('credits_balance, credits_total')
    .single();
  
  if (updateError) {
    console.error('❌ 更新积分失败:', updateError);
    return;
  }
  
  // 4. 记录积分交易
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: compensationAmount,
      transaction_type: 'credit',
      reason: 'compensation',
      metadata: {
        source: 'manual_compensation',
        reason: '补偿用户购买问题',
        compensation: true,
        originalIssue: '购买两次9.9包未收到积分'
      }
    });
  
  if (txError) {
    console.error('⚠️  积分交易记录失败（但积分已更新）:', txError);
  } else {
    console.log('✅ 积分交易记录已创建');
  }
  
  console.log('\n✅ 补偿积分发放成功!');
  console.log('📊 最终积分状态:', {
    balance: updatedUser.credits_balance,
    total: updatedUser.credits_total,
    compensation_added: compensationAmount
  });
  
  console.log('\n✅ 完成!\n');
}

// 运行脚本
addCompensationCredits().catch(console.error);

