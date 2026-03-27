/**
 * 每日推送 API
 * 从 arXiv 自动获取最新论文
 * 每周二、周五、周日上午8点推送5篇不同分类的论文
 */

const arxiv = require('./arxiv');

// OpenAlex API 相关
const axios = require('axios');
const OPENALEX_API = 'https://api.openalex.org/works';

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

// 获取OpenAlex论文（带分类）
async function fetchOpenAlexPapers(days = 3) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const fromDate = startDate.toISOString().split('T')[0];

  const queries = [
    'catastrophe insurance OR climate risk insurance OR reinsurance',
    'agricultural insurance OR crop insurance',
    'financial inclusion OR rural finance OR microfinance'
  ];

  try {
    const results = [];
    for (const query of queries) {
      const url = `${OPENALEX_API}?search=${encodeURIComponent(query)}&filter=publication_date:>${fromDate}&per-page=5&sort=publication_date:desc`;
      const response = await axios.get(url, { timeout: 8000 });
      if (response.data && response.data.results) {
        results.push(...response.data.results.map(w => ({
          id: String(w.id).split('/').pop(),
          title: w.title || 'Untitled',
          authors: (w.authorships || []).map(a => a.author.display_name).slice(0, 5),
          source: w.source?.display_name || 'OpenAlex',
          date: w.publication_date || '',
          abstract: w.abstract || '',
          category: guessCategory(w.title || '', w.abstract || ''),
          subcategory: '其他',
          tags: (w.topics || []).slice(0, 3).map(t => t.display_name),
          citations: w.citation_count || 0,
          pdfUrl: null,
          url: w.doi || `https://openalex.org/${w.id}`
        })));
      }
    }
    return results;
  } catch (e) {
    console.log('[OpenAlex] Error:', e.message);
    return [];
  }
}

// 根据标题/摘要猜测分类
function guessCategory(title, abstract) {
  const content = (title + ' ' + abstract).toLowerCase();
  if (content.includes('insurance') || content.includes('reinsurance') || content.includes('catastrophe')) {
    return content.includes('agricultural') || content.includes('crop') ? '农业保险' : '巨灾保险';
  }
  if (content.includes('financial inclusion') || content.includes('rural finance') || content.includes('microfinance')) {
    return '普惠金融';
  }
  return '巨灾保险';
}

// 合并论文数据
async function getAllPapersForPush() {
  // 始终包含DEFAULT_PAPERS作为基础
  const defaultPapers = arxiv.getDefaultPapers();
  const allMap = new Map();
  defaultPapers.forEach(p => allMap.set(p.id, p));

  // 获取arXiv论文（只有成功时才合并），每类最多2篇
  let arxivPapers = await withTimeout(8000, () => arxiv.getCachedPapers());
  if (arxivPapers && arxivPapers.length > 0) {
    const categoryCount = {};
    arxivPapers.forEach(p => {
      if (!allMap.has(p.id)) {
        const cat = p.category || '其他';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        if (categoryCount[cat] <= 2) {
          allMap.set(p.id, p);
        }
      }
    });
  }

  // 获取OpenAlex论文
  let openalexPapers = await withTimeout(8000, () => fetchOpenAlexPapers(3));
  if (openalexPapers && openalexPapers.length > 0) {
    openalexPapers.forEach(p => {
      if (!allMap.has(p.id)) allMap.set(p.id, p);
    });
  }

  return Array.from(allMap.values());
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
    const allPapers = await getAllPapersForPush();

    // 筛选最近3天发表的论文
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    const recentPapers = allPapers.filter(p => p.date && p.date >= threeDaysAgoStr && p.date <= todayStr);

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
      date: todayStr,
      hasNewPapers: hasNewPapers,
      message: hasNewPapers ? '' : '暂无'
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();

    // 获取所有来源的论文
    const allPapers = await getAllPapersForPush();

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
      const dayStartStr = dayStart.toISOString().split('T')[0];
      const dayEndStr = dayEnd.toISOString().split('T')[0];

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
