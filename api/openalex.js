/**
 * OpenAlex API - 学术论文元数据 API
 * 覆盖金融、保险、普惠金融等领域的期刊论文
 * https://api.openalex.org
 */

const axios = require('axios');

const OPENALEX_API = 'https://api.openalex.org';

// 六大领域的 OpenAlex 主题过滤
const TOPIC_FILTERS = {
  '计量经济学': 'econometrics,time series analysis,panel data,causal inference,regression model',
  '金融机器学习': 'machine learning finance,quantitative trading,algorithmic trading,deep learning finance',
  '行为金融': 'behavioral finance,investor sentiment,market anomaly,stock market,investor behavior',
  '巨灾保险': 'climate risk insurance,disaster risk,hurricane flood insurance,catastrophe risk,reinsurance',
  '农业保险': 'agricultural insurance,crop insurance,weather index,rural finance,farm insurance',
  '普惠金融': 'financial inclusion,microfinance,rural finance,digital finance,inclusive finance'
};

// 金融/保险相关的 journal ISSN 列表（部分）
const FINANCE_JOURNALS = [
  '1542-4046', // Journal of Risk and Insurance
  '0022-4367', // Journal of Risk and Insurance
  '1096-9934', // Journal of International Money and Finance
  '0264-9993', // Journal of Financial Economics
  '0304-405X', // Journal of Financial Economics
  '0022-1082', // Journal of Finance
  '0005-4596', // Journal of Financial Markets
];

/**
 * 搜索论文
 */
async function searchPapers(query, options = {}) {
  const { maxResults = 10, category = null } = options;

  try {
    let searchQuery = query;

    // 如果指定了分类，添加分类关键词
    if (category && TOPIC_FILTERS[category]) {
      searchQuery = `${query} ${TOPIC_FILTERS[category]}`;
    }

    const response = await axios.get(`${OPENALEX_API}/works`, {
      params: {
        search: searchQuery,
        'per-page': maxResults,
        sort: 'publication_date:desc',
        filter: 'is_oa:true' // 只看开放获取论文
      },
      timeout: 15000
    });

    return response.data.results || [];
  } catch (error) {
    console.error('OpenAlex API error:', error.message);
    return [];
  }
}

/**
 * 获取某主题的最新论文
 * @param {string} category - 分类名称
 * @param {number} maxResults - 最大结果数
 * @param {object} options - 可选参数 { dateFrom, dateTo }
 */
async function getPapersByTopic(category, maxResults = 10, options = {}) {
  const keywords = TOPIC_FILTERS[category] || category;

  try {
    const params = {
      search: keywords,
      'per-page': maxResults,
      sort: 'publication_date:desc',
      filter: 'is_oa:true'
    };

    // 添加日期过滤
    if (options.dateFrom) {
      params['filter'] += `,from_publication_date:${options.dateFrom}`;
    }
    if (options.dateTo) {
      params['filter'] += `,to_publication_date:${options.dateTo}`;
    }

    const response = await axios.get(`${OPENALEX_API}/works`, {
      params,
      timeout: 15000
    });

    const results = response.data.results || [];
    // 转换论文格式并使用请求的分类
    return results.map(work => transformPaper(work, category));
  } catch (error) {
    console.error('OpenAlex API error for category', category, ':', error.message);
    return [];
  }
}

/**
 * 转换 OpenAlex 论文格式为统一格式
 */
function transformPaper(work, requestedCategory = null) {
  const title = work.title || 'Untitled';
  const abstractText = work.abstract_inverted_index ?
    invertAbstract(work.abstract_inverted_index) : '';

  // 提取作者
  const authors = (work.authorships || [])
    .map(a => a.author?.display_name || 'Unknown')
    .slice(0, 5);

  // 提取期刊信息
  const journal = work.primary_location?.source?.display_name || 'OpenAlex';
  const publicationDate = work.publication_date || new Date().toISOString().split('T')[0];

  // 估算引用数（OpenAlex 提供的是准确数据）
  const citations = work.cited_by_count || 0;

  // 构建 URL
  const id = work.id ? work.id.split('/').pop() : work.doi?.split('/').pop() || `oa_${Date.now()}`;
  const url = work.doi || `https://openalex.org/works/${id}`;
  const pdfUrl = work.best_oa_location?.pdf_url || null;

  // 使用请求的分类（如果提供），否则猜测
  const category = requestedCategory || guessCategory(title, abstractText);

  return {
    id: id,
    title: title,
    authors: authors,
    source: journal,
    date: publicationDate,
    abstract: abstractText.substring(0, 500),
    category: category,
    subcategory: guessSubcategory(title, abstractText, category),
    tags: extractTags(title, abstractText),
    citations: citations,
    pdfUrl: pdfUrl,
    url: url,
    openalexId: work.id
  };
}

/**
 * 反转抽象文本索引
 */
function invertAbstract(invertedIndex) {
  if (!invertedIndex) return '';

  const words = Object.keys(invertedIndex);
  words.sort((a, b) => invertedIndex[a][0] - invertedIndex[b][0]);
  return words.join(' ');
}

/**
 * 根据标题/摘要猜测主分类
 */
function guessCategory(title, abstract) {
  const content = (title + ' ' + abstract).toLowerCase();

  // 计量经济学
  if (content.includes('econometric') || content.includes('time series') ||
      content.includes('panel data') || content.includes('causal inference') ||
      content.includes('regression model') || content.includes('var ')) {
    return '计量经济学';
  }

  // 金融机器学习
  if (content.includes('quantitative trading') || content.includes('algorithmic trading') ||
      content.includes('machine learning finance') || content.includes('deep learning finance') ||
      (content.includes('machine learning') && (content.includes('finance') || content.includes('stock') || content.includes('portfolio')))) {
    return '金融机器学习';
  }

  // 行为金融
  if (content.includes('behavioral finance') || content.includes('investor sentiment') ||
      content.includes('market anomaly') || content.includes('investor behavior') ||
      content.includes('overconfidence') || content.includes('loss aversion')) {
    return '行为金融';
  }

  // 巨灾保险
  if (content.includes('catastrophe insurance') || content.includes('reinsurance') ||
      content.includes('hurricane') || content.includes('earthquake insurance') ||
      content.includes('climate risk') || content.includes('disaster risk')) {
    return '巨灾保险';
  }

  // 农业保险
  if (content.includes('agricultural insurance') || content.includes('crop insurance') ||
      content.includes('weather index') || content.includes('farm insurance') ||
      content.includes('agricultural risk')) {
    return '农业保险';
  }

  // 普惠金融
  if (content.includes('financial inclusion') || content.includes('microfinance') ||
      content.includes('rural finance') || content.includes('digital finance') ||
      content.includes('inclusive finance')) {
    return '普惠金融';
  }

  // 默认返回计量经济学
  return '计量经济学';
}

/**
 * 根据标题/摘要猜测子领域
 */
function guessSubcategory(title, abstract, category) {
  const content = (title + ' ' + abstract).toLowerCase();

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

/**
 * 提取标签
 */
function extractTags(title, abstract) {
  const tags = new Set();
  const content = (title + ' ' + abstract).toLowerCase();

  const keywords = [
    'machine learning', 'deep learning', 'neural network', 'transformer',
    'behavioral finance', 'sentiment', 'market anomaly',
    'risk management', 'insurance', 'climate risk',
    'agricultural', 'crop insurance', 'weather index',
    'financial inclusion', 'microfinance', 'digital finance',
    'natural language processing', 'artificial intelligence'
  ];

  keywords.forEach(kw => {
    if (content.includes(kw)) {
      const tag = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      tags.add(tag);
    }
  });

  return Array.from(tags).slice(0, 5);
}

module.exports = {
  searchPapers,
  getPapersByTopic,
  transformPaper
};
