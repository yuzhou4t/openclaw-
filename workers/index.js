/**
 * PaperHub Cloudflare Workers 入口
 */
import papers from './api/papers.js';
import push from './api/push.js';
import tags from './api/tags.js';
import categories from './api/categories.js';
import auth from './api/auth.js';
import user from './api/user.js';
import cron from './api/cron.js';

const routes = {
  papers,
  push,
  tags,
  categories,
  auth,
  user,
  cron
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API 路由处理 /api/xxx
    if (path.startsWith('/api/')) {
      const endpoint = path.split('/')[2]; // /api/papers -> papers

      if (routes[endpoint]) {
        try {
          const response = await routes[endpoint](request, env, ctx);

          // 添加 CORS 头到响应
          const newHeaders = new Headers(response.headers);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });

          return new Response(response.body, {
            status: response.status,
            headers: newHeaders
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
    }

    // 首页返回
    if (path === '/' || path === '/index.html') {
      return new Response('PaperHub API - 请访问 /api/* 获取数据', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 默认 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};