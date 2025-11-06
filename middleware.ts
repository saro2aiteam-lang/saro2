import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 跳过静态资源和 Next.js 内部文件
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // 创建 Supabase 客户端用于处理所有需要 session 的路由
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 处理 OAuth 回调路由 - 刷新 session 并设置 cookies
  if (pathname === '/auth/callback') {
    await supabase.auth.getSession();
    return response;
  }

  // 保护 API 路由
  const protectedApiRoutes = ['/api/videos', '/api/subscriptions', '/api/usage'];
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedApiRoute) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png, icon.png, logo.png (favicon and icons)
     * - robots.txt, sitemap.xml (SEO files)
     * - static files (images, fonts, etc.)
     */
    '/(?:(?!_next/static|_next/image|favicon|icon|logo|robots|sitemap|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)).*)',
  ],
};
