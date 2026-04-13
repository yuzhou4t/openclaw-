/**
 * 论文服务
 * 直接从 OpenAlex 和 Firecrawl 获取论文，不使用本地数据库
 */
const openalex = require('../../api/openalex');
const { searchPapers: firecrawlSearch } = require('../../lib/firecrawl');

// 缓存
let cachedPapers = null;
let lastFetchTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

const CATEGORIES = ['计量经济学', '金融机器学习', '行为金融', '巨灾保险', '农业保险', '普惠金融'];

// 获取论文列表
async function getPapers({ category, subcategory, keyword, page, limit, sort }) {
  const allPapers = await getAllPapers();

  let filtered = [...allPapers];

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (subcategory) {
    filtered = filtered.filter(p => p.subcategory === subcategory);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      (p.abstract && p.abstract.toLowerCase().includes(kw)) ||
      (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw)))
    );
  }

  // 排序
  if (sort === 'cited') {
    filtered.sort((a, b) => (b.citations || 0) - (a.citations || 0));
  } else {
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const papers = filtered.slice(start, end);

  return {
    papers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// 获取所有论文（从 OpenAlex + Firecrawl）
async function getAllPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedPapers && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedPapers;
  }

  console.log('[PaperService] Fetching papers from OpenAlex + Firecrawl...');

  // 计算上周日期范围
  const today = new Date();
  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(today.getDate() - today.getDay() - 6);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
  const dateFrom = lastWeekStart.toISOString().split('T')[0];
  const dateTo = lastWeekEnd.toISOString().split('T')[0];

  let allPapers = [];

  for (const cat of CATEGORIES) {
    try {
      const oaPapers = await openalex.getPapersByTopic(cat, 5, { dateFrom, dateTo });
      const fcPapers = await firecrawlSearch(cat, 3, { dateFrom, dateTo });
      allPapers.push(...oaPapers, ...fcPapers);
      console.log(`[PaperService] ${cat}: OA=${oaPapers.length}, FC=${fcPapers.length}`);
    } catch (e) {
      console.log(`[PaperService] ${cat} error:`, e.message);
    }
  }

  // 过滤未来日期
  const todayStr = today.toISOString().split('T')[0];
  allPapers = allPapers.filter(p => !p.date || p.date <= todayStr);

  // 按日期排序
  allPapers.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  cachedPapers = allPapers;
  lastFetchTime = now;
  console.log(`[PaperService] Total: ${cachedPapers.length} papers`);

  return cachedPapers;
}

// 获取论文详情
async function getPaperById(id) {
  const allPapers = await getAllPapers();
  const paper = allPapers.find(p => p.id == id);
  if (!paper) return null;

  // 获取相关论文
  const relatedPapers = allPapers
    .filter(p => p.id != id && p.category === paper.category)
    .slice(0, 5);

  return { ...paper, relatedPapers };
}

// 搜索论文
async function searchPapers(query, { page, limit }) {
  return getPapers({ keyword: query, page, limit, sort: 'latest' });
}

// 获取热门论文
async function getHotPapers(category, limit = 10) {
  const allPapers = await getAllPapers();
  let filtered = [...allPapers];

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  return filtered
    .sort((a, b) => (b.citations || 0) - (a.citations || 0))
    .slice(0, limit);
}

// 获取标签列表
async function getTags(category, limit = 50) {
  const allPapers = await getAllPapers();
  const tagCount = {};

  allPapers.forEach(p => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach(tag => {
        if (!category || p.category === category) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// 获取论文统计
async function getPaperStats() {
  const allPapers = await getAllPapers();
  const byCategory = {};

  allPapers.forEach(p => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  });

  return {
    total: allPapers.length,
    byCategory,
    recentPapers: allPapers.slice(0, 10)
  };
}

// 以下方法暂不支持（需要数据库）
async function addPaper() { return null; }
async function updatePaper() { return null; }
async function deletePaper() { return false; }

module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  getHotPapers,
  getTags,
  getPaperStats,
  addPaper,
  updatePaper,
  deletePaper
};
