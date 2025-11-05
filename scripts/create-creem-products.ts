/**
 * Creem 产品自动创建脚本
 * 运行: npx tsx scripts/create-creem-products.ts
 */

import { Creem } from 'creem';

// 从环境变量获取 API Key
const apiKey = process.env.CREEM_API_KEY;

if (!apiKey) {
  console.error('❌ 错误：请先在 .env.local 中设置 CREEM_API_KEY');
  process.exit(1);
}

const creem = new Creem();

// 定义所有产品
const products = [
  {
    name: 'Basic - Monthly',
    price: 1900, // $19/月, 100 credits ($0.19/credit)
    interval: 'month' as const,
    envKey: 'CREEM_PRODUCT_BASIC_MONTHLY',
    description: '100 credits per month - Perfect for getting started',
  },
  {
    name: 'Basic - Yearly',
    price: 19200, // $192/年 (相当于 $16/月, 节省 $36)
    interval: 'year' as const,
    envKey: 'CREEM_PRODUCT_BASIC_YEARLY',
    description: '1,200 credits per year - Save $36 annually',
  },
  {
    name: 'Creator - Monthly',
    price: 4900, // $49/月, 300 credits ($0.16/credit)
    interval: 'month' as const,
    envKey: 'CREEM_PRODUCT_CREATOR_MONTHLY',
    description: '300 credits per month - Ideal for content creators',
  },
  {
    name: 'Creator - Yearly',
    price: 49920, // $499.20/年 (相当于 $41.60/月, 节省 $88.80)
    interval: 'year' as const,
    envKey: 'CREEM_PRODUCT_CREATOR_YEARLY',
    description: '3,600 credits per year - Save $88.80 annually',
  },
  {
    name: 'Pro - Monthly',
    price: 14900, // $149/月, 1000 credits ($0.15/credit)
    interval: 'month' as const,
    envKey: 'CREEM_PRODUCT_PRO_MONTHLY',
    description: '1,000 credits per month - For professionals',
  },
  {
    name: 'Pro - Yearly',
    price: 152064, // $1,520.64/年 (相当于 $126.72/月, 节省 $267.36)
    interval: 'year' as const,
    envKey: 'CREEM_PRODUCT_PRO_YEARLY',
    description: '12,000 credits per year - Save $267.36 annually',
  },
];

async function createProducts() {
  console.log('🚀 开始创建 Creem 产品...\n');

  const results: Array<{ name: string; id: string; envKey: string }> = [];

  for (const product of products) {
    try {
      console.log(`📦 创建产品: ${product.name} ($${product.price / 100})...`);

      const result = await creem.createProduct({
        xApiKey: apiKey!,
        createProductRequest: {
          name: product.name,
          price: product.price,
          interval: product.interval,
          currency: 'usd',
          description: product.description,
        },
      });

      if (result.ok && result.value) {
        const productId = result.value.id;
        console.log(`✅ 成功! Product ID: ${productId}\n`);
        
        results.push({
          name: product.name,
          id: productId || '',
          envKey: product.envKey,
        });
      } else {
        console.error(`❌ 失败: ${JSON.stringify(result.error)}\n`);
      }
    } catch (error) {
      console.error(`❌ 创建 ${product.name} 时出错:`, error);
    }
  }

  // 输出环境变量配置
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有产品创建完成！');
  console.log('='.repeat(60));
  console.log('\n📋 复制以下内容到你的 .env.local 文件:\n');
  
  results.forEach(({ envKey, id }) => {
    console.log(`${envKey}=${id}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 提示：记得重启开发服务器以加载新的环境变量！');
  console.log('   npm run dev\n');
}

createProducts().catch(console.error);

