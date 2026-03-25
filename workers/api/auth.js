/**
 * 认证 API (模拟) - Cloudflare Workers 版本
 */

export default async function handler(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const pathParts = path.split('/').filter(p => p);
  const method = request.method;

  // 移除 /api 前缀
  const apiIndex = pathParts.indexOf('api');
  if (apiIndex !== -1) {
    pathParts.splice(apiIndex, 1);
  }

  // /api/auth/login - 登录
  if (pathParts.includes('login')) {
    if (method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        token: 'mock-jwt-token-123456',
        user: {
          id: '1',
          username: 'demo',
          email: 'demo@paperhub.com'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // /api/auth/register - 注册
  if (pathParts.includes('register')) {
    if (method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'User registered successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}