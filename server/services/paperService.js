/**
 * 论文服务 - Architecture 2.0
 * 以 OpenAlex 为核心，用 Proxy/轻量爬虫为辅助
 */

const axios = require('axios');

// OpenAlex API
const OPENALEX_BASE = 'https://api.openalex.org';

// 六大分类的 OpenAlex 搜索关键词
const CATEGORY_QUERIES = {
  '计量经济学': 'econometrics time series panel data causal inference regression',
  '金融机器学习': 'machine learning quantitative trading algorithmic trading deep learning finance',
  '行为金融': 'behavioral finance investor sentiment market anomaly investor behavior',
  '巨灾保险': 'catastrophe insurance climate risk disaster reinsurance hurricane earthquake',
  '农业保险': 'agricultural insurance crop insurance weather index farm rural',
  '普惠金融': 'financial inclusion microfinance digital finance rural inclusive'
};

// OpenAlex 机构/来源过滤
const SOURCE_FILTERS = {
  // NBER 机构 ID
  nber: 'institutions.id:I130769515',
  // arXiv 来源 ID
  arxiv: 'locations.source.id:S4306400194',
  // SSRN 来源 ID
  ssrn: 'locations.source.id:S4306401271'
};

// 缓存
let cachedPapers = null;
let lastFetchTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

const CATEGORIES = Object.keys(CATEGORY_QUERIES);

/**
 * 从 OpenAlex 获取论文
 */
async function fetchFromOpenAlex(category, options = {}) {
  const { dateFrom, dateTo, limit = 10 } = options;
  const query = CATEGORY_QUERIES[category] || category;

  try {
    const params = {
      search: query,
      'per-page': limit,
      sort: 'publication_date:desc'
    };

    // 构建过滤参数：has_fulltext:true 确保有全文
    const filters = ['has_fulltext:true'];

    // 添加日期过滤
    if (dateFrom) filters.push(`from_publication_date:${dateFrom}`);
    if (dateTo) filters.push(`to_publication_date:${dateTo}`);

    params.filter = filters.join(',');

    const r = await axios.get(`${OPENALEX_BASE}/works`, {
      params,
      timeout: 15000
    });

    return r.data.results.map(transformOpenAlexPaper);
  } catch (error) {
    console.error(`OpenAlex error for ${category}:`, error.message);
    return [];
  }
}

/**
 * 从 NBER (via OpenAlex) 获取论文
 */
async function fetchFromNBER(options = {}) {
  const { dateFrom, dateTo, limit = 5 } = options;

  try {
    const filters = [SOURCE_FILTERS.nber, 'has_fulltext:true'];
    if (dateFrom) filters.push(`from_publication_date:${dateFrom}`);
    if (dateTo) filters.push(`to_publication_date:${dateTo}`);

    const params = {
      filter: filters.join(','),
      'per-page': limit,
      sort: 'publication_date:desc'
    };

    const r = await axios.get(`${OPENALEX_BASE}/works`, {
      params,
      timeout: 15000
    });

    return r.data.results.map(w => ({
      ...transformOpenAlexPaper(w),
      source: 'NBER',
      category: guessCategory(w.title, w.abstract_inverted_index ? invertAbstract(w.abstract_inverted_index) : '')
    }));
  } catch (error) {
    console.error('NBER fetch error:', error.message);
    return [];
  }
}

/**
 * 从 arXiv (via OpenAlex) 获取论文
 */
async function fetchFromArxiv(options = {}) {
  const { dateFrom, dateTo, limit = 5 } = options;

  try {
    const filters = [SOURCE_FILTERS.arxiv, 'has_fulltext:true'];
    if (dateFrom) filters.push(`from_publication_date:${dateFrom}`);
    if (dateTo) filters.push(`to_publication_date:${dateTo}`);

    const params = {
      filter: filters.join(','),
      'per-page': limit,
      sort: 'publication_date:desc'
    };

    const r = await axios.get(`${OPENALEX_BASE}/works`, {
      params,
      timeout: 15000
    });

    return r.data.results.map(w => ({
      ...transformOpenAlexPaper(w),
      source: 'arXiv',
      category: guessCategory(w.title, w.abstract_inverted_index ? invertAbstract(w.abstract_inverted_index) : '')
    }));
  } catch (error) {
    console.error('arXiv fetch error:', error.message);
    return [];
  }
}

/**
 * 从 SSRN (via OpenAlex) 获取论文
 */
async function fetchFromSSRN(options = {}) {
  const { dateFrom, dateTo, limit = 5 } = options;

  try {
    const filters = [SOURCE_FILTERS.ssrn, 'has_fulltext:true'];
    if (dateFrom) filters.push(`from_publication_date:${dateFrom}`);
    if (dateTo) filters.push(`to_publication_date:${dateTo}`);

    const params = {
      filter: filters.join(','),
      'per-page': limit,
      sort: 'publication_date:desc'
    };

    const r = await axios.get(`${OPENALEX_BASE}/works`, {
      params,
      timeout: 15000
    });

    return r.data.results.map(w => ({
      ...transformOpenAlexPaper(w),
      source: 'SSRN',
      category: guessCategory(w.title, w.abstract_inverted_index ? invertAbstract(w.abstract_inverted_index) : '')
    }));
  } catch (error) {
    console.error('SSRN fetch error:', error.message);
    return [];
  }
}

/**
 * 转换 OpenAlex 论文格式
 */
function transformOpenAlexPaper(work) {
  const title = work.title || 'Untitled';
  const abstractText = work.abstract_inverted_index ?
    invertAbstract(work.abstract_inverted_index) : '';

  const authors = (work.authorships || [])
    .map(a => a.author?.display_name || 'Unknown')
    .slice(0, 5);

  const journal = work.primary_location?.source?.display_name || 'OpenAlex';
  const publicationDate = work.publication_date || new Date().toISOString().split('T')[0];

  const id = work.id ? work.id.split('/').pop() : work.doi?.split('/').pop() || `oa_${Date.now()}`;
  const url = work.doi || `https://openalex.org/works/${id}`;
  const pdfUrl = work.best_oa_location?.pdf_url || null;

  return {
    id,
    title,
    authors,
    source: journal,
    date: publicationDate,
    abstract: abstractText.substring(0, 300),
    category: guessCategory(title, abstractText),
    subcategory: guessSubcategory(title, abstractText),
    tags: extractTags(title, abstractText),
    citations: work.cited_by_count || 0,
    pdfUrl,
    url,
    openalexId: work.id
  };
}

function invertAbstract(invertedIndex) {
  if (!invertedIndex) return '';
  const words = Object.keys(invertedIndex);
  words.sort((a, b) => invertedIndex[a][0] - invertedIndex[b][0]);
  return words.join(' ');
}

function guessCategory(title, abstract) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (content.includes('econometric') || content.includes('time series') ||
      content.includes('panel data') || content.includes('causal inference') ||
      content.includes('regression model')) {
    return '计量经济学';
  }
  if (content.includes('machine learning') || content.includes('quantitative trading') ||
      content.includes('algorithmic trading') || content.includes('deep learning finance')) {
    return '金融机器学习';
  }
  if (content.includes('behavioral finance') || content.includes('investor sentiment') ||
      content.includes('market anomaly') || content.includes('investor behavior')) {
    return '行为金融';
  }
  if (content.includes('catastrophe insurance') || content.includes('reinsurance') ||
      content.includes('climate risk') || content.includes('disaster risk')) {
    return '巨灾保险';
  }
  if (content.includes('agricultural insurance') || content.includes('crop insurance') ||
      content.includes('weather index')) {
    return '农业保险';
  }
  if (content.includes('financial inclusion') || content.includes('microfinance') ||
      content.includes('digital finance') || content.includes('rural finance')) {
    return '普惠金融';
  }

  return '计量经济学';
}

function guessSubcategory(title, abstract, category) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (category === '计量经济学') {
    if (content.includes('time series') || content.includes('garch')) return '时间序列';
    if (content.includes('panel data')) return '面板数据';
    if (content.includes('causal') || content.includes('instrument')) return '因果推断';
    return '其他';
  }
  if (category === '金融机器学习') {
    if (content.includes('trading') || content.includes('algorithmic')) return '量化交易';
    if (content.includes('risk') || content.includes('prediction')) return '风险预测';
    if (content.includes('portfolio') || content.includes('asset pricing')) return '资产定价';
    if (content.includes('deep learning') || content.includes('neural')) return '深度学习';
    return '其他';
  }
  if (category === '行为金融') {
    if (content.includes('trading')) return '金融科技';
    if (content.includes('asset pricing') || content.includes('factor')) return '行为资产定价';
    if (content.includes('anomaly') || content.includes('momentum')) return '市场异象';
    if (content.includes('investor') || content.includes('sentiment')) return '投资者行为';
    return '其他';
  }
  if (category === '巨灾保险') {
    if (content.includes('climate') || content.includes('risk modeling')) return '气候风险建模';
    if (content.includes('reinsurance')) return '再保险';
    if (content.includes('earthquake')) return '地震保险';
    if (content.includes('flood') || content.includes('hurricane')) return '洪水/飓风保险';
    return '其他';
  }
  if (category === '农业保险') {
    if (content.includes('credit') || content.includes('loan')) return '农业信贷';
    if (content.includes('weather index')) return '天气指数保险';
    if (content.includes('crop')) return '农作物保险';
    return '其他';
  }
  if (category === '普惠金融') {
    if (content.includes('digital')) return '数字普惠金融';
    if (content.includes('rural credit')) return '农村信贷';
    if (content.includes('microfinance')) return '小微金融';
    return '其他';
  }
  return '其他';
}

function extractTags(title, abstract) {
  const content = (title + ' ' + abstract).toLowerCase();
  const tags = [];

  const keywords = [
    'machine learning', 'deep learning', 'neural network',
    'behavioral finance', 'sentiment', 'market anomaly',
    'risk management', 'insurance', 'climate risk',
    'agricultural', 'crop insurance', 'weather index',
    'financial inclusion', 'microfinance', 'digital finance',
    'econometrics', 'panel data', 'causal inference'
  ];

  keywords.forEach(kw => {
    if (content.includes(kw)) {
      const tag = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!tags.includes(tag)) tags.push(tag);
    }
  });

  return tags.slice(0, 5);
}

// ============ 对外接口 ============

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

  if (sort === 'cited') {
    filtered.sort((a, b) => (b.citations || 0) - (a.citations || 0));
  } else {
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    papers: filtered.slice(start, end),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

async function getAllPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedPapers && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedPapers;
  }

  console.log('[PaperService] Fetching papers from OpenAlex...');

  // 计算日期范围
  const today = new Date();
  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(today.getDate() - today.getDay() - 6);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
  const dateFrom = lastWeekStart.toISOString().split('T')[0];
  const dateTo = lastWeekEnd.toISOString().split('T')[0];

  console.log(`[PaperService] Date range: ${dateFrom} to ${dateTo}`);

  const allPapers = [];

  // 1. OpenAlex 六大分类 (每次取 10 篇)
  for (const cat of CATEGORIES) {
    try {
      const papers = await fetchFromOpenAlex(cat, { dateFrom, dateTo, limit: 10 });
      allPapers.push(...papers);
      console.log(`[PaperService] ${cat}: ${papers.length} papers`);
    } catch (e) {
      console.log(`[PaperService] ${cat} error:`, e.message);
    }
  }

  // 2. NBER (via OpenAlex)
  try {
    const nberPapers = await fetchFromNBER({ dateFrom, dateTo, limit: 3 });
    allPapers.push(...nberPapers);
    console.log(`[PaperService] NBER: ${nberPapers.length} papers`);
  } catch (e) {
    console.log(`[PaperService] NBER error:`, e.message);
  }

  // 3. arXiv (via OpenAlex)
  try {
    const arxivPapers = await fetchFromArxiv({ dateFrom, dateTo, limit: 5 });
    allPapers.push(...arxivPapers);
    console.log(`[PaperService] arXiv: ${arxivPapers.length} papers`);
  } catch (e) {
    console.log(`[PaperService] arXiv error:`, e.message);
  }

  // 4. SSRN (via OpenAlex)
  try {
    const ssrnPapers = await fetchFromSSRN({ dateFrom, dateTo, limit: 5 });
    allPapers.push(...ssrnPapers);
    console.log(`[PaperService] SSRN: ${ssrnPapers.length} papers`);
  } catch (e) {
    console.log(`[PaperService] SSRN error:`, e.message);
  }

  // 过滤未来日期
  const todayStr = today.toISOString().split('T')[0];
  const filtered = allPapers.filter(p => !p.date || p.date <= todayStr);

  // 按日期排序
  filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // 去重（基于 ID）
  const seen = new Set();
  const unique = filtered.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  cachedPapers = unique;
  lastFetchTime = now;
  console.log(`[PaperService] Total: ${cachedPapers.length} unique papers`);

  return cachedPapers;
}

async function getPaperById(id) {
  const allPapers = await getAllPapers();
  const paper = allPapers.find(p => p.id == id);
  if (!paper) return null;

  const relatedPapers = allPapers
    .filter(p => p.id != id && p.category === paper.category)
    .slice(0, 5);

  return { ...paper, relatedPapers };
}

async function searchPapers(query, { page, limit }) {
  return getPapers({ keyword: query, page, limit, sort: 'latest' });
}

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

// 兼容旧接口
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
