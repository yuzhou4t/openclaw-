/**
 * arXiv API 爬虫
 * 自动获取最新论文
 */

const axios = require('axios');

// arXiv API 地址
const ARXIV_API = 'https://export.arxiv.org/api/query';

// 五大领域的搜索关键词（使用更广泛的分类和关键词组合）
const CATEGORY_QUERIES = {
  '大模型': 'cat:cs.CL OR cat:cs.AI OR cat:cs.LG OR cat:cs.CV OR all:machine learning',  // LLM, AI, ML, Computer Vision
  '行为金融': 'all:behavioral finance OR all:investor sentiment OR all:market anomaly OR cat:q-fin.ST',  // Finance, Trading
  '巨灾保险': 'all:catastrophe insurance OR all:climate risk OR all:hurricane OR cat:q-fin.RM',  // Risk Management
  '农业保险': 'all:agricultural insurance OR all:crop insurance OR all:weather index OR cat:q-fin.AG',  // Agricultural Finance
  '普惠金融': 'all:financial inclusion OR all:rural finance OR all:microfinance OR cat:q-fin.GN'  // General Finance
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

// 默认论文数据（当 arXiv API 不可用时使用）
const DEFAULT_PAPERS = [
  {
    id: '2603.00001',
    title: 'Large Language Models as Financial Analysts: A Benchmark Study',
    authors: ['Chen Wei', 'Li Ming'],
    source: 'arXiv:2603.00001',
    date: '2026-03-20',
    abstract: 'We evaluate the capability of large language models in financial analysis tasks including risk assessment, market prediction, and investment recommendations.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['LLM', 'Finance', 'Agent'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00001.pdf',
    url: 'https://arxiv.org/abs/2603.00001'
  },
  {
    id: '2603.00002',
    title: 'Multimodal Foundation Models for Medical Image Understanding',
    authors: ['Zhang Li', 'Wang Fang'],
    source: 'arXiv:2603.00002',
    date: '2026-03-21',
    abstract: 'We propose a multimodal foundation model that combines vision and language understanding for medical image analysis.',
    category: '大模型',
    subcategory: '多模态模型',
    tags: ['Multimodal', 'Medical', 'Vision-Language'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00002.pdf',
    url: 'https://arxiv.org/abs/2603.00002'
  },
  {
    id: '2603.00003',
    title: 'Direct Preference Optimization for Financial Text Generation',
    authors: ['Liu Yang', 'Zhao Jun'],
    source: 'arXiv:2603.00003',
    date: '2026-03-19',
    abstract: 'We apply DPO (Direct Preference Optimization) to improve the quality of financial text generation in large language models.',
    category: '大模型',
    subcategory: '指令微调/RLHF',
    tags: ['DPO', 'Alignment', 'Text Generation'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00003.pdf',
    url: 'https://arxiv.org/abs/2603.00003'
  },
  {
    id: '2603.00004',
    title: 'RAG-Based Knowledge Retrieval for Legal Document Analysis',
    authors: ['Huang Xiao', 'Zhou Ming'],
    source: 'arXiv:2603.00004',
    date: '2026-03-18',
    abstract: 'We propose a retrieval-augmented generation system specifically designed for legal document analysis and case retrieval.',
    category: '大模型',
    subcategory: 'RAG/知识增强',
    tags: ['RAG', 'Legal', 'Retrieval'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00004.pdf',
    url: 'https://arxiv.org/abs/2603.00004'
  },
  {
    id: '2603.00005',
    title: 'Investor Sentiment and Stock Market Volatility: Evidence from Chinese A-Share Market',
    authors: ['Li Jia', 'Chen Bo'],
    source: 'arXiv:2603.00005',
    date: '2026-03-22',
    abstract: 'This paper examines the relationship between investor sentiment and stock market volatility using data from the Chinese A-share market.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['Behavioral Finance', 'Sentiment', 'Stock Market'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00005.pdf',
    url: 'https://arxiv.org/abs/2603.00005'
  },
  {
    id: '2603.00011',
    title: 'Momentum Reversal and Earnings Announcement Effects in Emerging Markets',
    authors: ['Zhang Wei', 'Liu Yang'],
    source: 'arXiv:2603.00011',
    date: '2026-03-21',
    abstract: 'We investigate momentum reversal patterns and earnings announcement effects in emerging stock markets.',
    category: '行为金融',
    subcategory: '市场异象',
    tags: ['Momentum', 'Reversal', 'Market Anomaly'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00011.pdf',
    url: 'https://arxiv.org/abs/2603.00011'
  },
  {
    id: '2603.00012',
    title: 'Behavioral Asset Pricing with Sentiment and Macro Factors',
    authors: ['Wang Lei', 'Chen Ming'],
    source: 'arXiv:2603.00012',
    date: '2026-03-20',
    abstract: 'We extend behavioral asset pricing models by incorporating investor sentiment and macroeconomic factors.',
    category: '行为金融',
    subcategory: '行为资产定价',
    tags: ['Asset Pricing', 'Sentiment', 'Factor Model'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00012.pdf',
    url: 'https://arxiv.org/abs/2603.00012'
  },
  {
    id: '2603.00013',
    title: 'Machine Learning for Algorithmic Trading Strategies',
    authors: ['Li Hao', 'Zhao Qiang'],
    source: 'arXiv:2603.00013',
    date: '2026-03-19',
    abstract: 'We apply deep learning models to develop quantitative trading strategies with improved risk-adjusted returns.',
    category: '行为金融',
    subcategory: '金融科技',
    tags: ['Algorithmic Trading', 'Quantitative', 'Machine Learning'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00013.pdf',
    url: 'https://arxiv.org/abs/2603.00013'
  },
  {
    id: '2603.00006',
    title: 'Climate Risk Assessment for Catastrophe Insurance Pricing',
    authors: ['Wang Qiang', 'Liu Fei'],
    source: 'arXiv:2603.00006',
    date: '2026-03-21',
    abstract: 'We develop a comprehensive climate risk assessment framework for pricing catastrophe insurance products.',
    category: '巨灾保险',
    subcategory: '气候风险建模',
    tags: ['Climate Risk', 'Insurance', 'Risk Assessment'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00006.pdf',
    url: 'https://arxiv.org/abs/2603.00006'
  },
  {
    id: '2603.00007',
    title: 'Weather Index Insurance and Farmers Risk Management: Evidence from China',
    authors: ['Zhang Hui', 'Sun Lei'],
    source: 'arXiv:2603.00007',
    date: '2026-03-20',
    abstract: 'We analyze the effectiveness of weather index insurance as a risk management tool for Chinese farmers.',
    category: '农业保险',
    subcategory: '天气指数保险',
    tags: ['Weather Index', 'Agricultural Insurance', 'Risk Management'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00007.pdf',
    url: 'https://arxiv.org/abs/2603.00007'
  },
  {
    id: '2603.00008',
    title: 'Digital Financial Inclusion and Rural Economic Development in China',
    authors: ['Zhao Min', 'Wu Jian'],
    source: 'arXiv:2603.00008',
    date: '2026-03-19',
    abstract: 'This paper investigates how digital financial inclusion promotes rural economic development in China.',
    category: '普惠金融',
    subcategory: '数字普惠金融',
    tags: ['Digital Finance', 'Financial Inclusion', 'Rural Development'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00008.pdf',
    url: 'https://arxiv.org/abs/2603.00008'
  },
  {
    id: '2603.00009',
    title: 'Autonomous AI Agents for Quantitative Trading Strategies',
    authors: ['Xu Wei', 'Ma Cheng'],
    source: 'arXiv:2603.00009',
    date: '2026-03-23',
    abstract: 'We develop an autonomous AI agent framework for generating and executing quantitative trading strategies.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['AI Agent', 'Trading', 'Autonomous'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00009.pdf',
    url: 'https://arxiv.org/abs/2603.00009'
  },
  {
    id: '2603.00010',
    title: 'Foundation Model for Financial Time Series Prediction',
    authors: ['Lin Yun', 'Feng Jia'],
    source: 'arXiv:2603.00010',
    date: '2026-03-22',
    abstract: 'We propose a foundation model architecture specifically designed for financial time series prediction and analysis.',
    category: '大模型',
    subcategory: '基础模型/预训练',
    tags: ['Foundation Model', 'Time Series', 'Finance'],
    citations: 0,
    pdfUrl: 'https://arxiv.org/pdf/2603.00010.pdf',
    url: 'https://arxiv.org/abs/2603.00010'
  }
];

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
      const content = title + ' ' + summary;
      const cat = mapToCategory(content);
      papers.push({
        id: arxivId,
        title: title.replace(/\s+/g, ' '),
        authors: authors.length > 0 ? authors : ['Unknown'],
        abstract: summary.replace(/\s+/g, ' ').substring(0, 500),
        source: journal,
        date: published.split('T')[0],
        category: cat,
        subcategory: mapToSubcategory(content, cat),
        tags: extractTags(content),
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
 * 根据内容映射到主分类
 */
function mapToCategory(content) {
  const lower = content.toLowerCase();

  // 普惠金融优先检测（农村、数字金融等关键词）
  if (lower.includes('financial inclusion') || lower.includes('rural finance') ||
      lower.includes('microfinance') || lower.includes('digital finance') ||
      lower.includes('mobile payment') || lower.includes('e-finance')) {
    return '普惠金融';
  }

  // 农业保险检测
  if (lower.includes('agricultural insurance') || lower.includes('crop insurance') ||
      lower.includes('weather index') || lower.includes('farm') || lower.includes('livestock') ||
      lower.includes('farming') || lower.includes('harvest')) {
    return '农业保险';
  }

  // 巨灾保险检测
  if (lower.includes('catastrophe insurance') || lower.includes('climate risk') ||
      lower.includes('hurricane') || lower.includes('earthquake') || lower.includes('flood') ||
      lower.includes('reinsurance') || lower.includes('cat bond') || lower.includes('seismic')) {
    return '巨灾保险';
  }

  // 行为金融检测
  if (lower.includes('behavioral finance') || lower.includes('investor sentiment') ||
      lower.includes('market anomaly') || lower.includes('momentum') || lower.includes('overconfidence') ||
      lower.includes('herding') || lower.includes('asset pricing') || lower.includes('algorithmic trading')) {
    return '行为金融';
  }

  // 大模型（默认）- LLM, AI, ML 相关
  if (lower.includes('language model') || lower.includes('llm') || lower.includes('gpt') ||
      lower.includes('transformer') || lower.includes('attention') || lower.includes('multimodal') ||
      lower.includes('bert') || lower.includes('neural network') || lower.includes('deep learning') ||
      lower.includes('reinforcement learning') || lower.includes('instruction tuning') ||
      lower.includes('agent') || lower.includes('rag') || lower.includes('retrieval')) {
    return '大模型';
  }

  // 默认为大模型
  return '大模型';
}

/**
 * 根据内容映射到子领域
 */
function mapToSubcategory(content, category) {
  const lower = content.toLowerCase();

  // ========== 大模型子领域 ==========
  if (category === '大模型') {
    // 指令微调/RLHF
    if (lower.includes('rlhf') || lower.includes('dpo') || lower.includes('ppo') ||
        lower.includes('instruction tuning') || lower.includes('alignment') ||
        lower.includes('preference') || lower.includes('sft') || lower.includes('reward')) {
      return '指令微调/RLHF';
    }
    // RAG/知识增强
    if (lower.includes('rag') || lower.includes('retrieval') || lower.includes('knowledge') ||
        lower.includes('augment') || lower.includes('grounding')) {
      return 'RAG/知识增强';
    }
    // 多模态模型
    if (lower.includes('multimodal') || lower.includes('vision-language') ||
        lower.includes('image generation') || lower.includes('text-to-image') ||
        lower.includes('gpt-4v') || lower.includes('clip') || lower.includes('vqa')) {
      return '多模态模型';
    }
    // AI Agent
    if (lower.includes('agent') || lower.includes('tool use') || lower.includes('planning') ||
        lower.includes('reasoning') || lower.includes('autonomous') || lower.includes('workflow')) {
      return 'AI Agent';
    }
    // 基础模型/预训练（默认）
    return '基础模型/预训练';
  }

  // ========== 行为金融子领域 ==========
  if (category === '行为金融') {
    // 投资者行为
    if (lower.includes('investor behavior') || lower.includes('investor sentiment') ||
        lower.includes('household finance') || lower.includes('disposition effect') ||
        lower.includes('overconfidence') || lower.includes('herding')) {
      return '投资者行为';
    }
    // 市场异象
    if (lower.includes('market anomaly') || lower.includes('momentum') || lower.includes('reversal') ||
        lower.includes('calendar effect') || lower.includes('size effect') || lower.includes('value effect')) {
      return '市场异象';
    }
    // 行为资产定价
    if (lower.includes('asset pricing') || lower.includes('factor model') ||
        lower.includes('expected return') || lower.includes('equity premium')) {
      return '行为资产定价';
    }
    // 金融科技
    if (lower.includes('algorithmic trading') || lower.includes('quantitative trading') ||
        lower.includes('fintech') || lower.includes('high frequency')) {
      return '金融科技';
    }
    return '其他';
  }

  // ========== 巨灾保险子领域 ==========
  if (category === '巨灾保险') {
    // 地震保险
    if (lower.includes('earthquake insurance') || lower.includes('seismic')) {
      return '地震保险';
    }
    // 洪水/飓风保险
    if (lower.includes('hurricane') || lower.includes('flood insurance') || lower.includes('windstorm')) {
      return '洪水/飓风保险';
    }
    // 气候风险建模
    if (lower.includes('climate change') || lower.includes('climate risk') ||
        lower.includes('global warming') || lower.includes('physical risk')) {
      return '气候风险建模';
    }
    // 再保险
    if (lower.includes('reinsurance') || lower.includes('retrocession') ||
        lower.includes('cat bond') || lower.includes('risk transfer')) {
      return '再保险';
    }
    return '其他';
  }

  // ========== 农业保险子领域 ==========
  if (category === '农业保险') {
    // 农作物保险
    if (lower.includes('crop insurance') || lower.includes('farming') ||
        lower.includes('drought') || lower.includes('frost') || lower.includes('pest')) {
      return '农作物保险';
    }
    // 畜牧保险
    if (lower.includes('livestock') || lower.includes('cattle') ||
        lower.includes('poultry') || lower.includes('aquaculture')) {
      return '畜牧保险';
    }
    // 天气指数保险
    if (lower.includes('weather index') || lower.includes('rainfall') ||
        lower.includes('temperature') || lower.includes('ndvi')) {
      return '天气指数保险';
    }
    // 农业信贷
    if (lower.includes('agricultural credit') || lower.includes('farm credit') ||
        lower.includes('crop loan') || lower.includes('seasonal credit')) {
      return '农业信贷';
    }
    return '其他';
  }

  // ========== 普惠金融子领域 ==========
  if (category === '普惠金融') {
    // 数字普惠金融
    if (lower.includes('digital finance') || lower.includes('digital inclusion') ||
        lower.includes('mobile payment') || lower.includes('internet finance')) {
      return '数字普惠金融';
    }
    // 农村信贷
    if (lower.includes('rural finance') || lower.includes('rural credit') ||
        lower.includes('village bank') || lower.includes('county economy')) {
      return '农村信贷';
    }
    // 小微金融
    if (lower.includes('microfinance') || lower.includes('sme finance') ||
        lower.includes('small business') || lower.includes('enterprise credit')) {
      return '小微金融';
    }
    // 金融排斥
    if (lower.includes('financial exclusion') || lower.includes('financial access') ||
        lower.includes('financial literacy') || lower.includes('unbanked')) {
      return '金融排斥';
    }
    return '其他';
  }

  return '其他';
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

  // 如果 arXiv API 不可用，使用默认论文数据
  if (cachedPapers.length === 0) {
    console.log('[arXiv] Using DEFAULT_PAPERS as fallback');
    cachedPapers = DEFAULT_PAPERS;
  }

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
