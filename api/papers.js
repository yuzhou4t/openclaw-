/**
 * 论文 API
 * 从 SSRN、NBER、AFAJOF、CNKI 获取精选论文
 * 六大分类：计量经济学、金融机器学习、行为金融、巨灾保险、农业保险、普惠金融
 */

const sources = require('../lib/sources');

// 缓存合并后的论文数据
let mergedPapersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

// 示例论文数据（用于展示，待接入真实数据源后替换）
const SAMPLE_PAPERS = [
  // 计量经济学
  {
    id: 'econ-001',
    title: 'High-Dimensional Econometrics: Variable Selection and Machine Learning',
    authors: ['Bruce E. Hansen'],
    source: 'NBER Working Paper',
    date: '2026-03-20',
    abstract: 'This paper reviews modern methods for variable selection and machine learning in high-dimensional econometric models.',
    category: '计量经济学',
    subcategory: '因果推断',
    tags: ['Econometrics', 'Machine Learning', 'Variable Selection'],
    citations: 45,
    url: 'https://www.nber.org/papers'
  },
  {
    id: 'econ-002',
    title: 'Synthetic Control Methods for Causal Inference',
    authors: ['Alberto Abadie'],
    source: 'NBER Working Paper',
    date: '2026-03-18',
    abstract: 'A framework for causal inference with panel data using synthetic control methods.',
    category: '计量经济学',
    subcategory: '因果推断',
    tags: ['Causal Inference', 'Panel Data', 'Synthetic Control'],
    citations: 89,
    url: 'https://www.nber.org/papers'
  },
  {
    id: 'econ-003',
    title: 'Time Series Econometrics: GARCH Models and Beyond',
    authors: ['Robert Engle'],
    source: 'NBER Working Paper',
    date: '2026-03-15',
    abstract: 'Advances in time series econometrics focusing on volatility modeling.',
    category: '计量经济学',
    subcategory: 'VAR/GARCH',
    tags: ['Time Series', 'GARCH', 'Volatility'],
    citations: 67,
    url: 'https://www.nber.org/papers'
  },
  {
    id: 'econ-004',
    title: 'Panel Data Analysis: Fixed Effects and Random Effects Models',
    authors: ['Jerry Hausman'],
    source: 'NBER Working Paper',
    date: '2026-03-10',
    abstract: 'New developments in panel data methodology for econometric analysis.',
    category: '计量经济学',
    subcategory: '面板数据',
    tags: ['Panel Data', 'Fixed Effects', 'Econometrics'],
    citations: 52,
    url: 'https://www.nber.org/papers'
  },
  // 金融机器学习
  {
    id: 'mlfin-001',
    title: 'Deep Learning for Quantitative Finance',
    authors: ['John Hull'],
    source: 'SSRN',
    date: '2026-03-22',
    abstract: 'Applying deep learning techniques to quantitative finance and algorithmic trading.',
    category: '金融机器学习',
    subcategory: '量化交易',
    tags: ['Deep Learning', 'Quantitative Finance', 'Trading'],
    citations: 34,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'mlfin-002',
    title: 'Machine Learning for Stock Return Prediction',
    authors: ['Tucker Balch'],
    source: 'SSRN',
    date: '2026-03-20',
    abstract: 'A comprehensive study of machine learning methods for predicting stock returns.',
    category: '金融机器学习',
    subcategory: '风险预测',
    tags: ['Machine Learning', 'Stock Prediction', 'Risk'],
    citations: 78,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'mlfin-003',
    title: 'Neural Networks for Asset Pricing',
    authors: ['Sergio Pastorello'],
    source: 'SSRN',
    date: '2026-03-18',
    abstract: 'Using neural networks to improve asset pricing models.',
    category: '金融机器学习',
    subcategory: '资产定价',
    tags: ['Neural Networks', 'Asset Pricing', 'Deep Learning'],
    citations: 41,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'mlfin-004',
    title: 'Reinforcement Learning for Algorithmic Trading',
    authors: ['Amy Wang'],
    source: 'SSRN',
    date: '2026-03-15',
    abstract: 'Developing trading strategies using reinforcement learning algorithms.',
    category: '金融机器学习',
    subcategory: '量化交易',
    tags: ['Reinforcement Learning', 'Algorithmic Trading', 'Finance'],
    citations: 29,
    url: 'https://www.ssrn.com'
  },
  // 行为金融
  {
    id: 'behavior-001',
    title: 'Investor Sentiment and Stock Market Anomalies',
    authors: ['Robert Shiller'],
    source: 'NBER Working Paper',
    date: '2026-03-21',
    abstract: 'Examining the relationship between investor sentiment and market anomalies.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['Behavioral Finance', 'Investor Sentiment', 'Market Anomaly'],
    citations: 95,
    url: 'https://www.nber.org/papers'
  },
  {
    id: 'behavior-002',
    title: 'Loss Aversion and Portfolio Selection',
    authors: ['Daniel Kahneman'],
    source: 'SSRN',
    date: '2026-03-19',
    abstract: 'How loss aversion affects individual investor portfolio decisions.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['Loss Aversion', 'Portfolio', 'Behavioral Economics'],
    citations: 112,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'behavior-003',
    title: 'Overconfidence and Trading Volume',
    authors: ['Brad Barber'],
    source: 'AFAJOF',
    date: '2026-03-17',
    abstract: 'The impact of overconfidence bias on individual investor trading behavior.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['Overconfidence', 'Trading', 'Behavioral Finance'],
    citations: 87,
    url: 'https://afajof.org'
  },
  {
    id: 'behavior-004',
    title: 'Market Efficiency and Behavioral Anomalies',
    authors: ['Eugene Fama'],
    source: 'AFAJOF',
    date: '2026-03-14',
    abstract: 'Re-examining market efficiency in light of documented behavioral anomalies.',
    category: '行为金融',
    subcategory: '市场异象',
    tags: ['Market Efficiency', 'Anomalies', 'Behavioral Finance'],
    citations: 156,
    url: 'https://afajof.org'
  },
  // 巨灾保险
  {
    id: 'catastrophe-001',
    title: 'Climate Risk and Catastrophe Insurance Pricing',
    authors: ['Kenneth Arrow'],
    source: 'NBER Working Paper',
    date: '2026-03-20',
    abstract: 'Developing pricing models for catastrophe insurance under climate change scenarios.',
    category: '巨灾保险',
    subcategory: '气候风险建模',
    tags: ['Climate Risk', 'Insurance', 'Risk Pricing'],
    citations: 63,
    url: 'https://www.nber.org/papers'
  },
  {
    id: 'catastrophe-002',
    title: 'Earthquake Insurance and Moral Hazard',
    authors: ['Howard Kunreuther'],
    source: 'SSRN',
    date: '2026-03-18',
    abstract: 'Analyzing moral hazard in earthquake insurance markets.',
    category: '巨灾保险',
    subcategory: '地震保险',
    tags: ['Earthquake', 'Insurance', 'Moral Hazard'],
    citations: 48,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'catastrophe-003',
    title: 'Reinsurance and Systemic Risk',
    authors: ['David Weil'],
    source: 'SSRN',
    date: '2026-03-15',
    abstract: 'The role of reinsurance in managing systemic risk in insurance markets.',
    category: '巨灾保险',
    subcategory: '再保险',
    tags: ['Reinsurance', 'Systemic Risk', 'Insurance'],
    citations: 35,
    url: 'https://www.ssrn.com'
  },
  // 农业保险
  {
    id: 'agri-001',
    title: 'Weather Index Insurance for Smallholder Farmers',
    authors: ['Michael Carter'],
    source: 'World Bank',
    date: '2026-03-21',
    abstract: 'Designing weather index insurance products for smallholder agriculture.',
    category: '农业保险',
    subcategory: '天气指数保险',
    tags: ['Agricultural Insurance', 'Weather Index', 'Smallholder'],
    citations: 72,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'agri-002',
    title: 'Crop Insurance and Moral Hazard in Agriculture',
    authors: ['Jerry Skees'],
    source: 'SSRN',
    date: '2026-03-19',
    abstract: 'Investigating moral hazard effects in crop insurance programs.',
    category: '农业保险',
    subcategory: '农作物保险',
    tags: ['Crop Insurance', 'Moral Hazard', 'Agriculture'],
    citations: 58,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'agri-003',
    title: 'Agricultural Credit and Insurance in Developing Countries',
    authors: ['Jonathan Morduch'],
    source: 'ERJ',
    date: '2026-03-16',
    abstract: 'The interaction between agricultural credit and insurance products.',
    category: '农业保险',
    subcategory: '农业信贷',
    tags: ['Agricultural Credit', 'Insurance', 'Development'],
    citations: 44,
    url: 'https://erj.ajcass.com'
  },
  // 普惠金融
  {
    id: 'inclusive-001',
    title: 'Digital Finance and Financial Inclusion',
    authors: ['Asli Demirguc-Kunt'],
    source: 'World Bank',
    date: '2026-03-22',
    abstract: 'How digital financial services promote financial inclusion globally.',
    category: '普惠金融',
    subcategory: '数字普惠金融',
    tags: ['Digital Finance', 'Financial Inclusion', 'Mobile Banking'],
    citations: 91,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'inclusive-002',
    title: 'Microfinance and Women Entrepreneurship',
    authors: ['Abhijit Banerjee'],
    source: 'MIT',
    date: '2026-03-20',
    abstract: 'Impact of microfinance on women-owned small businesses.',
    category: '普惠金融',
    subcategory: '小微金融',
    tags: ['Microfinance', 'Women Entrepreneurship', 'Impact'],
    citations: 134,
    url: 'https://www.ssrn.com'
  },
  {
    id: 'inclusive-003',
    title: 'Rural Financial Development and Poverty Reduction',
    authors: ['Rossi Jin'],
    source: 'ERJ',
    date: '2026-03-17',
    abstract: 'The role of rural financial development in poverty alleviation.',
    category: '普惠金融',
    subcategory: '农村信贷',
    tags: ['Rural Finance', 'Poverty Reduction', 'Development'],
    citations: 67,
    url: 'https://erj.ajcass.com'
  }
];

/**
 * 获取合并后的论文数据
 */
async function getMergedPapers(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && mergedPapersCache && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    return mergedPapersCache;
  }

  console.log('[Papers] Using sample papers for display');

  // 暂时使用示例数据，待真实数据源接入后替换
  mergedPapersCache = [...SAMPLE_PAPERS];

  lastFetchTime = now;
  console.log(`[Papers] Loaded ${mergedPapersCache.length} papers`);

  return mergedPapersCache;
}


module.exports = async (req, res) => {
  const { category, keyword, page = 1, limit = 100 } = req.query;

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
