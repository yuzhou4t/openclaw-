/**
 * 论文 API
 * 使用统一 source service 聚合六大分类论文
 */

const { getUnifiedPapers, CATEGORIES } = require('../lib/sourceService');

// 缓存合并后的论文数据
let mergedPapersCache = null;
let mergedStatusesCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

/**
 * 获取合并后的论文数据
 */
async function getMergedPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && mergedPapersCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return {
      papers: mergedPapersCache,
      sourceStatuses: mergedStatusesCache || {}
    };
  }

  const unified = await getUnifiedPapers({
    categories: CATEGORIES,
    perSourceLimit: 6,
    forceRefresh
  });

  mergedPapersCache = unified.papers || [];
  mergedStatusesCache = unified.sourceStatuses || {};
  lastFetchTime = now;
  console.log(`[Papers] Merged ${mergedPapersCache.length} papers from unified sources`);

  return {
    papers: mergedPapersCache,
    sourceStatuses: mergedStatusesCache
  };
}

module.exports = async (req, res) => {
  const { category, keyword, sourceId, sourceStatus, page = 1, limit = 100, refresh = '0' } = req.query;

  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // /api/papers - 获取论文列表
  if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'papers')) {
    const forceRefresh = refresh === '1' || refresh === 'true';
    const { papers: allPapers, sourceStatuses } = await getMergedPapers(forceRefresh);
    let filtered = [...allPapers];

    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (sourceId) {
      filtered = filtered.filter(p => p.sourceId === sourceId);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.abstract || '').toLowerCase().includes(kw) ||
        (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw)))
      );
    }

    if (sourceStatus) {
      const allowedIds = Object.values(sourceStatuses)
        .filter(s => s.status === sourceStatus)
        .map(s => s.sourceId);
      filtered = filtered.filter(p => allowedIds.includes(p.sourceId));
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
      totalPages: Math.ceil(filtered.length / currentLimit),
      sourceStatuses
    });
  }

  // /api/papers/hot - 获取热门论文
  if (pathParts.includes('hot')) {
    const { papers: allPapers } = await getMergedPapers();
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

    const { papers: allPapers } = await getMergedPapers();
    const results = allPapers.filter(p =>
      (p.title || '').toLowerCase().includes(kw) ||
      (p.abstract || '').toLowerCase().includes(kw) ||
      (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw))) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(kw)))
    );

    return res.status(200).json({ papers: results, total: results.length });
  }

  // /api/papers/:id - 获取单个论文详情
  if (pathParts.length === 2 && !pathParts.includes('hot') && !pathParts.includes('search')) {
    const id = pathParts[1];
    const { papers: allPapers } = await getMergedPapers();
    const paper = allPapers.find(p => p.id === id);
    if (paper) {
      return res.status(200).json(paper);
    }
    return res.status(404).json({ error: 'Paper not found' });
  }

  res.status(404).json({ error: 'Not found' });
};
