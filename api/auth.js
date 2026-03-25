/**
 * 认证 API (模拟)
 */
module.exports = (req, res) => {
  const method = req.method;
  const pathParts = req.url.split('/').filter(p => p);

  // /api/auth/login - 登录
  if (pathParts.includes('login')) {
    if (method === 'POST') {
      // 模拟登录成功
      return res.status(200).json({
        success: true,
        token: 'mock-jwt-token-123456',
        user: {
          id: '1',
          username: 'demo',
          email: 'demo@paperhub.com'
        }
      });
    }
  }

  // /api/auth/register - 注册
  if (pathParts.includes('register')) {
    if (method === 'POST') {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });
    }
  }

  res.status(404).json({ error: 'Not found' });
};