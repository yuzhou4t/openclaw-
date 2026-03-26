/**
 * OpenAlex API - 学术论文元数据 API
 * 覆盖金融、保险、普惠金融等领域的期刊论文
 * https://api.openalex.org
 */

const axios = require('axios');

const OPENALEX_API = 'https://api.openalex.org';

// 五大领域的 OpenAlex 主题过滤
const TOPIC_FILTERS = {
  '大模型': 'machine learning,deep learning,natural language processing,artificial intelligence',
  '行为金融': 'behavioral finance,investor sentiment,market anomaly,stock market',
  '巨灾保险': 'catastrophe insurance,risk management,climate risk,insurance',
  '农业保险': 'agricultural insurance,crop insurance,weather index,rural finance',
  '普惠金融': 'financial inclusion,microfinance,rural finance,digital finance'
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
 */
async function getPapersByTopic(category, maxResults = 10) {
  const keywords = TOPIC_FILTERS[category] || category;

  try {
    const response = await axios.get(`${OPENALEX_API}/works`, {
      params: {
        search: keywords,
        'per-page': maxResults,
        sort: 'publication_date:desc',
        filter: 'is_oa:true'
      },
      timeout: 15000
    });

    return response.data.results || [];
  } catch (error) {
    console.error('OpenAlex API error for category', category, ':', error.message);
    return [];
  }
}

/**
 * 转换 OpenAlex 论文格式为统一格式
 */
function transformPaper(work) {
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

  return {
    id: id,
    title: title,
    authors: authors,
    source: journal,
    date: publicationDate,
    abstract: abstractText.substring(0, 500),
    category: guessCategory(title, abstractText),
    subcategory: guessSubcategory(title, abstractText, guessCategory(title, abstractText)),
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

  // 大模型优先（最具体的检查）
  if (content.includes('language model') || content.includes('llm') ||
      content.includes('gpt') || content.includes('bert') ||
      content.includes('transformer') || content.includes('multimodal') ||
      content.includes('foundation model') || content.includes('clip')) {
    return '大模型';
  }

  // AI/ML 相关但不是大模型
  if (content.includes('deep learning') || content.includes('neural network') ||
      content.includes('machine learning') || content.includes('artificial intelligence')) {
    // 进一步检查是否是特定领域
    if (content.includes('insurance') || content.includes('climate risk')) {
      // 可能是保险+AI的论文，检查是否有更具体的关键词
      if (content.includes('catastrophe') || content.includes('reinsurance') ||
          content.includes('hurricane') || content.includes('earthquake')) {
        return '巨灾保险';
      }
      if (content.includes('agricultural') || content.includes('crop')) {
        return '农业保险';
      }
    }
    if (content.includes('behavioral finance') || content.includes('investor sentiment') ||
        content.includes('market anomaly') || content.includes('stock market')) {
      return '行为金融';
    }
    if (content.includes('financial inclusion') || content.includes('microfinance')) {
      return '普惠金融';
    }
    return '大模型';
  }

  // 普惠金融
  if (content.includes('financial inclusion') || content.includes('rural finance') ||
      content.includes('microfinance') || content.includes('digital finance') ||
      (content.includes('financial') && content.includes('exclusion'))) {
    return '普惠金融';
  }

  // 农业保险
  if (content.includes('agricultural insurance') || content.includes('crop insurance') ||
      content.includes('weather index') || (content.includes('farm') && content.includes('insurance'))) {
    return '农业保险';
  }

  // 巨灾保险
  if (content.includes('catastrophe insurance') || content.includes('reinsurance') ||
      content.includes('hurricane insurance') || content.includes('earthquake insurance') ||
      (content.includes('climate risk') && content.includes('insurance'))) {
    return '巨灾保险';
  }

  // 行为金融
  if (content.includes('behavioral finance') || content.includes('investor sentiment') ||
      content.includes('market anomaly') || content.includes('algorithmic trading')) {
    return '行为金融';
  }

  return '行为金融'; // 默认
}

/**
 * 根据标题/摘要猜测子领域
 */
function guessSubcategory(title, abstract, category) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (category === '大模型') {
    if (content.includes('agent') || content.includes('tool')) return 'AI Agent';
    if (content.includes('rag') || content.includes('retrieval')) return 'RAG/知识增强';
    if (content.includes('multimodal') || content.includes('vision')) return '多模态模型';
    if (content.includes('rlhf') || content.includes('alignment') || content.includes('dpo')) return '指令微调/RLHF';
    return '基础模型/预训练';
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
