/**
 * 论文 API
 * 从 arXiv 自动获取最新论文
 */

const arxiv = require('./arxiv');

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
    // 从 arXiv 获取论文
    const allPapers = await arxiv.getCachedPapers();
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
    const allPapers = await arxiv.getCachedPapers();
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

    const allPapers = await arxiv.getCachedPapers();
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
    const allPapers = await arxiv.getCachedPapers();
    const paper = allPapers.find(p => p.id === id);
    if (paper) {
      return res.status(200).json(paper);
    }
    return res.status(404).json({ error: 'Paper not found' });
  }

  res.status(404).json({ error: 'Not found' });
};
