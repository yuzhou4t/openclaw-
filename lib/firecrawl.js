/**
 * Firecrawl 适配器 - 用于爬取 JS 渲染页面
 * SSRN / NBER 等站点需要 Firecrawl 才能正确获取内容
 */

const { FirecrawlAppV1 } = require('firecrawl');

// Firecrawl API 客户端
const fc = new FirecrawlAppV1({ apiKey: process.env.FIRECRAWL_API_KEY || 'fc-da1ef8fd73ca451a8114ba9ea06e278b' });

// 各类别的搜索关键词
const SEARCH_QUERIES = {
  '计量经济学': [
    'site:ssrn.com OR site:nber.org econometrics time series panel data causal inference',
    'site:nber.org regression model structural estimation'
  ],
  '金融机器学习': [
    'site:ssrn.com OR site:nber.org machine learning finance algorithmic trading',
    'site:ssrn.com deep learning quantitative finance portfolio optimization'
  ],
  '行为金融': [
    'site:ssrn.com OR site:nber.org behavioral finance investor sentiment market anomaly',
    'site:ssrn.com investor behavior overconfidence loss aversion'
  ],
  '巨灾保险': [
    'site:ssrn.com OR site:nber.org catastrophe insurance climate risk disaster',
    'site:ssrn.com hurricane earthquake insurance reinsurance risk modeling'
  ],
  '农业保险': [
    'site:ssrn.com agricultural insurance crop insurance weather index',
    'site:ssrn.com farm insurance rural finance agricultural risk'
  ],
  '普惠金融': [
    'site:ssrn.com OR site:nber.org financial inclusion microfinance digital finance',
    'site:ssrn.com rural finance inclusive finance fintech'
  ]
};

/**
 * 使用 Firecrawl 搜索论文
 * @param {string} category - 分类名称
 * @param {number} limit - 最大结果数
 * @param {object} options - 可选参数 { dateFrom, dateTo }
 */
async function searchPapers(category, limit = 8, options = {}) {
  const queries = SEARCH_QUERIES[category] || [category];
  const { dateFrom, dateTo } = options || {};

  try {
    const allResults = [];

    for (const query of queries) {
      try {
        const result = await fc.search(query, { limit: Math.ceil(limit / queries.length) });
        if (result.success && result.data) {
          allResults.push(...result.data);
        }
      } catch (e) {
        console.log(`Firecrawl search error for "${query}":`, e.message);
      }
    }

    // 去重
    const seen = new Set();
    const unique = allResults.filter(r => {
      const key = r.url || r.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 转换格式并过滤日期
    return unique.slice(0, limit * 2).map((r, i) => {
      const paper = {
        id: `fc-${category}-${Date.now()}-${i}`,
        title: r.title || 'Untitled',
        authors: extractAuthors(r.description || ''),
        date: extractDate(r.description || ''),
        abstract: (r.description || '').substring(0, 300),
        url: r.url,
        source: guessSource(r.url),
        category: category,
        subcategory: guessSubcategory(r.title || '', r.description || '', category),
        tags: extractTags(r.title || '', r.description || ''),
        citations: 0,
        pdfUrl: r.url?.includes('.pdf') ? r.url : null
      };

      // 日期过滤（只有明确超过范围的才过滤，因为 Firecrawl 搜索结果不一定有日期）
      if (dateFrom && paper.date && paper.date < dateFrom) return null;
      if (dateTo && paper.date && paper.date > dateTo) return null;

      return paper;
    }).filter(p => p !== null).slice(0, limit);
  } catch (error) {
    console.error('Firecrawl search error:', error.message);
    return [];
  }
}

/**
 * 从 URL 猜出来源
 */
function guessSource(url) {
  if (!url) return 'Firecrawl';
  if (url.includes('ssrn.com')) return 'SSRN';
  if (url.includes('nber.org')) return 'NBER';
  if (url.includes('arxiv.org')) return 'arXiv';
  return 'Firecrawl';
}

/**
 * 从描述提取作者 - Firecrawl 搜索结果不包含作者信息
 */
function extractAuthors(description) {
  return [];
}

/**
 * 从描述提取日期
 */
function extractDate(description) {
  if (!description) return null;
  // 尝试匹配日期格式
  const match = description.match(/\b(19|20)\d{2}[年\-/]?\d{1,2}[月\-/]?\d{1,2}?\b/);
  if (match) {
    const dateStr = match[0].replace(/[年日月]/g, '-').replace(/--/g, '-');
    return dateStr.replace(/-$/, '');
  }
  return null; // 没有找到日期返回 null
}

/**
 * 提取标签
 */
function extractTags(title, description) {
  const content = ((title || '') + ' ' + (description || '')).toLowerCase();
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

/**
 * 猜测子领域
 */
function guessSubcategory(title, description, category) {
  const content = ((title || '') + ' ' + (description || '')).toLowerCase();

  if (category === '计量经济学') {
    if (content.includes('time series') || content.includes('garch')) return '时间序列';
    if (content.includes('panel data') || content.includes('fixed effect')) return '面板数据';
    if (content.includes('causal') || content.includes('instrument')) return '因果推断';
    if (content.includes('var') || content.includes('vector')) return 'VAR/GARCH';
    return '其他';
  }

  if (category === '金融机器学习') {
    if (content.includes('trading') || content.includes('algorithmic')) return '量化交易';
    if (content.includes('risk') || content.includes('prediction')) return '风险预测';
    if (content.includes('asset pricing') || content.includes('portfolio')) return '资产定价';
    if (content.includes('deep learning') || content.includes('neural')) return '深度学习';
    return '其他';
  }

  if (category === '行为金融') {
    if (content.includes('trading') || content.includes('algorithmic')) return '金融科技';
    if (content.includes('asset pricing') || content.includes('factor')) return '行为资产定价';
    if (content.includes('anomaly') || content.includes('momentum') || content.includes('reversal')) return '市场异象';
    if (content.includes('investor') || content.includes('sentiment')) return '投资者行为';
    return '其他';
  }

  if (category === '巨灾保险') {
    if (content.includes('climate') || content.includes('risk modeling')) return '气候风险建模';
    if (content.includes('reinsurance')) return '再保险';
    if (content.includes('earthquake') || content.includes('seismic')) return '地震保险';
    if (content.includes('flood') || content.includes('hurricane')) return '洪水/飓风保险';
    return '其他';
  }

  if (category === '农业保险') {
    if (content.includes('credit') || content.includes('loan')) return '农业信贷';
    if (content.includes('weather index') || content.includes('rainfall')) return '天气指数保险';
    if (content.includes('livestock') || content.includes('cattle')) return '畜牧保险';
    if (content.includes('crop') || content.includes('farming')) return '农作物保险';
    return '其他';
  }

  if (category === '普惠金融') {
    if (content.includes('digital')) return '数字普惠金融';
    if (content.includes('rural credit') || content.includes('village')) return '农村信贷';
    if (content.includes('microfinance') || content.includes('sme')) return '小微金融';
    if (content.includes('exclusion') || content.includes('literacy')) return '金融排斥';
    return '其他';
  }

  return '其他';
}

module.exports = {
  searchPapers,
  fc  // 暴露客户端供直接使用
};
