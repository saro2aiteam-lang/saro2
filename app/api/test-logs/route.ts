import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// 测试日志输出 - 直接返回日志内容
export async function GET(request: NextRequest) {
  const logs: string[] = [];
  
  // 捕获 console.log
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    originalLog.apply(console, args);
  };
  
  const testId = `test_${Date.now()}`;
  console.log(`[TEST-${testId}] ========================================`);
  console.log(`[TEST-${testId}] 🧪 Test endpoint called`);
  console.log(`[TEST-${testId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[TEST-${testId}] Environment check:`, {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  console.log(`[TEST-${testId}] ========================================`);
  
  // 恢复 console.log
  console.log = originalLog;
  
  return NextResponse.json({
    message: 'Logs captured',
    testId,
    logs,
    note: 'If logs array is empty, console.log is not being captured. Check Vercel logs directly.',
    timestamp: new Date().toISOString()
  });
}

