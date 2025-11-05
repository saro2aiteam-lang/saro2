#!/usr/bin/env node

/**
 * 环境变量检查和修复脚本
 * 用于诊断和修复 Creem 产品ID配置问题
 */

console.log('🔍 Creem 产品ID配置检查工具\n');

// 检查环境变量
const requiredEnvVars = [
  'NEXT_PUBLIC_CREEM_PACK_STARTER_ID',
  'NEXT_PUBLIC_CREEM_PACK_CREATOR_ID', 
  'NEXT_PUBLIC_CREEM_PACK_DEV_ID',
  'CREEM_API_KEY',
  'CREEM_WEBHOOK_SECRET'
];

console.log('📋 检查必需的环境变量:');
let allConfigured = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const isConfigured = value && value.length > 0 && !value.includes('your_') && !value.includes('prod_public_');
  
  console.log(`  ${isConfigured ? '✅' : '❌'} ${envVar}: ${isConfigured ? '已配置' : '未配置或使用默认值'}`);
  
  if (!isConfigured) {
    allConfigured = false;
    if (envVar.includes('STARTER_ID')) {
      console.log(`     💡 建议设置为: NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_3X5Y4eFmFtOa5rCapJFMI9`);
    }
  }
});

console.log('\n🎯 根据你的 webhook 数据，需要的配置:');
console.log('NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_3X5Y4eFmFtOa5rCapJFMI9');

console.log('\n📝 修复步骤:');
console.log('1. 在 Vercel Dashboard → Settings → Environment Variables 中添加:');
console.log('   NEXT_PUBLIC_CREEM_PACK_STARTER_ID = prod_3X5Y4eFmFtOa5rCapJFMI9');
console.log('2. 重新部署应用');
console.log('3. 再次测试购买');

if (allConfigured) {
  console.log('\n✅ 所有环境变量都已正确配置！');
} else {
  console.log('\n⚠️  需要配置缺失的环境变量才能正常工作。');
}

console.log('\n🔧 当前配置状态:');
console.log(`NEXT_PUBLIC_CREEM_PACK_STARTER_ID: ${process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID || '未设置'}`);
console.log(`CREEM_API_KEY: ${process.env.CREEM_API_KEY ? '已设置' : '未设置'}`);
console.log(`CREEM_WEBHOOK_SECRET: ${process.env.CREEM_WEBHOOK_SECRET ? '已设置' : '未设置'}`);
