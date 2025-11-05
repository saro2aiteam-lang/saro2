#!/usr/bin/env node

/**
 * Supabase 配置检查脚本
 * 运行此脚本检查 Supabase 配置是否正确
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 尝试加载 .env.local，如果不存在则加载 .env
config({ path: resolve(__dirname, '..', '.env.local') });
config({ path: resolve(__dirname, '..', '.env') });

const requiredEnvVars = {
  // 客户端可见（公开）
  client: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  // 服务端专用（私密）
  server: [
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  // 可选配置
  optional: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ],
};

function checkEnvVars() {
  console.log('🔍 检查 Supabase 配置...\n');
  
  const missing = [];
  const present = [];
  const optional = [];
  
  // 检查必需的客户端变量
  requiredEnvVars.client.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('placeholder') || value.includes('your_')) {
      missing.push(`❌ ${varName} - 未配置或使用占位符`);
    } else {
      present.push(`✅ ${varName} - 已配置`);
      // 显示部分值用于验证
      const displayValue = value.length > 50 
        ? value.substring(0, 50) + '...' 
        : value;
      console.log(`   ${displayValue}`);
    }
  });
  
  // 检查必需的服务端变量
  requiredEnvVars.server.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('placeholder') || value.includes('your_')) {
      missing.push(`❌ ${varName} - 未配置或使用占位符`);
    } else {
      present.push(`✅ ${varName} - 已配置（隐藏值）`);
    }
  });
  
  // 检查可选变量
  requiredEnvVars.optional.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('placeholder') || value.includes('your_')) {
      optional.push(`⚠️  ${varName} - 未配置（可选）`);
    } else {
      optional.push(`✅ ${varName} - 已配置`);
    }
  });
  
  console.log('\n📋 配置状态：\n');
  
  present.forEach(item => console.log(`  ${item}`));
  missing.forEach(item => console.log(`  ${item}`));
  optional.forEach(item => console.log(`  ${item}`));
  
  if (missing.length > 0) {
    console.log('\n❌ 发现配置问题！');
    console.log('\n请按照以下步骤配置：');
    console.log('1. 复制 env.example 为 .env.local');
    console.log('2. 在 Supabase Dashboard → Settings → API 获取配置');
    console.log('3. 填写 .env.local 中的 Supabase 配置');
    console.log('4. 重新运行此脚本验证\n');
    process.exit(1);
  }
  
  // 验证 URL 格式
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.log('\n⚠️  警告: NEXT_PUBLIC_SUPABASE_URL 应该以 https:// 开头');
  }
  
  // 验证 Key 格式
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey && anonKey.length < 100) {
    console.log('\n⚠️  警告: NEXT_PUBLIC_SUPABASE_ANON_KEY 看起来太短，可能不正确');
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length < 100) {
    console.log('\n⚠️  警告: SUPABASE_SERVICE_ROLE_KEY 看起来太短，可能不正确');
  }
  
  console.log('\n✅ 所有必需的配置都已设置！');
  console.log('\n📝 下一步：');
  console.log('1. 在 Supabase Dashboard 中运行 database/supabase_schema.sql');
  console.log('2. 配置 Authentication Providers（如果需要）');
  console.log('3. 测试登录功能');
  console.log('4. 查看 SUPABASE_SETUP.md 获取详细说明\n');
  
  process.exit(0);
}

// 运行检查
checkEnvVars();

