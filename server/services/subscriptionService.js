/**
 * 订阅服务
 */
const { Subscription, User, Paper } = require('../models');

// 获取用户订阅
async function getUserSubscriptions(userId) {
  return await Subscription.findAll({
    where: { userId },
    order: [['type', 'ASC'], ['target', 'ASC']]
  });
}

// 添加订阅
async function addSubscription(userId, type, target) {
  // type: 'category' | 'keyword' | 'author'

  const [subscription, created] = await Subscription.findOrCreate({
    where: { userId, type, target }
  });

  return { subscription, isNew: created };
}

// 删除订阅
async function removeSubscription(userId, type, target) {
  const result = await Subscription.destroy({
    where: { userId, type, target }
  });

  return result > 0;
}

// 获取用户订阅领域的新论文
async function getNewPapersForUser(userId, sinceDate) {
  const subscriptions = await Subscription.findAll({
    where: { userId }
  });

  if (subscriptions.length === 0) {
    return [];
  }

  const categorySubs = subscriptions.filter(s => s.type === 'category');
  const keywordSubs = subscriptions.filter(s => s.type === 'keyword');
  const authorSubs = subscriptions.filter(s => s.type === 'author');

  const papers = await Paper.findAll({
    where: {
      publishDate: { [require('sequelize').Op.gte]: sinceDate },
      [require('sequelize').Op.or]: [
        { category: categorySubs.map(s => s.target) },
        ...(keywordSubs.length > 0 ? [{
          [require('sequelize').Op.or]: keywordSubs.map(s => ({
            title: { [require('sequelize').Op.iLike]: `%${s.target}%` }
          }))
        }] : [])
      ]
    },
    order: [['publishDate', 'DESC']],
    limit: 20
  });

  return papers;
}

module.exports = {
  getUserSubscriptions,
  addSubscription,
  removeSubscription,
  getNewPapersForUser
};
