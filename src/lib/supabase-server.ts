import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 创建服务端 Supabase 客户端（用于 Server Components 和 Server Actions）
 * 这个客户端会自动处理 cookies，适用于 Next.js App Router
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * 在 API Routes 中创建 Supabase 客户端
 * 用于处理请求和响应 cookies
 */
export function createSupabaseApiClient(
  getCookie: (name: string) => string | undefined,
  setCookie: (name: string, value: string, options?: any) => void,
  deleteCookie: (name: string, options?: any) => void
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name);
        },
        set(name: string, value: string, options: any) {
          setCookie(name, value, options);
        },
        remove(name: string, options: any) {
          deleteCookie(name, options);
        },
      },
    }
  );
}

