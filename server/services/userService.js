/**
 * 用户服务
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Favorite, ReadingList, Paper, Subscription } = require('../models');

// 注册用户
async function register({ username, email, password }) {
  // 检查是否已存在
  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);

  // 创建用户
  const user = await User.create({
    username,
    email,
    passwordHash
  });

  // 生成 token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl
    },
    token
  };
}

// 登录
async function login(email, password) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 更新最后登录时间
  await user.update({ lastLogin: new Date() });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl
    },
    token
  };
}

// 生成 JWT Token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// 获取用户资料
async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'avatarUrl', 'role', 'createdAt', 'lastLogin']
  });

  if (!user) return null;

  // 获取统计
  const favoritesCount = await Favorite.count({ where: { userId } });
  const readingListCount = await ReadingList.count({ where: { userId } });
  const subscriptionsCount = await Subscription.count({ where: { userId } });

  return {
    ...user.toJSON(),
    stats: {
      favorites: favoritesCount,
      readingList: readingListCount,
      subscriptions: subscriptionsCount
    }
  };
}

// 更新用户资料
async function updateProfile(userId, data) {
  const user = await User.findByPk(userId);

  if (!user) return null;

  const allowedFields = ['username', 'avatarUrl'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  await user.update(updateData);

  return user;
}

// 获取收藏列表
async function getFavorites(userId, { page, limit }) {
  const { count, rows } = await Favorite.findAndCountAll({
    where: { userId },
    include: [{
      model: Paper,
      through: { attributes: [] }
    }],
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']]
  });

  return {
    favorites: rows.map(r => r.Paper),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// 添加收藏
async function addFavorite(userId, paperId) {
  // 检查论文是否存在
  const paper = await Paper.findByPk(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  const [favorite, created] = await Favorite.findOrCreate({
    where: { userId, paperId }
  });

  return { favorite, isNew: created };
}

// 删除收藏
async function removeFavorite(userId, paperId) {
  const result = await Favorite.destroy({
    where: { userId, paperId }
  });

  return result > 0;
}

// 获取阅读清单
async function getReadingList(userId, status, { page, limit }) {
  const where = { userId };
  if (status) {
    where.status = status;
  }

  const { count, rows } = await ReadingList.findAndCountAll({
    where,
    include: [{
      model: Paper,
      through: { attributes: [] }
    }],
    limit,
    offset: (page - 1) * limit,
    order: [['updatedAt', 'DESC']]
  });

  return {
    readingList: rows.map(r => ({
      ...r.Paper.toJSON(),
      readingStatus: r.status,
      notes: r.notes,
      addedAt: r.createdAt
    })),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// 添加到阅读清单
async function addToReadingList(userId, paperId, status) {
  const paper = await Paper.findByPk(paperId);
  if (!paper) {
    throw new Error('Paper not found');
  }

  const [item, created] = await ReadingList.findOrCreate({
    where: { userId, paperId },
    defaults: { status }
  });

  if (!created && status) {
    await item.update({ status });
  }

  return { item, isNew: created };
}

// 更新阅读状态
async function updateReadingStatus(userId, paperId, status) {
  const item = await ReadingList.findOne({
    where: { userId, paperId }
  });

  if (!item) {
    throw new Error('Item not found in reading list');
  }

  await item.update({ status });
  return item;
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getFavorites,
  addFavorite,
  removeFavorite,
  getReadingList,
  addToReadingList,
  updateReadingStatus
};
