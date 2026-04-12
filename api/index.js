/**
 * PaperHub API 入口 (Vercel Serverless)
 */
module.exports = (req, res) => {
  const path = req.url.replace(/^\/api\//, '').replace(/^\/api$/, '');

  // 设置 CORS 和 JSON 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 路由处理
  const [endpoint, ...rest] = path.split('/');

  // 路由映射
  const routes = {
    'papers': require('./papers'),
    'push': require('./push'),
    'tags': require('./tags'),
    'categories': require('./categories'),
    'auth': require('./auth'),
    'user': require('./user')
  };

  if (routes[endpoint]) {
    return routes[endpoint](req, res, rest);
  }

  // 默认路由 - 返回 API 信息
  res.status(200).json({
    name: 'PaperHub API',
    version: '1.0.0',
    endpoints: {
      papers: '/api/papers',
      search: '/api/papers/search/:query',
      hot: '/api/papers/hot',
      daily: '/api/push/daily',
      tags: '/api/tags',
      categories: '/api/categories',
      auth: '/api/auth/login'
    }
  });
};