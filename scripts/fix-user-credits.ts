/**
 * 修复用户积分脚本
 * 用于检查和修复 fujashihao@gmail.com 的积分问题
 * 运行: npx tsx scripts/fix-user-credits.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../src/lib/supabase-admin';
import { creditCredits } from '../src/lib/credits';

async function fixUserCredits() {
  const supabase = getSupabaseAdmin();
  const email = 'fujashihao@gmail.com';
  const manualCreditAmount = 600; // 手动指定需要补发的积分（两次9.9包 = 2 × 300）
  
  console.log(`\n🔍 查找用户: ${email}`);
  
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
    credits_balance: user.credits_balance,
    credits_total: user.credits_total,
  });
  
  // 2. 查找支付记录（9.9的Starter Pack）
  console.log('\n🔍 查找支付记录...');
  // 先查找所有支付记录
  const { data: allPayments, error: allPaymentsError } = await supabase
    .from('payments')
    .select('id, amount, currency, status, creem_payment_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  
  if (allPaymentsError) {
    console.error('❌ 查找支付记录失败:', allPaymentsError);
  } else {
    console.log(`找到 ${allPayments?.length || 0} 条支付记录（全部）:`);
    allPayments?.forEach((p, i) => {
      console.log(`  ${i + 1}. 支付ID: ${p.creem_payment_id}, 金额: ${p.amount} ${p.currency || 'USD'}, 状态: ${p.status}, 时间: ${p.created_at}`);
    });
  }
  
  // 查找9.9的支付记录（可能是990 cents或9.9）
  const payments = allPayments?.filter(p => 
    p.amount === 990 || 
    p.amount === 9.9 || 
    (p.amount >= 980 && p.amount <= 1000) // 允许一些误差
  ) || [];
  
  console.log(`✅ 找到 ${payments?.length || 0} 条支付记录 (9.9美元):`);
  payments?.forEach((p, i) => {
    console.log(`  ${i + 1}. 支付ID: ${p.creem_payment_id}, 金额: ${p.amount / 100} ${p.currency}, 状态: ${p.status}, 时间: ${p.created_at}`);
  });
  
  // 3. 查找积分交易记录
  console.log('\n🔍 查找积分交易记录...');
  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('id, amount, transaction_type, reason, metadata, created_at')
    .eq('user_id', user.id)
    .eq('transaction_type', 'credit')
    .order('created_at', { ascending: true });
  
  if (txError) {
    console.error('❌ 查找积分交易失败:', txError);
  } else {
    console.log(`✅ 找到 ${transactions?.length || 0} 条积分交易记录:`);
    transactions?.forEach((t, i) => {
      const metadata = t.metadata as any;
      console.log(`  ${i + 1}. 金额: ${t.amount}, 原因: ${t.reason}, 计划: ${metadata?.planId || 'N/A'}, 时间: ${t.created_at}`);
      if (metadata?.planId === 'starter' || metadata?.productId) {
        console.log(`     元数据:`, JSON.stringify(metadata, null, 2));
      }
    });
  }
  
  // 4. 检查是否有9.9购买的积分记录
  const starterPackCredits = transactions?.filter(t => {
    const metadata = t.metadata as any;
    return metadata?.planId === 'starter' || 
           metadata?.planCategory === 'pack' ||
           (t.reason === 'creem_payment' && t.amount === 300);
  }) || [];
  
  console.log(`\n📊 分析结果:`);
  console.log(`  - 支付记录数: ${payments?.length || 0}`);
  console.log(`  - Starter Pack相关积分交易: ${starterPackCredits.length}`);
  
  // 5. 计算应该补发的积分
  const expectedCredits = (payments?.length || 0) * 300; // 每个9.9包应该给300积分
  const actualCredits = starterPackCredits.reduce((sum, t) => sum + t.amount, 0);
  const missingCredits = expectedCredits - actualCredits;
  
  console.log(`\n💰 积分统计:`);
  console.log(`  - 应该有的积分: ${expectedCredits} (${payments?.length || 0} × 300)`);
  console.log(`  - 实际已发放: ${actualCredits}`);
  console.log(`  - 缺失积分: ${missingCredits}`);
  
  // 6. 如果需要补发积分（或者手动指定了补发数量）
  const creditsToAdd = missingCredits > 0 ? missingCredits : (payments?.length === 0 ? manualCreditAmount : 0);
  
  if (creditsToAdd > 0) {
    console.log(`\n🔧 准备补发 ${creditsToAdd} 积分...`);
    if (payments?.length === 0) {
      console.log(`   ⚠️  数据库中没有找到支付记录，使用手动指定的积分数量: ${manualCreditAmount}`);
    }
    
    try {
      console.log('🔄 直接更新用户积分...');
      
      // 先获取当前积分
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('credits_balance, credits_total')
        .eq('id', user.id)
        .single();
      
      if (fetchError) {
        console.error('❌ 获取当前积分失败:', fetchError);
        return;
      }
      
      const currentBalance = Number(currentUser.credits_balance || 0);
      const currentTotal = Number(currentUser.credits_total || 0);
      const newBalance = currentBalance + creditsToAdd;
      const newTotal = currentTotal + creditsToAdd;
      
      // 更新用户积分
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
      
      // 记录积分交易
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: creditsToAdd,
          transaction_type: 'credit',
          reason: 'manual_fix_starter_pack',
          metadata: {
            planId: 'starter',
            planCategory: 'pack',
            bucket: 'flex',
            source: 'manual_fix_script',
            reason: '补发缺失的Starter Pack积分',
            originalPayments: payments?.map(p => ({
              paymentId: p.creem_payment_id,
              amount: p.amount,
              createdAt: p.created_at
            })) || []
          }
        });
      
      if (txError) {
        console.error('⚠️  积分交易记录失败（但积分已更新）:', txError);
      }
      
      console.log('✅ 积分补发成功!');
      console.log('📊 新的积分状态:', {
        balance: updatedUser.credits_balance,
        total: updatedUser.credits_total,
        added: creditsToAdd
      });
    } catch (error) {
      console.error('❌ 补发积分异常:', error);
    }
  } else {
    console.log('\n✅ 积分正常，无需补发');
  }
  
  // 7. 再次查询用户积分状态
  console.log('\n🔍 最终积分状态:');
  const { data: finalUser, error: finalError } = await supabase
    .from('users')
    .select('id, email, credits_balance, credits_total')
    .eq('id', user.id)
    .single();
  
  if (!finalError && finalUser) {
    console.log('📊 当前积分:', {
      credits_balance: finalUser.credits_balance,
      credits_total: finalUser.credits_total,
    });
  }
  
  console.log('\n✅ 完成!\n');
}

// 运行脚本
fixUserCredits().catch(console.error);

