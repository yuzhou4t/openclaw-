/**
 * 每日推送 API
 * 从 arXiv 自动获取最新论文
 * 每周二、周五、周日上午8点推送5篇不同分类的论文
 */

const arxiv = require('./arxiv');

// 超时包装
const withTimeout = (ms, fn) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]).catch(() => null);
};

// 推送日：周二(2)、周五(5)、周日(0)
const PUSH_DAYS = [0, 2, 5];
const PAPER_COUNT = 5; // 推送5篇不同分类的论文

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

    // 从 arXiv 获取论文，带超时控制
    let allPapers = await withTimeout(8000, () => arxiv.getCachedPapers());
    if (!allPapers || allPapers.length === 0) {
      allPapers = arxiv.getDefaultPapers();
    }

    // 筛选最近3天发表的论文
    const recentPapers = arxiv.filterRecentPapers(allPapers, 3);

    // 按日期排序，最新的在前
    recentPapers.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 获取5篇不同分类的论文
    const categories = ['大模型', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
    const selectedPapers = [];
    const usedCategories = new Set();

    for (const paper of recentPapers) {
      if (selectedPapers.length >= PAPER_COUNT) break;
      const cat = paper.category || categories.find(c => !usedCategories.has(c));
      if (cat && !usedCategories.has(cat)) {
        selectedPapers.push(paper);
        usedCategories.add(cat);
      }
    }

    // 如果论文不够5篇，从其他论文补充
    if (selectedPapers.length < PAPER_COUNT) {
      for (const paper of recentPapers) {
        if (selectedPapers.length >= PAPER_COUNT) break;
        if (!selectedPapers.find(p => p.id === paper.id)) {
          selectedPapers.push(paper);
        }
      }
    }

    const hasNewPapers = selectedPapers.length > 0;

    return res.status(200).json({
      papers: selectedPapers,
      date: today.toISOString().split('T')[0],
      hasNewPapers: hasNewPapers,
      message: hasNewPapers ? '' : '暂无'
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();

    // 从 arXiv 获取论文，带超时控制
    let allPapers = await withTimeout(8000, () => arxiv.getCachedPapers());
    if (!allPapers || allPapers.length === 0) {
      allPapers = arxiv.getDefaultPapers();
    }

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

      // 计算该日期范围内（往前3天）的论文
      const dayStart = new Date(date);
      dayStart.setDate(dayStart.getDate() - 3);
      const dayEnd = new Date(date);

      const recentPapers = (allPapers || []).filter(paper => {
        const paperDate = new Date(paper.date);
        return paperDate >= dayStart && paperDate <= dayEnd;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      // 获取5篇不同分类的论文
      const categories = ['大模型', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
      const selectedPapers = [];
      const usedCategories = new Set();

      for (const paper of recentPapers) {
        if (selectedPapers.length >= PAPER_COUNT) break;
        const cat = paper.category;
        if (cat && !usedCategories.has(cat)) {
          selectedPapers.push(paper);
          usedCategories.add(cat);
        }
      }

      // 如果论文不够5篇，从其他论文补充
      if (selectedPapers.length < PAPER_COUNT) {
        for (const paper of recentPapers) {
          if (selectedPapers.length >= PAPER_COUNT) break;
          if (!selectedPapers.find(p => p.id === paper.id)) {
            selectedPapers.push(paper);
          }
        }
      }

      history.push({
        date: dateStr,
        papers: selectedPapers,
        hasNewPapers: selectedPapers.length > 0,
        message: selectedPapers.length > 0 ? '' : '暂无'
      });
    }

    return res.status(200).json({
      history: history,
      total: history.length
    });
  }

  res.status(404).json({ error: 'Not found' });
};
