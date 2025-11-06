"use client";

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ user: User | null; error: any }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    // 使用 Supabase 自带的 signUp 触发确认邮件（依赖 Supabase Auth 邮件配置）
    try {
      const isProduction = process.env.NODE_ENV === 'production'
      const baseUrl = isProduction ? (process.env.NEXT_PUBLIC_APP_URL || 'https://saro2.ai') : window.location.origin

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${baseUrl}/auth/callback`,
        }
      })

      return { user: data.user, error }
    } catch (err: any) {
      return { user: null, error: { message: err?.message || 'Signup failed' } }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: data.user, error }
  }

  const signInWithGoogle = async () => {
    // 根据环境设置重定向 URL
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://saro2.ai')
      : window.location.origin;

    console.log('🔐 Google OAuth redirect URL:', `${baseUrl}/auth/callback`);

    // 检测移动端设备
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 移动端使用弹窗方式避免useragent限制
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account'
          }
        }
      })
      return { error }
    } else {
      // 桌面端正常重定向
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`
        }
      })
      return { error }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
