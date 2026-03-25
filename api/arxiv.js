/**
 * arXiv API 爬虫
 * 自动获取最新论文
 */

const axios = require('axios');

// arXiv API 地址
const ARXIV_API = 'https://export.arxiv.org/api/query';

// 五大领域的搜索关键词
const CATEGORY_QUERIES = {
  '大模型': 'cat:cs.CL OR cat:cs.AI OR cat:cs.LG',  // LLM, AI, ML
  '行为金融': 'cat:q-fin.GN OR cat:q-fin.ST OR cat:q-fin.TR',  // General Finance, Trading
  '巨灾保险': 'cat:q-fin.RM OR cat:stat.AP',  // Risk Management, Applied Probability
  '农业保险': 'cat:q-fin.AG OR cat:econ.GN',  // Finance, General Economics
  '普惠金融': 'cat:q-fin.GN OR cat:econ.PR'  // Finance, Economic Policy
};

// 搜索关键词
const SEARCH_TERMS = {
  '大模型': ['large language model', 'LLM', 'GPT', 'transformer', 'attention mechanism', 'multimodal'],
  '行为金融': ['behavioral finance', 'investor sentiment', 'market anomaly'],
  '巨灾保险': ['catastrophe insurance', 'climate risk', 'hurricane insurance'],
  '农业保险': ['agricultural insurance', 'weather index', 'crop insurance'],
  '普惠金融': ['financial inclusion', 'inclusive finance', 'rural finance']
};

// 缓存论文数据（Vercel serverless 环境下每次冷启动会清空，这里作为临时缓存）
let cachedPapers = null;
let lastFetchTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

/**
 * 解析 arXiv XML 响应
 */
function parseArxivResponse(xmlText) {
  const papers = [];

  // 简单的 XML 解析（不用 cheerio）
  const entries = xmlText.split('<entry>');

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];

    const getField = (tag) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = entry.match(regex);
      return match ? match[1].trim().replace(/<[^>]+>/g, '') : '';
    };

    const id = getField('id');
    const arxivId = id.split('/').pop();
    const title = getField('title');
    const summary = getField('summary');
    const authorsStr = getField('author');
    const authors = authorsStr ? [authorsStr] : [];
    const published = getField('published');
    const updated = getField('updated');
    const journal = getField('arxiv:journal_ref') || getField('arxiv:comment') || 'arXiv';
    const categories = getField('category');
    const pdfUrl = getField('id').replace('http://arxiv.org/abs', 'https://arxiv.org/pdf') + '.pdf';

    if (title && summary) {
      papers.push({
        id: arxivId,
        title: title.replace(/\s+/g, ' '),
        authors: authors.length > 0 ? authors : ['Unknown'],
        abstract: summary.replace(/\s+/g, ' ').substring(0, 500),
        source: journal,
        date: published.split('T')[0],
        category: mapToCategory(categories),
        subcategory: categories,
        tags: extractTags(title + ' ' + summary),
        citations: 0,
        pdfUrl: pdfUrl,
        arxivId: arxivId,
        url: `https://arxiv.org/abs/${arxivId}`
      });
    }
  }

  return papers;
}

/**
 * 根据内容映射到类别
 */
function mapToCategory(content) {
  const lower = content.toLowerCase();

  if (lower.includes('language model') || lower.includes('llm') || lower.includes('gpt') ||
      lower.includes('transformer') || lower.includes('attention') || lower.includes('multimodal') ||
      lower.includes('bert') || lower.includes('neural network') || lower.includes('deep learning')) {
    return '大模型';
  }
  if (lower.includes('behavioral') || lower.includes('investor') || lower.includes('sentiment') ||
      lower.includes('finance') || lower.includes('market')) {
    return '行为金融';
  }
  if (lower.includes('catastrophe') || lower.includes('insurance') || lower.includes('climate') ||
      lower.includes('hurricane') || lower.includes('risk')) {
    return '巨灾保险';
  }
  if (lower.includes('agricultural') || lower.includes('crop') || lower.includes('weather') ||
      lower.includes('farm')) {
    return '农业保险';
  }
  if (lower.includes('inclusive') || lower.includes('rural') || lower.includes('financial inclusion')) {
    return '普惠金融';
  }

  return '大模型'; // 默认
}

/**
 * 提取标签
 */
function extractTags(text) {
  const tags = new Set();
  const lower = text.toLowerCase();

  const keywords = [
    'transformer', 'attention', 'llm', 'gpt', 'bert', 'multimodal',
    'reasoning', 'chain-of-thought', 'agent', 'rag', 'retrieval',
    'behavioral finance', 'sentiment', 'market anomaly',
    'catastrophe', 'climate risk', 'insurance',
    'agricultural', 'crop insurance', 'weather index',
    'financial inclusion', 'rural finance'
  ];

  keywords.forEach(kw => {
    if (lower.includes(kw)) {
      tags.add(kw.split(' ')[0].charAt(0).toUpperCase() + kw.split(' ')[0].slice(1));
    }
  });

  return Array.from(tags).slice(0, 5);
}

/**
 * 获取最近天数的论文
 */
async function fetchRecentPapers(days = 7, maxResults = 30) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const query = `all:* AND submittedDate:[${startDateStr} TO ${now.toISOString().split('T')[0]}]`;

  try {
    const response = await axios.get(ARXIV_API, {
      params: {
        search_query: query,
        start: 0,
        max_results: maxResults,
        sortBy: 'submittedDate',
        sortOrder: 'descending'
      },
      timeout: 30000
    });

    return parseArxivResponse(response.data);
  } catch (error) {
    console.error('arXiv API error:', error.message);
    return [];
  }
}

/**
 * 获取指定类别的最新论文
 */
async function fetchPapersByCategory(category, maxResults = 10) {
  const query = CATEGORY_QUERIES[category] || 'cat:cs.AI';

  try {
    const response = await axios.get(ARXIV_API, {
      params: {
        search_query: query,
        start: 0,
        max_results: maxResults,
        sortBy: 'submittedDate',
        sortOrder: 'descending'
      },
      timeout: 30000
    });

    const papers = parseArxivResponse(response.data);
    return papers.map(p => ({ ...p, category }));
  } catch (error) {
    console.error(`arXiv API error for ${category}:`, error.message);
    return [];
  }
}

/**
 * 获取所有类别的最新论文
 */
async function fetchAllPapers(maxPerCategory = 10) {
  const results = await Promise.all([
    fetchPapersByCategory('大模型', maxPerCategory),
    fetchPapersByCategory('行为金融', maxPerCategory),
    fetchPapersByCategory('巨灾保险', maxPerCategory),
    fetchPapersByCategory('农业保险', maxPerCategory),
    fetchPapersByCategory('普惠金融', maxPerCategory)
  ]);

  // 合并并去重
  const allPapers = results.flat();
  const seen = new Set();
  return allPapers.filter(paper => {
    if (seen.has(paper.id)) return false;
    seen.add(paper.id);
    return true;
  });
}

/**
 * 获取缓存的论文，如果没有则抓取
 */
async function getCachedPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedPapers && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedPapers;
  }

  console.log('[arXiv] Fetching fresh papers...');
  cachedPapers = await fetchAllPapers(15);
  lastFetchTime = now;
  console.log(`[arXiv] Fetched ${cachedPapers.length} papers`);

  return cachedPapers;
}

/**
 * 过滤最近N天内的论文
 */
function filterRecentPapers(papers, days = 3) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return papers.filter(paper => {
    const paperDate = new Date(paper.date);
    return paperDate >= cutoff && paperDate <= now;
  });
}

module.exports = {
  fetchRecentPapers,
  fetchPapersByCategory,
  fetchAllPapers,
  getCachedPapers,
  filterRecentPapers
};
