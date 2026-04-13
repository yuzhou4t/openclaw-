/**
 * 论文 API
 * 使用 OpenAlex API 获取六大分类的精选论文
 * 计量经济学、金融机器学习、行为金融、巨灾保险、农业保险、普惠金融
 */

const openalex = require('./openalex');

// 缓存合并后的论文数据
let mergedPapersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

/**
 * 获取合并后的论文数据
 */
async function getMergedPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && mergedPapersCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return mergedPapersCache;
  }

  console.log('[Papers] Fetching papers from OpenAlex...');

  const categories = ['计量经济学', '金融机器学习', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
  let allPapers = [];

  // 计算上周日期范围
  const today = new Date();
  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(today.getDate() - today.getDay() - 6); // 上周日
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // 上周一
  const dateFrom = lastWeekStart.toISOString().split('T')[0];
  const dateTo = lastWeekEnd.toISOString().split('T')[0];
  console.log(`[Papers] Fetching for date range: ${dateFrom} to ${dateTo}`);

  // 并行获取各分类论文
  const results = await Promise.all(
    categories.map(cat =>
      openalex.getPapersByTopic(cat, 8, { dateFrom, dateTo }).catch(e => {
        console.log(`[Papers] ${cat} error:`, e.message);
        return [];
      })
    )
  );

  // 合并所有论文
  results.forEach((papers, idx) => {
    if (papers && papers.length > 0) {
      allPapers.push(...papers);
    }
  });

  // 过滤掉未来日期的论文（双重保险）
  const todayStr = today.getUTCFullYear() + '-' +
    String(today.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(today.getUTCDate()).padStart(2, '0');
  allPapers = allPapers.filter(p => p.date && p.date <= todayStr);

  // 按日期排序
  allPapers.sort((a, b) => new Date(b.date) - new Date(a.date));

  mergedPapersCache = allPapers;
  lastFetchTime = now;
  console.log(`[Papers] Merged ${mergedPapersCache.length} papers`);

  return mergedPapersCache;
}

module.exports = async (req, res) => {
  const { category, keyword, page = 1, limit = 100 } = req.query;

  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // /api/papers - 获取论文列表
  if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'papers')) {
    const allPapers = await getMergedPapers();
    let filtered = [...allPapers];

    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.abstract.toLowerCase().includes(kw) ||
        (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw)))
      );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const currentPage = parseInt(page);
    const currentLimit = parseInt(limit);
    const start = (currentPage - 1) * currentLimit;
    const end = start + currentLimit;
    const papers = filtered.slice(start, end);

    return res.status(200).json({
      papers,
      total: filtered.length,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(filtered.length / currentLimit)
    });
  }

  // /api/papers/hot - 获取热门论文
  if (pathParts.includes('hot')) {
    const allPapers = await getMergedPapers();
    const hotPapers = [...allPapers]
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 10);
    return res.status(200).json(hotPapers);
  }

  // /api/papers/search/:query - 搜索论文
  if (pathParts.includes('search')) {
    const queryIndex = pathParts.indexOf('search');
    const query = decodeURIComponent(pathParts[queryIndex + 1] || '');
    const kw = query.toLowerCase();

    const allPapers = await getMergedPapers();
    const results = allPapers.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.abstract.toLowerCase().includes(kw) ||
      (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw))) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(kw)))
    );

    return res.status(200).json({ papers: results, total: results.length });
  }

  // /api/papers/:id - 获取单个论文详情
  if (pathParts.length === 2 && !pathParts.includes('hot') && !pathParts.includes('search')) {
    const id = pathParts[1];
    const allPapers = await getMergedPapers();
    const paper = allPapers.find(p => p.id === id);
    if (paper) {
      return res.status(200).json(paper);
    }
    return res.status(404).json({ error: 'Paper not found' });
  }

  res.status(404).json({ error: 'Not found' });
};
