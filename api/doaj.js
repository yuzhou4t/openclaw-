/**
 * DOAJ API - 开放获取期刊论文 API
 * https://doaj.org/api/v2
 */

const axios = require('axios');

const DOAJ_API = 'https://doaj.org/api/v2';

// 五大领域的 DOAJ 搜索关键词
const SEARCH_TERMS = {
  '大模型': 'machine learning deep learning artificial intelligence',
  '行为金融': 'behavioral finance investor sentiment',
  '巨灾保险': 'catastrophe insurance climate risk',
  '农业保险': 'agricultural insurance crop insurance weather index',
  '普惠金融': 'financial inclusion microfinance rural finance'
};

/**
 * 搜索文章
 */
async function searchArticles(query, options = {}) {
  const { maxResults = 10, category = null } = options;

  try {
    let searchQuery = query;

    if (category && SEARCH_TERMS[category]) {
      searchQuery = `${query} ${SEARCH_TERMS[category]}`;
    }

    const response = await axios.get(`${DOAJ_API}/search/articles`, {
      params: {
        q: searchQuery,
        size: maxResults,
        sort: 'dateAdded:desc'
      },
      timeout: 15000
    });

    return response.data.results || [];
  } catch (error) {
    console.error('DOAJ API error:', error.message);
    return [];
  }
}

/**
 * 按分类获取文章
 */
async function getArticlesByCategory(category, maxResults = 10) {
  const keywords = SEARCH_TERMS[category] || category;

  try {
    const response = await axios.get(`${DOAJ_API}/search/articles`, {
      params: {
        q: keywords,
        size: maxResults,
        sort: 'dateAdded:desc'
      },
      timeout: 15000
    });

    return response.data.results || [];
  } catch (error) {
    console.error('DOAJ API error for category', category, ':', error.message);
    return [];
  }
}

/**
 * 转换 DOAJ 文章格式为统一格式
 */
function transformArticle(article) {
  const bibjson = article.bibjson || {};
  const title = bibjson.title || 'Untitled';
  const abstractText = bibjson.abstract || '';

  // 提取作者
  const authors = (bibjson.author || []).map(a => a.name || 'Unknown').slice(0, 5);

  // 提取期刊信息
  const journal = bibjson.journal?.title || 'DOAJ';
  const date = bibjson.date || new Date().toISOString().split('T')[0];

  // 链接
  const url = bibjson.link?.[0]?.url || article.id || '#';
  const pdfUrl = bibjson.link?.find(l => l.type === 'fulltext')?.url || null;

  // 猜测分类
  const category = guessCategory(title, abstractText);

  return {
    id: article.id || `doaj_${Date.now()}`,
    title: title,
    authors: authors,
    source: journal,
    date: date,
    abstract: abstractText.substring(0, 500),
    category: category,
    subcategory: guessSubcategory(title, abstractText, category),
    tags: extractTags(title, abstractText),
    citations: 0,
    pdfUrl: pdfUrl,
    url: url,
    doajId: article.id
  };
}

/**
 * 根据标题/摘要猜测主分类
 */
function guessCategory(title, abstract) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (content.includes('financial inclusion') || content.includes('rural finance') ||
      content.includes('microfinance') || content.includes('digital finance')) {
    return '普惠金融';
  }
  if (content.includes('agricultural insurance') || content.includes('crop insurance') ||
      content.includes('weather index') || content.includes('farm')) {
    return '农业保险';
  }
  if (content.includes('catastrophe insurance') || content.includes('climate risk') ||
      content.includes('reinsurance')) {
    return '巨灾保险';
  }
  if (content.includes('behavioral finance') || content.includes('investor sentiment') ||
      content.includes('market anomaly')) {
    return '行为金融';
  }
  if (content.includes('machine learning') || content.includes('deep learning') ||
      content.includes('neural network') || content.includes('artificial intelligence')) {
    return '大模型';
  }

  return '行为金融';
}

/**
 * 根据标题/摘要猜测子领域
 */
function guessSubcategory(title, abstract, category) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (category === '大模型') {
    if (content.includes('agent')) return 'AI Agent';
    if (content.includes('rag') || content.includes('retrieval')) return 'RAG/知识增强';
    if (content.includes('multimodal')) return '多模态模型';
    if (content.includes('rlhf')) return '指令微调/RLHF';
    return '基础模型/预训练';
  }

  if (category === '行为金融') {
    if (content.includes('trading')) return '金融科技';
    if (content.includes('asset pricing')) return '行为资产定价';
    if (content.includes('anomaly')) return '市场异象';
    if (content.includes('investor') || content.includes('sentiment')) return '投资者行为';
    return '其他';
  }

  if (category === '巨灾保险') {
    if (content.includes('climate')) return '气候风险建模';
    if (content.includes('reinsurance')) return '再保险';
    return '其他';
  }

  if (category === '农业保险') {
    if (content.includes('credit')) return '农业信贷';
    if (content.includes('weather index')) return '天气指数保险';
    if (content.includes('livestock')) return '畜牧保险';
    if (content.includes('crop')) return '农作物保险';
    return '其他';
  }

  if (category === '普惠金融') {
    if (content.includes('digital')) return '数字普惠金融';
    if (content.includes('rural credit')) return '农村信贷';
    if (content.includes('microfinance')) return '小微金融';
    if (content.includes('exclusion')) return '金融排斥';
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
    'machine learning', 'deep learning', 'behavioral finance',
    'risk management', 'insurance', 'climate risk',
    'agricultural', 'crop insurance', 'weather index',
    'financial inclusion', 'microfinance', 'artificial intelligence'
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
  searchArticles,
  getArticlesByCategory,
  transformArticle
};
