import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily create the admin client at runtime to avoid build-time env evaluation.
let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  // 🔥 每次调用时都检查环境变量，避免缓存了错误的客户端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 如果环境变量缺失，清除缓存并抛出错误
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    cachedAdminClient = null; // 清除缓存
  }
  
  // 如果缓存存在且环境变量也存在，直接返回
  if (cachedAdminClient && supabaseUrl && supabaseServiceRoleKey) {
    return cachedAdminClient;
  }

  // 🔥 详细的错误检查
  if (!supabaseUrl) {
    console.error('[SUPABASE-ADMIN] Missing NEXT_PUBLIC_SUPABASE_URL');
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseServiceRoleKey) {
    console.error('[SUPABASE-ADMIN] Missing SUPABASE_SERVICE_ROLE_KEY');
    console.error('[SUPABASE-ADMIN] Available env vars:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    });
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please set it in Vercel environment variables.');
  }

  // 🔥 验证 key 格式（service_role key 应该以 'eyJ' 开头，是 JWT）
  if (!supabaseServiceRoleKey.startsWith('eyJ')) {
    console.warn('[SUPABASE-ADMIN] ⚠️ Service role key does not start with "eyJ" - might be incorrect format');
  }

  console.log('[SUPABASE-ADMIN] Creating admin client with:', {
    urlPrefix: supabaseUrl.substring(0, 30),
    keyPrefix: supabaseServiceRoleKey.substring(0, 20),
    keyLength: supabaseServiceRoleKey.length,
  });

  try {
    // 🔥 验证 key 不为空字符串
    if (supabaseServiceRoleKey.trim() === '') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is set but is an empty string');
    }
    
    // 🔥 验证 URL 格式
    if (!supabaseUrl.startsWith('http')) {
      throw new Error(`Invalid Supabase URL format: ${supabaseUrl.substring(0, 30)}`);
    }
    
    console.log('[SUPABASE-ADMIN] Creating client with verified config:', {
      url: supabaseUrl,
      keyLength: supabaseServiceRoleKey.length,
      keyPrefix: supabaseServiceRoleKey.substring(0, 20),
      keyEndsWith: supabaseServiceRoleKey.substring(supabaseServiceRoleKey.length - 10),
    });
    
    cachedAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      // 🔥 显式设置 headers，确保 API key 被传递
      global: {
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        }
      }
    });

    console.log('[SUPABASE-ADMIN] ✅ Admin client created successfully');
    
    // 🔥 测试客户端是否真的能工作（异步，但不阻塞返回）
    // 注意：这个测试是异步的，但不等待结果，避免阻塞函数返回
    cachedAdminClient
      .from('users')
      .select('id')
      .limit(1)
      .then(({ data: testData, error: testError }) => {
        if (testError) {
          console.error('[SUPABASE-ADMIN] ❌ Client test failed:', {
            message: testError.message,
            code: testError.code,
            details: testError.details,
            hint: testError.hint,
          });
        } else {
          console.log('[SUPABASE-ADMIN] ✅ Client test passed - can query users table');
        }
      })
      .catch((err) => {
        console.error('[SUPABASE-ADMIN] ❌ Client test exception:', err);
      });
    
    return cachedAdminClient;
  } catch (error) {
    console.error('[SUPABASE-ADMIN] ❌ Failed to create admin client:', error);
    cachedAdminClient = null; // 清除缓存
    throw error;
  }
}