/**
 * 用户 API (模拟)
 */
module.exports = (req, res) => {
  const method = req.method;
  const authHeader = req.headers.authorization;
  const pathParts = req.url.split('/').filter(p => p);

  // 简单的模拟认证检查
  const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');

  // /api/user/profile - 获取用户信息
  if (pathParts.includes('profile')) {
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({
      id: '1',
      username: 'demo',
      email: 'demo@paperhub.com',
      favoritesCount: 12,
      readingListCount: 5,
      subscriptionsCount: 3
    });
  }

  // /api/user/favorites - 获取收藏列表
  if (pathParts.includes('favorites')) {
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({
      papers: [],
      total: 0
    });
  }

  res.status(404).json({ error: 'Not found' });
};