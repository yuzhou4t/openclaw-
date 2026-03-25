/**
 * Cron Job API - Cloudflare Workers 版本
 */

export default async function handler(request, env, ctx) {
  // 验证 cron secret（可选安全措施）
  const authHeader = request.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${env.CRON_SECRET || 'cron-secret-key'}`;

  // 如果需要认证，取消注释下面这行
  // if (!isAuthorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  // 记录 cron 执行
  console.log(`[Cron] Daily push executed at ${new Date().toISOString()}`);

  // 返回成功状态
  return new Response(JSON.stringify({
    success: true,
    message: 'Daily push cron job executed',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}