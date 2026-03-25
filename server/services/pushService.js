/**
 * 每日推送服务
 */
const { Paper, Subscription, User, DailyPush } = require('../models');
const config = require('../config');

// 推送配置
const PUSH_CONFIG = {
  dailyCount: 5,
  weights: {
    subscribed: 0.3,
    popular: 0.3,
    random: 0.2,
    classic: 0.2
  }
};

// 获取每日推送
async function getDailyPush(userId) {
  const today = new Date().toISOString().split('T')[0];

  // 检查是否已有今日推送
  const existingPush = await DailyPush.findOne({
    where: { pushDate: today }
  });

  if (existingPush) {
    // 获取论文详情
    const paperIds = existingPush.papers;
    const papers = await Paper.findAll({
      where: { id: paperIds }
    });
    return papers;
  }

  // 生成新推送
  return await generateDailyPush(userId);
}

// 生成每日推送
async function generateDailyPush(userId) {
  const { dailyCount, weights } = PUSH_CONFIG;

  let userSubscriptions = new Set();
  if (userId) {
    const subs = await Subscription.findAll({
      where: { userId, type: 'category' }
    });
    userSubscriptions = new Set(subs.map(s => s.target));
  }

  // 获取所有论文
  const allPapers = await Paper.findAll({
    order: [['publishDate', 'DESC']],
    limit: 100
  });

  if (allPapers.length === 0) {
    return [];
  }

  const pushPapers = [];

  // 1. 用户订阅领域的最新论文 (30%)
  const subscribedPapers = allPapers.filter(p =>
    userSubscriptions.size === 0 || userSubscriptions.has(p.category)
  );
  const subLatest = subscribedPapers
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
    .slice(0, Math.ceil(dailyCount * weights.subscribed));
  pushPapers.push(...subLatest);

  // 2. 全局热门论文 (30%)
  const popularPapers = [...allPapers]
    .sort((a, b) => b.citations - a.citations)
    .filter(p => !pushPapers.includes(p))
    .slice(0, Math.ceil(dailyCount * weights.popular));
  pushPapers.push(...popularPapers);

  // 3. 随机推荐 (20%)
  const remaining = allPapers.filter(p => !pushPapers.includes(p));
  const shuffled = remaining.sort(() => Math.random() - 0.5);
  const randomPapers = shuffled.slice(0, Math.ceil(dailyCount * weights.random));
  pushPapers.push(...randomPapers);

  // 4. 经典必读 (20%)
  const classicPapers = [...allPapers]
    .sort((a, b) => b.citations - a.citations)
    .filter(p => !pushPapers.includes(p))
    .slice(0, dailyCount - pushPapers.length);
  pushPapers.push(...classicPapers);

  // 保存到数据库
  const finalPapers = pushPapers.slice(0, dailyCount);
  const today = new Date().toISOString().split('T')[0];

  await DailyPush.findOrCreate({
    where: { pushDate: today },
    defaults: {
      papers: finalPapers.map(p => p.id)
    }
  });

  return finalPapers;
}

// 发送邮件推送
async function sendEmailPush(userId) {
  const user = await User.findByPk(userId);
  if (!user || !user.email) return;

  const papers = await getDailyPush(userId);
  if (papers.length === 0) return;

  // 发送邮件（实际实现需要配置邮件服务）
  console.log(`📧 发送邮件给 ${user.email}: ${papers.length} 篇论文`);

  // const mailContent = generateEmailContent(user.username, papers);
  // await sendMail(user.email, '今日论文推送', mailContent);
}

// 获取推送历史
async function getPushHistory(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await DailyPush.findAll({
    where: {
      pushDate: { [require('sequelize').Op.gte]: startDate.toISOString().split('T')[0] }
    },
    order: [['pushDate', 'DESC']]
  });
}

module.exports = {
  getDailyPush,
  generateDailyPush,
  sendEmailPush,
  getPushHistory
};
