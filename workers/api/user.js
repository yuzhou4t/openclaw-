/**
 * 用户 API (模拟) - Cloudflare Workers 版本
 */

export default async function handler(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const pathParts = path.split('/').filter(p => p);
  const method = request.method;
  const authHeader = request.headers.get('authorization');

  // 移除 /api 前缀
  const apiIndex = pathParts.indexOf('api');
  if (apiIndex !== -1) {
    pathParts.splice(apiIndex, 1);
  }

  // 简单的模拟认证检查
  const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');

  // /api/user/profile - 获取用户信息
  if (pathParts.includes('profile')) {
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      id: '1',
      username: 'demo',
      email: 'demo@paperhub.com',
      favoritesCount: 12,
      readingListCount: 5,
      subscriptionsCount: 3
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // /api/user/favorites - 获取收藏列表
  if (pathParts.includes('favorites')) {
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      papers: [],
      total: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}