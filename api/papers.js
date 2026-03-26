/**
 * 论文 API
 * 从 arXiv、OpenAlex、DOAJ 获取最新论文
 */

const arxiv = require('./arxiv');
const openalex = require('./openalex');
const doaj = require('./doaj');

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

  console.log('[Papers] Fetching papers from all sources...');

  // 并行获取所有数据源，带超时控制
  const timeout = (ms, promise) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]).catch(e => {
      console.log('[Papers] Source timeout or error:', e.message);
      return [];
    });
  };

  let arxivPapers = [];
  let openalexPapers = [];
  let doajPapers = [];

  try {
    [arxivPapers, openalexPapers, doajPapers] = await Promise.all([
      timeout(8000, arxiv.getCachedPapers().catch(() => [])),
      timeout(8000, getOpenAlexPapers().catch(() => [])),
      timeout(8000, getDOAJPapers().catch(() => []))
    ]);
  } catch (e) {
    console.log('[Papers] Error fetching papers, using fallback');
  }

  // 如果所有数据源都失败，使用 DEFAULT_PAPERS
  if (arxivPapers.length === 0 && openalexPapers.length === 0 && doajPapers.length === 0) {
    console.log('[Papers] All sources failed, using DEFAULT_PAPERS');
    arxivPapers = arxiv.getDefaultPapers();
  }

  // 合并去重（按 ID）
  const allPapersMap = new Map();

  // 先添加 arXiv 论文
  arxivPapers.forEach(p => allPapersMap.set(p.id, p));

  // 添加 OpenAlex 论文（不覆盖已有的）
  openalexPapers.forEach(p => {
    if (!allPapersMap.has(p.id)) {
      allPapersMap.set(p.id, p);
    }
  });

  // 添加 DOAJ 论文（不覆盖已有的）
  doajPapers.forEach(p => {
    if (!allPapersMap.has(p.id)) {
      allPapersMap.set(p.id, p);
    }
  });

  mergedPapersCache = Array.from(allPapersMap.values());
  lastFetchTime = now;

  console.log(`[Papers] Merged ${mergedPapersCache.length} papers (arXiv: ${arxivPapers.length}, OpenAlex: ${openalexPapers.length}, DOAJ: ${doajPapers.length})`);

  return mergedPapersCache;
}

/**
 * 从 OpenAlex 获取论文
 */
async function getOpenAlexPapers() {
  const categories = ['大模型', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
  const results = [];

  // 每个分类获取几篇
  const papersPerCategory = 5;

  const promises = categories.map(async (cat) => {
    const works = await openalex.getPapersByTopic(cat, papersPerCategory);
    return works.map(w => openalex.transformPaper(w));
  });

  const resolved = await Promise.all(promises);
  resolved.forEach(papers => results.push(...papers));

  return results;
}

/**
 * 从 DOAJ 获取论文
 */
async function getDOAJPapers() {
  const categories = ['大模型', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
  const results = [];

  const papersPerCategory = 3;

  const promises = categories.map(async (cat) => {
    const articles = await doaj.getArticlesByCategory(cat, papersPerCategory);
    return articles.map(a => doaj.transformArticle(a));
  });

  const resolved = await Promise.all(promises);
  resolved.forEach(papers => results.push(...papers));

  return results;
}

module.exports = async (req, res) => {
  const { category, keyword, page = 1, limit = 20 } = req.query;

  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // /api/papers - 获取论文列表
  if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'papers')) {
    // 获取合并后的论文
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

    // 按日期排序，最新的在前
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

  // /api/papers/hot - 获取热门论文（按引用排序）
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
