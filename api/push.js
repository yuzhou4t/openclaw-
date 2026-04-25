/**
 * 每日推送 API
 * 从统一 source service 获取精选论文
 * 每周二、周五推送
 */

const { selectTopPapers } = require('../lib/scorer');
const { getUnifiedPapers, CATEGORIES } = require('../lib/sourceService');

// 超时包装
const withTimeout = (ms, fn) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]).catch(() => null);
};

// 推送日：周二(2)、周五(5)
const PUSH_DAYS = [2, 5];

// 合并论文数据
async function getAllPapersForPush() {
  let allPapers = [];
  let sourceStatuses = {};

  const unified = await withTimeout(15000, () => getUnifiedPapers({
    categories: CATEGORIES,
    perSourceLimit: 5
  }));

  if (unified && Array.isArray(unified.papers)) {
    allPapers = unified.papers;
    sourceStatuses = unified.sourceStatuses || {};
  }

  // 去重（标题 + DOI + URL），避免仅凭标题前缀误删不同论文
  const seen = new Set();
  allPapers = allPapers.filter(p => {
    if (!p.title) return false;
    const title = String(p.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const doi = String(p.doi || '').toLowerCase().trim();
    const url = String(p.url || '').toLowerCase().trim();
    const key = `${title}|${doi}|${url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { allPapers, sourceStatuses };
}

function selectPushPapers(candidates) {
  const byCategory = CATEGORIES.flatMap(category => selectTopPapers(candidates, category, 3));
  const uniq = new Map();
  byCategory.forEach(paper => {
    const title = String(paper.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const doi = String(paper.doi || '').toLowerCase().trim();
    const url = String(paper.url || '').toLowerCase().trim();
    const key = `${title}|${doi}|${url}`;
    if (!uniq.has(key)) {
      uniq.set(key, paper);
    }
  });
  return Array.from(uniq.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = async (req, res) => {
  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // /api/push/daily - 获取今日推送
  if (pathParts.includes('daily')) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const isPushDay = PUSH_DAYS.includes(dayOfWeek);

    if (!isPushDay) {
      return res.status(200).json({
        papers: [],
        date: today.toISOString().split('T')[0],
        hasNewPapers: false,
        message: '今日无推送'
      });
    }

    // 获取所有来源的论文
    const { allPapers, sourceStatuses } = await getAllPapersForPush();

    // 筛选最近2天发表的论文
    const todayStr = today.toISOString().split('T')[0];
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const recentPapers = allPapers.filter(p => p.date && p.date >= twoDaysAgoStr && p.date <= todayStr);

    // 按日期排序，最新的在前
    recentPapers.sort((a, b) => new Date(b.date) - new Date(a.date));
    const selected = selectPushPapers(recentPapers);

    const hasNewPapers = selected.length > 0;

    return res.status(200).json({
      papers: selected,
      date: todayStr,
      hasNewPapers: hasNewPapers,
      message: hasNewPapers ? '' : '暂无',
      sourceStatuses
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();

    // 获取所有来源的论文
    const { allPapers, sourceStatuses } = await getAllPapersForPush();

    // 生成过去7天的推送记录
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isPushDay = PUSH_DAYS.includes(dayOfWeek);

      if (!isPushDay) {
        history.push({
          date: dateStr,
          papers: [],
          hasNewPapers: false,
          message: '今日无推送'
        });
        continue;
      }

      // 计算该日期范围内（往前2天）的论文
      const dayStart = new Date(date);
      dayStart.setDate(dayStart.getDate() - 2);
      const dayEnd = new Date(date);
      const dayStartStr = dayStart.toISOString().split('T')[0];
      const dayEndStr = dayEnd.toISOString().split('T')[0];

      const recentPapers = (allPapers || []).filter(paper => {
        const paperDate = new Date(paper.date);
        return paperDate >= dayStart && paperDate <= dayEnd;
      });
      const selected = selectPushPapers(recentPapers);

      history.push({
        date: dateStr,
        papers: selected,
        hasNewPapers: selected.length > 0,
        message: selected.length > 0 ? '' : '暂无'
      });
    }

    return res.status(200).json({
      history: history,
      total: history.length,
      sourceStatuses
    });
  }

  res.status(404).json({ error: 'Not found' });
};
