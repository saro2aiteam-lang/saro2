import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 创建 Supabase 客户端（用于客户端）
// 如果没有配置环境变量，使用占位符，避免构建时崩溃
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
})

// 注意：supabaseAdmin 现在在 @/lib/supabase-admin 中定义，仅用于服务端 API

// 数据库类型定义
export interface UserSubscription {
  id: number
  user_id: string
  email?: string
  full_name?: string
  plan_type: 'free' | 'creator' | 'studio' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  credits: number
  total_credits: number
  credits_reset_date?: string
  subscription_id?: string
  customer_id?: string
  current_period_start?: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

export interface VideoGeneration {
  id: number
  user_id: string
  generation_id: string
  prompt: string
  negative_prompt?: string
  duration: number
  resolution: string
  model: string
  status: 'processing' | 'completed' | 'failed'
  credits_used: number
  video_url?: string
  thumbnail_url?: string
  file_size_mb?: number
  processing_time_seconds?: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface ApiKey {
  id: number
  user_id: string
  api_key: string
  key_prefix: string
  name: string
  created_at: string
  last_used_at?: string
  is_active: boolean
  usage_count: number
}

export interface PaymentRecord {
  id: number
  user_id: string
  payment_id: string
  payment_method: string
  amount_cents: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  product_type?: string
  credits_purchased: number
  creem_payment_intent_id?: string
  metadata?: Record<string, any>
  created_at: string
  processed_at?: string
}

export interface UsageStats {
  id: number
  user_id: string
  stat_date: string
  api_calls: number
  videos_generated: number
  credits_consumed: number
  total_processing_time_minutes: number
  created_at: string
}

export interface SystemConfig {
  id: number
  config_key: string
  config_value: string
  description?: string
  created_at: string
  updated_at: string
}

// 便捷的数据库操作函数
export const db = {
  // 用户订阅相关
  async getUserSubscription(userId?: string): Promise<UserSubscription | null> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!currentUserId) return null
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', currentUserId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // 用户不存在
      throw error
    }
    return data
  },

  async createUserSubscription(userId: string, email?: string, fullName?: string): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        email: email,
        full_name: fullName,
        plan_type: 'free',
        status: 'active',
        credits: 3, // 免费用户初始 3 个 credits
        total_credits: 3
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 视频生成相关
  async getUserGenerations(userId?: string, limit = 10): Promise<VideoGeneration[]> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!currentUserId) return []
    
    const { data, error } = await supabase
      .from('video_generations')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async createVideoGeneration(generation: Omit<VideoGeneration, 'id' | 'created_at' | 'completed_at'>): Promise<VideoGeneration> {
    const { data, error } = await supabase
      .from('video_generations')
      .insert(generation)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateVideoGeneration(generationId: string, updates: Partial<VideoGeneration>): Promise<void> {
    const { error } = await supabase
      .from('video_generations')
      .update(updates)
      .eq('generation_id', generationId)
    
    if (error) throw error
  },

  // API 密钥相关
  async getUserApiKeys(userId?: string): Promise<ApiKey[]> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!currentUserId) return []
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createApiKey(userId: string, apiKey: string): Promise<ApiKey> {
    const keyPrefix = apiKey.substring(0, 12) + '...'
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        api_key: apiKey,
        key_prefix: keyPrefix,
        name: 'Default API Key'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 系统配置
  async getConfig(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', key)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data?.config_value || null
  },

  // Supabase Auth 相关辅助函数
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signUp(email: string, password: string, metadata?: { full_name?: string }) {
    // 和客户端一致：为邮件确认指定回调地址
    const isProduction = process.env.NODE_ENV === 'production'
  const baseUrl = isProduction
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://aivido.ai')
      : (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL)

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${baseUrl}/auth/callback`,
      }
    })
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return supabase.auth.signOut()
  }
}

export default supabase
