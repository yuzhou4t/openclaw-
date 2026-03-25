/**
 * API 路由
 */
const express = require('express');
const router = express.Router();

// 导入控制器
const paperController = require('../services/paperService');
const userController = require('../services/userService');
const subscriptionController = require('../services/subscriptionService');
const pushController = require('../services/pushService');

// =========================================
// 论文相关 API
// =========================================

// 获取论文列表
router.get('/papers', async (req, res, next) => {
  try {
    const {
      category,
      subcategory,
      keyword,
      page = 1,
      limit = 20,
      sort = 'latest'
    } = req.query;

    const result = await paperController.getPapers({
      category,
      subcategory,
      keyword,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 获取论文详情
router.get('/papers/:id', async (req, res, next) => {
  try {
    const paper = await paperController.getPaperById(req.params.id);

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(paper);
  } catch (error) {
    next(error);
  }
});

// 搜索论文
router.get('/papers/search/:query', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await paperController.searchPapers(
      req.params.query,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 获取每日推送
router.get('/push/daily', async (req, res, next) => {
  try {
    const { userId } = req.query;
    const pushPapers = await pushController.getDailyPush(userId);
    res.json(pushPapers);
  } catch (error) {
    next(error);
  }
});

// 获取热门论文
router.get('/papers/hot/:category?', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const papers = await paperController.getHotPapers(
      req.params.category,
      parseInt(limit)
    );
    res.json(papers);
  } catch (error) {
    next(error);
  }
});

// 获取标签列表
router.get('/tags', async (req, res, next) => {
  try {
    const { category, limit = 50 } = req.query;
    const tags = await paperController.getTags(category, parseInt(limit));
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// =========================================
// 用户相关 API
// =========================================

// 用户注册
router.post('/auth/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await userController.register({ username, email, password });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userController.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 获取用户信息
router.get('/user/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await userController.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 更新用户信息
router.put('/user/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await userController.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// =========================================
// 收藏相关 API
// =========================================

// 获取收藏列表
router.get('/user/favorites', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const favorites = await userController.getFavorites(
      req.user.id,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

// 添加收藏
router.post('/user/favorites', requireAuth, async (req, res, next) => {
  try {
    const { paperId } = req.body;
    const result = await userController.addFavorite(req.user.id, paperId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// 删除收藏
router.delete('/user/favorites/:paperId', requireAuth, async (req, res, next) => {
  try {
    await userController.removeFavorite(req.user.id, req.params.paperId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// =========================================
// 阅读清单 API
// =========================================

// 获取阅读清单
router.get('/user/reading-list', requireAuth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const list = await userController.getReadingList(
      req.user.id,
      status,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// 添加到阅读清单
router.post('/user/reading-list', requireAuth, async (req, res, next) => {
  try {
    const { paperId, status = 'unread' } = req.body;
    const result = await userController.addToReadingList(
      req.user.id,
      paperId,
      status
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// 更新阅读状态
router.put('/user/reading-list/:paperId', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await userController.updateReadingStatus(
      req.user.id,
      req.params.paperId,
      status
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// =========================================
// 订阅相关 API
// =========================================

// 获取订阅列表
router.get('/user/subscriptions', requireAuth, async (req, res, next) => {
  try {
    const subscriptions = await subscriptionController.getUserSubscriptions(
      req.user.id
    );
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
});

// 添加订阅
router.post('/user/subscriptions', requireAuth, async (req, res, next) => {
  try {
    const { type, target } = req.body;
    const result = await subscriptionController.addSubscription(
      req.user.id,
      type,
      target
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// 删除订阅
router.delete('/user/subscriptions', requireAuth, async (req, res, next) => {
  try {
    const { type, target } = req.body;
    await subscriptionController.removeSubscription(
      req.user.id,
      type,
      target
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// =========================================
// 分类相关 API
// =========================================

// 获取所有分类
router.get('/categories', (req, res) => {
  res.json(require('../data/categories'));
});

// 获取子分类
router.get('/categories/:id/subcategories', (req, res) => {
  const categories = require('../data/categories');
  const category = categories.find(c => c.id === req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category.subcategories);
});

// =========================================
// 中间件
// =========================================

// 简单认证中间件（实际使用需要更完善的实现）
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 验证 token（实际实现需要 JWT 验证）
  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = router;
