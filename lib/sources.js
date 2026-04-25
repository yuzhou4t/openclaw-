/**
 * Unified source adapters for paper aggregation.
 * Each adapter returns: { status, items, error? }
 */

const cheerio = require('cheerio');
const crypto = require('crypto');
const { searchPapers: firecrawlSearch } = require('./firecrawl');
const openalex = require('../api/openalex');

const USER_AGENT = 'Mozilla/5.0 (compatible; PaperHubBot/1.0; +https://example.com)';
const SSRN_URL = 'https://www.ssrn.com/en/';
const NBER_URL = 'https://www.nber.org/papers?page=1&perPage=50&sortBy=public_date';
const CROSSREF_API = 'https://api.crossref.org';
const OPENALEX_WORKS_API = 'https://api.openalex.org/works';
const SSRN_OPENALEX_SOURCE_ID = 'https://openalex.org/S4210172589';
const NBER_OPENALEX_SOURCE_ID = 'https://openalex.org/S2809516038';
const AFAJOF_URL = 'https://afajof.org/forthcoming-articles/';
const ERJ_JOURNAL_ID = 201803050001;
const ERJ_API_BASE = 'https://api.ajcass.com/api';
const GLSJ_URL = 'https://glsj.cbpt.cnki.net/WKB2/WebPublication/index.aspx?mid=GLSJ';
const ZHOU_URL = 'https://guofuzhou.github.io/zothers.html';

const ZHOU_WHITELIST = new Set([
  'ssrn.com',
  'www.ssrn.com',
  'nber.org',
  'www.nber.org',
  'afajof.org',
  'www.afajof.org',
  'erj.ajcass.com',
  'glsj.cbpt.cnki.net',
  'cbpt.cnki.net'
]);

const CATEGORY_QUERY_HINTS = {
  '计量经济学': 'econometrics causal inference panel data time series',
  '金融机器学习': 'machine learning finance quantitative trading asset pricing',
  '行为金融': 'behavioral finance investor sentiment market anomaly',
  '巨灾保险': 'catastrophe insurance climate risk reinsurance disaster',
  '农业保险': 'agricultural insurance crop insurance weather index rural finance',
  '普惠金融': 'financial inclusion microfinance digital finance rural credit'
};

const CATEGORY_SIGNAL_KEYWORDS = {
  '计量经济学': ['econometric', 'causal', 'panel', 'time series', 'regression', '因果', '计量', '面板', '时间序列'],
  '金融机器学习': ['machine learning', 'deep learning', 'neural', 'algorithmic', 'quant', '机器学习', '深度学习', '量化'],
  '行为金融': ['behavioral', 'investor', 'sentiment', 'anomaly', 'bias', '行为金融', '投资者', '情绪', '市场异象'],
  '巨灾保险': ['catastrophe', 'disaster', 'climate risk', 'reinsurance', 'hurricane', 'flood', '巨灾', '灾害', '再保险', '气候风险'],
  '农业保险': ['agricultural insurance', 'crop insurance', 'weather index', 'farm', '农业保险', '农作物', '天气指数'],
  '普惠金融': ['financial inclusion', 'microfinance', 'inclusive finance', 'rural finance', '普惠金融', '小微', '农村金融']
};

const SUBCATEGORY_RULES = {
  '计量经济学': {
    '时间序列': ['time series', 'forecast', 'arima', 'state space', 'cointegration', 'unit root', '时间序列', '预测'],
    '面板数据': ['panel', 'fixed effect', 'random effect', 'difference-in-differences', 'did', 'panel data', '面板', '双重差分'],
    '因果推断': ['causal', 'instrumental variable', 'iv', 'rdd', 'regression discontinuity', 'natural experiment', '因果', '工具变量', '断点回归'],
    'VAR/GARCH': ['var', 'vector autoregression', 'garch', 'volatility', 'heteroskedasticity', 'copula', '波动率', '条件异方差']
  },
  '金融机器学习': {
    '量化交易': ['algorithmic trading', 'high-frequency', 'execution', 'alpha strategy', 'market making', 'quant trading', '量化交易', '高频'],
    '风险预测': ['risk prediction', 'credit risk', 'default', 'stress test', 'var forecast', 'expected shortfall', '风险预测', '信用风险', '违约'],
    '资产定价': ['asset pricing', 'factor model', 'portfolio', 'return prediction', 'cross-section', 'equity premium', '资产定价', '组合', '收益率'],
    '深度学习': ['deep learning', 'neural network', 'transformer', 'lstm', 'cnn', 'reinforcement learning', '大语言模型', '深度学习', '神经网络']
  },
  '行为金融': {
    '投资者行为': ['investor behavior', 'attention', 'overconfidence', 'disposition effect', 'retail investor', 'investor sentiment', '投资者行为', '过度自信', '注意力'],
    '市场异象': ['anomaly', 'momentum', 'reversal', 'calendar effect', 'mispricing', 'limits to arbitrage', '市场异象', '动量', '反转'],
    '行为资产定价': ['behavioral asset pricing', 'prospect theory', 'loss aversion', 'risk preference', 'belief distortion', '行为资产定价', '前景理论', '损失厌恶'],
    '金融科技': ['fintech', 'cryptocurrency', 'robo-advisor', 'digital platform', 'blockchain', '支付', '金融科技', '加密货币']
  },
  '巨灾保险': {
    '地震保险': ['earthquake', 'seismic', 'fault', '地震', '震灾'],
    '洪水/飓风保险': ['flood', 'hurricane', 'storm surge', 'typhoon', '洪水', '飓风', '台风', '暴雨'],
    '气候风险建模': ['climate risk', 'catastrophe model', 'scenario analysis', 'extreme weather', 'tail risk', '气候风险', '灾害建模', '极端天气'],
    '再保险': ['reinsurance', 'retrocession', 'cat bond', 'insurance-linked security', '再保险', '巨灾债券']
  },
  '农业保险': {
    '农作物保险': ['crop insurance', 'yield risk', 'harvest', 'grain', 'rice', 'corn', 'wheat', '农作物保险', '作物'],
    '畜牧保险': ['livestock', 'cattle', 'dairy', 'poultry', 'animal disease', '畜牧', '牲畜', '养殖'],
    '天气指数保险': ['weather index', 'rainfall index', 'drought index', 'satellite index', 'parametric insurance', '天气指数', '降雨指数', '旱灾指数'],
    '农业信贷': ['agricultural credit', 'rural loan', 'farm credit', 'microloan', '信贷约束', '农业信贷', '农村贷款']
  },
  '普惠金融': {
    '数字普惠金融': ['digital finance', 'mobile money', 'platform finance', 'e-wallet', 'digital lending', '数字普惠', '移动支付', '数字信贷'],
    '农村信贷': ['rural credit', 'village bank', 'cooperative finance', 'farmer loan', '县域金融', '农村信贷', '农户贷款'],
    '小微金融': ['microfinance', 'sme finance', 'small business lending', 'entrepreneur finance', '小微金融', '中小企业融资'],
    '金融排斥': ['financial exclusion', 'access to finance', 'credit constraint', 'financial literacy', 'banking access', '金融排斥', '金融可得性', '信贷约束']
  }
};

const DEFAULT_SUBCATEGORY_BY_CATEGORY = {
  '计量经济学': '面板数据',
  '金融机器学习': '资产定价',
  '行为金融': '投资者行为',
  '巨灾保险': '气候风险建模',
  '农业保险': '农作物保险',
  '普惠金融': '数字普惠金融'
};

function withTimeout(ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
}

async function fetchText(url, init = {}) {
  const timeout = withTimeout();
  try {
    const res = await fetch(url, {
      ...init,
      signal: timeout.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(init.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    timeout.clear();
  }
}

async function fetchJson(url, init = {}) {
  const timeout = withTimeout();
  try {
    const res = await fetch(url, {
      ...init,
      signal: timeout.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json,text/plain,*/*',
        ...(init.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    timeout.clear();
  }
}

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function stripHtml(value = '') {
  return cleanText(String(value).replace(/<[^>]+>/g, ' '));
}

function normalizeDate(value) {
  if (!value) return null;
  const text = String(value).trim();

  const slash = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const mm = slash[1].padStart(2, '0');
    const dd = slash[2].padStart(2, '0');
    return `${slash[3]}-${mm}-${dd}`;
  }

  const iso = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  const zh = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (zh) {
    return `${zh[1]}-${zh[2].padStart(2, '0')}-${zh[3].padStart(2, '0')}`;
  }

  return null;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function clampFutureDate(date) {
  const today = todayDate();
  if (!date) return { date: today, originalFutureDate: null };
  if (date > today) {
    return { date: today, originalFutureDate: date };
  }
  return { date, originalFutureDate: null };
}

function getCategoryQueryHint(category) {
  return CATEGORY_QUERY_HINTS[category] || '';
}

function hasCategorySignal(category, text = '') {
  const keywords = CATEGORY_SIGNAL_KEYWORDS[category] || [];
  const content = String(text).toLowerCase();
  return keywords.some(keyword => content.includes(String(keyword).toLowerCase()));
}

function inferCategory(title = '', abstract = '') {
  const content = `${title} ${abstract}`.toLowerCase();
  const rules = {
    '计量经济学': [
      'econometric', 'causal', 'regression', 'panel data', 'time series', 'identification',
      '计量', '因果', '回归', '面板', '时间序列', '工具变量'
    ],
    '金融机器学习': [
      'machine learning', 'deep learning', 'neural', 'xgboost', 'algorithmic', 'ai finance',
      '机器学习', '深度学习', '神经网络', '量化', '算法交易', '大模型'
    ],
    '行为金融': [
      'behavioral', 'sentiment', 'investor', 'anomaly', 'bias', 'attention',
      '行为金融', '投资者', '市场异象', '情绪', '过度反应'
    ],
    '巨灾保险': [
      'catastrophe', 'climate risk', 'disaster', 'reinsurance', 'hurricane', 'flood',
      '巨灾', '气候风险', '灾害', '再保险', '洪水', '地震'
    ],
    '农业保险': [
      'agricultural insurance', 'crop insurance', 'farm', 'weather index', 'agriculture',
      '农业保险', '农作物', '畜牧', '天气指数', '三农'
    ],
    '普惠金融': [
      'financial inclusion', 'microfinance', 'rural finance', 'inclusive finance', 'sme finance',
      '普惠金融', '小微', '农村金融', '数字普惠', '金融可得性'
    ]
  };

  let bestCategory = null;
  let bestScore = 0;
  Object.entries(rules).forEach(([category, keywords]) => {
    const score = keywords.reduce((sum, keyword) => sum + (content.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory || '未分类';
}

function inferSubcategory(category, title = '', abstract = '', existingSubcategory = '') {
  const existing = cleanText(existingSubcategory);
  if (existing && existing !== '其他') return existing;
  if (!category || category === '未分类') return '其他';

  const rules = SUBCATEGORY_RULES[category];
  if (!rules) return existing || '其他';

  const content = `${title} ${abstract}`.toLowerCase();
  let bestSub = null;
  let bestScore = 0;

  Object.entries(rules).forEach(([subcategory, keywords]) => {
    const score = keywords.reduce((sum, keyword) => (
      content.includes(String(keyword).toLowerCase()) ? sum + 1 : sum
    ), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSub = subcategory;
    }
  });

  if (bestSub && bestScore > 0) return bestSub;
  if (content.length > 20 && DEFAULT_SUBCATEGORY_BY_CATEGORY[category]) {
    return DEFAULT_SUBCATEGORY_BY_CATEGORY[category];
  }
  return existing || '其他';
}

function buildPaper(sourceId, sourceName, raw = {}, fallbackCategory = null) {
  const title = cleanText(raw.title || raw.name || '');
  const abstract = cleanText(raw.abstract || raw.description || '');
  const category = fallbackCategory || raw.category || inferCategory(title, abstract);
  const subcategory = inferSubcategory(category, title, abstract, raw.subcategory || '');
  const url = raw.url || raw.link || null;
  const authors = Array.isArray(raw.authors)
    ? raw.authors.filter(Boolean).map(a => cleanText(a))
    : cleanText(raw.authors || raw.author || '')
      ? cleanText(raw.authors || raw.author).split(/[,;，]/).map(a => cleanText(a)).filter(Boolean)
      : [];
  const normalized = normalizeDate(raw.date || raw.publishDate || raw.published || '') || todayDate();
  const { date, originalFutureDate } = clampFutureDate(normalized);
  const doi = cleanText(raw.doi || '');
  const pdfUrl = raw.pdfUrl || null;
  const idSeed = cleanText((doi || url || title || `${sourceId}-${Date.now()}`).toLowerCase());
  const idHash = crypto.createHash('sha1').update(idSeed).digest('hex').slice(0, 16);
  const id = `${sourceId}-${idHash}`;
  const rawMeta = {
    ...(raw.rawMeta || {}),
    ...(originalFutureDate ? { originalFutureDate } : {})
  };

  return {
    id,
    title: title || 'Untitled',
    authors,
    date,
    abstract,
    url,
    pdfUrl,
    doi: doi || null,
    source: sourceName,
    sourceId,
    category,
    subcategory,
    language: /[\u4e00-\u9fa5]/.test(title + abstract) ? 'zh' : 'en',
    citations: Number(raw.citations || 0),
    rawMeta
  };
}

function filterByDate(items, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return items;
  return items.filter(item => {
    const d = item.date;
    if (!d) return true;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
}

function alignItemsToCategory(items = [], category) {
  if (!category) return items;
  return items
    .filter(item => item.category === category || hasCategorySignal(category, `${item.title || ''} ${item.abstract || ''}`))
    .map(item => {
      const nextCategory = category;
      const currentSubcategory = item.subcategory || '';
      const nextSubcategory = inferSubcategory(
        nextCategory,
        item.title || '',
        item.abstract || '',
        item.category === nextCategory ? currentSubcategory : ''
      );

      return {
        ...item,
        category: nextCategory,
        subcategory: nextSubcategory
      };
    });
}

function dedupeByTitleAndUrl(items = []) {
  const map = new Map();
  items.forEach(item => {
    const key = `${cleanText(item.title || '').toLowerCase()}|${cleanText(item.doi || '').toLowerCase()}|${cleanText(item.url || '').toLowerCase()}`;
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function crossrefDate(item = {}) {
  const candidates = [
    item.issued,
    item.published,
    item['published-online'],
    item['published-print'],
    item.created
  ];

  for (const candidate of candidates) {
    const parts = candidate?.['date-parts']?.[0];
    if (!Array.isArray(parts) || !parts.length) continue;
    const year = String(parts[0] || '').padStart(4, '0');
    const month = String(parts[1] || 1).padStart(2, '0');
    const day = String(parts[2] || 1).padStart(2, '0');
    if (year && year !== '0000') return `${year}-${month}-${day}`;
  }

  return null;
}

function crossrefAuthors(item = {}) {
  const authors = Array.isArray(item.author) ? item.author : [];
  return authors
    .map(a => cleanText(`${a.given || ''} ${a.family || ''}`))
    .filter(Boolean)
    .slice(0, 8);
}

function ssrnUrlFromDoi(doi = '') {
  const text = String(doi).trim();
  const match = text.match(/10\.2139\/ssrn\.(\d+)/i);
  if (match) {
    return `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=${match[1]}`;
  }
  return text ? `https://doi.org/${text}` : null;
}

function nberUrlFromDoi(doi = '') {
  const text = String(doi).trim();
  const match = text.match(/10\.3386\/w(\d+)/i);
  if (match) {
    return `https://www.nber.org/papers/w${match[1]}`;
  }
  return text ? `https://doi.org/${text}` : null;
}

async function fetchCrossrefByPrefix({
  prefix,
  sourceId,
  sourceName,
  category,
  limit = 5,
  dateFrom,
  dateTo,
  urlFromDoi
}) {
  const params = new URLSearchParams();
  params.set('rows', String(Math.max(limit * 3, 20)));
  params.set('sort', 'published');
  params.set('order', 'desc');

  const queryHint = getCategoryQueryHint(category);
  if (queryHint) {
    params.set('query', queryHint);
  }

  const filters = [];
  if (dateFrom) filters.push(`from-pub-date:${dateFrom}`);
  if (dateTo) filters.push(`until-pub-date:${dateTo}`);
  if (filters.length) params.set('filter', filters.join(','));

  const data = await fetchJson(`${CROSSREF_API}/prefixes/${prefix}/works?${params.toString()}`);
  const rows = Array.isArray(data?.message?.items) ? data.message.items : [];

  const baseItems = rows.map(row => {
    const title = cleanText((row.title || [])[0] || '');
    const doi = cleanText(row.DOI || '');
    const abstract = stripHtml(row.abstract || '');
    const url = (typeof urlFromDoi === 'function' ? urlFromDoi(doi) : null)
      || cleanText(row.URL || '')
      || (doi ? `https://doi.org/${doi}` : null);
    const date = crossrefDate(row) || todayDate();
    const paper = buildPaper(sourceId, sourceName, {
      title,
      authors: crossrefAuthors(row),
      abstract,
      url,
      doi,
      date,
      rawMeta: {
        publisher: cleanText(row.publisher || ''),
        container: cleanText((row['container-title'] || [])[0] || ''),
        crossrefType: cleanText(row.type || '')
      }
    }, null);

    return paper;
  }).filter(item => item.title && item.title !== 'Untitled');

  let items = alignItemsToCategory(baseItems, category);
  if (category && !items.length && queryHint && baseItems.length) {
    items = baseItems
      .slice(0, limit)
      .map(item => ({
        ...item,
        category,
        rawMeta: {
          ...(item.rawMeta || {}),
          lowConfidenceCategory: true,
          categoryFrom: 'crossref_query_hint'
        }
      }));
  }

  items = dedupeByTitleAndUrl(items).slice(0, limit);
  return filterByDate(items, dateFrom, dateTo);
}

async function fetchOpenAlexBySourceId({
  openalexSourceId,
  sourceId,
  sourceName,
  category,
  limit = 5,
  dateFrom,
  dateTo,
  urlFromDoi
}) {
  const params = new URLSearchParams();
  params.set('per-page', String(Math.max(limit * 4, 20)));
  params.set('sort', 'publication_date:desc');
  const queryHint = getCategoryQueryHint(category);
  if (queryHint) params.set('search', queryHint);

  const filters = [`primary_location.source.id:${openalexSourceId}`];
  if (dateFrom) filters.push(`from_publication_date:${dateFrom}`);
  if (dateTo) filters.push(`to_publication_date:${dateTo}`);
  params.set('filter', filters.join(','));

  const data = await fetchJson(`${OPENALEX_WORKS_API}?${params.toString()}`);
  const rows = Array.isArray(data?.results) ? data.results : [];

  const baseItems = rows.map(row => {
    const transformed = openalex.transformPaper(row, null);
    const doi = cleanText(String(row.doi || '').replace(/^https?:\/\/doi\.org\//i, ''));
    const sourceUrl = (typeof urlFromDoi === 'function' ? urlFromDoi(doi) : null)
      || transformed.url
      || cleanText(row.primary_location?.landing_page_url || '')
      || (doi ? `https://doi.org/${doi}` : null);

    return buildPaper(sourceId, sourceName, {
      title: transformed.title,
      authors: transformed.authors,
      abstract: transformed.abstract,
      date: transformed.date,
      url: sourceUrl,
      pdfUrl: transformed.pdfUrl,
      doi: doi || null,
      citations: transformed.citations || 0,
      rawMeta: {
        openalexId: row.id || null,
        openalexSource: cleanText(row.primary_location?.source?.display_name || ''),
        openalexSourceId
      }
    }, null);
  });

  let items = alignItemsToCategory(baseItems, category);
  if (category && !items.length && queryHint && baseItems.length) {
    items = baseItems
      .slice(0, limit)
      .map(item => ({
        ...item,
        category,
        rawMeta: {
          ...(item.rawMeta || {}),
          lowConfidenceCategory: true,
          categoryFrom: 'openalex_query_hint'
        }
      }));
  }
  items = dedupeByTitleAndUrl(items).slice(0, limit);
  return filterByDate(items, dateFrom, dateTo);
}

async function fetchFromFirecrawlForSource(sourceName, category, limit) {
  const rows = await firecrawlSearch(category, Math.max(limit * 2, 8));
  return rows
    .filter(row => String(row.source || '').toLowerCase().includes(sourceName.toLowerCase()))
    .slice(0, limit);
}

async function fetchSSRNPapersDetailed(category, limit = 5, options = {}) {
  const { dateFrom, dateTo } = options;
  let usedFallback = false;
  try {
    const html = await fetchText(SSRN_URL);
    if (/__cf_chl|Just a moment/i.test(html)) {
      usedFallback = true;
    } else {
      const $ = cheerio.load(html);
      let papers = [];
      $('a[href*="abstract_id"]').each((i, el) => {
        if (papers.length >= limit) return false;
        const title = cleanText($(el).text());
        const href = $(el).attr('href');
        if (!title || !href) return undefined;
        papers.push(buildPaper('ssrn', 'SSRN', {
          title,
          url: href.startsWith('http') ? href : `https://papers.ssrn.com${href}`
        }, null));
        return undefined;
      });

      papers = alignItemsToCategory(filterByDate(dedupeByTitleAndUrl(papers), dateFrom, dateTo), category);
      if (papers.length >= limit) {
        return { status: 'ok', items: papers.slice(0, limit) };
      }

      const missing = Math.max(limit - papers.length, 0);
      if (missing > 0) {
        const openalexItems = await fetchOpenAlexBySourceId({
          openalexSourceId: SSRN_OPENALEX_SOURCE_ID,
          sourceId: 'ssrn',
          sourceName: 'SSRN',
          category,
          limit: missing,
          dateFrom,
          dateTo,
          urlFromDoi: ssrnUrlFromDoi
        });
        papers = dedupeByTitleAndUrl([...papers, ...openalexItems]).slice(0, limit);
      }

      const stillMissing = Math.max(limit - papers.length, 0);
      if (stillMissing > 0) {
        const crossrefItems = await fetchCrossrefByPrefix({
          prefix: '10.2139',
          sourceId: 'ssrn',
          sourceName: 'SSRN',
          category,
          limit: stillMissing,
          dateFrom,
          dateTo,
          urlFromDoi: ssrnUrlFromDoi
        });
        papers = dedupeByTitleAndUrl([...papers, ...crossrefItems]).slice(0, limit);
      }

      if (papers.length) {
        return { status: papers.length >= limit ? 'ok' : 'degraded', items: papers };
      }

      usedFallback = true;
    }
  } catch (error) {
    usedFallback = true;
    try {
      const openalexItems = await fetchOpenAlexBySourceId({
        openalexSourceId: SSRN_OPENALEX_SOURCE_ID,
        sourceId: 'ssrn',
        sourceName: 'SSRN',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: ssrnUrlFromDoi
      });
      if (openalexItems.length) {
        return { status: 'degraded', items: openalexItems, error: error.message };
      }
    } catch (_) {
      // ignore and continue
    }

    try {
      const crossrefItems = await fetchCrossrefByPrefix({
        prefix: '10.2139',
        sourceId: 'ssrn',
        sourceName: 'SSRN',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: ssrnUrlFromDoi
      });
      if (crossrefItems.length) {
        return { status: 'degraded', items: crossrefItems, error: error.message };
      }
    } catch (_) {
      // ignore and continue to firecrawl fallback
    }

    try {
      const fallback = await fetchFromFirecrawlForSource('ssrn', category, limit);
      const items = alignItemsToCategory(filterByDate(
        fallback.map(row => buildPaper('ssrn', 'SSRN', row, null)),
        dateFrom,
        dateTo
      ), category);
      return { status: items.length ? 'degraded' : 'blocked', items, error: error.message };
    } catch (_) {
      return { status: 'blocked', items: [], error: error.message };
    }
  }

  if (usedFallback) {
    try {
      const openalexItems = await fetchOpenAlexBySourceId({
        openalexSourceId: SSRN_OPENALEX_SOURCE_ID,
        sourceId: 'ssrn',
        sourceName: 'SSRN',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: ssrnUrlFromDoi
      });
      if (openalexItems.length) {
        return { status: 'degraded', items: openalexItems };
      }
    } catch (_) {
      // ignore and continue
    }

    try {
      const crossrefItems = await fetchCrossrefByPrefix({
        prefix: '10.2139',
        sourceId: 'ssrn',
        sourceName: 'SSRN',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: ssrnUrlFromDoi
      });
      if (crossrefItems.length) {
        return { status: 'degraded', items: crossrefItems };
      }
    } catch (_) {
      // ignore and continue to firecrawl fallback
    }
    try {
      const fallback = await fetchFromFirecrawlForSource('ssrn', category, limit);
      const items = alignItemsToCategory(filterByDate(
        fallback.map(row => buildPaper('ssrn', 'SSRN', row, null)),
        dateFrom,
        dateTo
      ), category);
      return { status: items.length ? 'degraded' : 'blocked', items };
    } catch (fallbackError) {
      return { status: 'blocked', items: [], error: fallbackError.message };
    }
  }

  return { status: 'blocked', items: [] };
}

async function fetchNBERPapersDetailed(category, limit = 5, options = {}) {
  const { dateFrom, dateTo } = options;
  let usedFallback = false;
  try {
    const html = await fetchText(NBER_URL);
    const $ = cheerio.load(html);
    let papers = [];

    $('a[href^="/papers/w"]').each((_, el) => {
      if (papers.length >= limit) return false;
      const title = cleanText($(el).text());
      const href = $(el).attr('href');
      if (!title || title.length < 8 || !href) return undefined;
      const rowText = cleanText($(el).closest('article, li, div').text());
      const date = normalizeDate(rowText);
      papers.push(buildPaper('nber', 'NBER', {
        title,
        url: `https://www.nber.org${href}`,
        date
      }, null));
      return undefined;
    });

    papers = alignItemsToCategory(filterByDate(dedupeByTitleAndUrl(papers), dateFrom, dateTo), category);
    if (papers.length >= limit) {
      return { status: 'ok', items: papers.slice(0, limit) };
    }

    const missing = Math.max(limit - papers.length, 0);
    if (missing > 0) {
      const openalexItems = await fetchOpenAlexBySourceId({
        openalexSourceId: NBER_OPENALEX_SOURCE_ID,
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit: missing,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      papers = dedupeByTitleAndUrl([...papers, ...openalexItems]).slice(0, limit);
    }

    const stillMissing = Math.max(limit - papers.length, 0);
    if (stillMissing > 0) {
      const crossrefItems = await fetchCrossrefByPrefix({
        prefix: '10.3386',
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit: stillMissing,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      papers = dedupeByTitleAndUrl([...papers, ...crossrefItems]).slice(0, limit);
    }

    if (papers.length) {
      return { status: papers.length >= limit ? 'ok' : 'degraded', items: papers };
    }

    usedFallback = true;
  } catch (error) {
    usedFallback = true;
    try {
      const openalexItems = await fetchOpenAlexBySourceId({
        openalexSourceId: NBER_OPENALEX_SOURCE_ID,
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      if (openalexItems.length) {
        return { status: 'degraded', items: openalexItems, error: error.message };
      }
    } catch (_) {
      // ignore and continue
    }

    try {
      const crossrefItems = await fetchCrossrefByPrefix({
        prefix: '10.3386',
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      if (crossrefItems.length) {
        return { status: 'degraded', items: crossrefItems, error: error.message };
      }
    } catch (_) {
      // ignore and continue to firecrawl fallback
    }

    try {
      const fallback = await fetchFromFirecrawlForSource('nber', category, limit);
      const items = alignItemsToCategory(filterByDate(
        fallback.map(row => buildPaper('nber', 'NBER', row, null)),
        dateFrom,
        dateTo
      ), category);
      return { status: items.length ? 'degraded' : 'blocked', items, error: error.message };
    } catch (_) {
      return { status: 'blocked', items: [], error: error.message };
    }
  }

  if (usedFallback) {
    try {
      const openalexItems = await fetchOpenAlexBySourceId({
        openalexSourceId: NBER_OPENALEX_SOURCE_ID,
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      if (openalexItems.length) {
        return { status: 'degraded', items: openalexItems };
      }
    } catch (_) {
      // ignore and continue
    }

    try {
      const crossrefItems = await fetchCrossrefByPrefix({
        prefix: '10.3386',
        sourceId: 'nber',
        sourceName: 'NBER',
        category,
        limit,
        dateFrom,
        dateTo,
        urlFromDoi: nberUrlFromDoi
      });
      if (crossrefItems.length) {
        return { status: 'degraded', items: crossrefItems };
      }
    } catch (_) {
      // ignore and continue to firecrawl fallback
    }
    try {
      const fallback = await fetchFromFirecrawlForSource('nber', category, limit);
      const items = alignItemsToCategory(filterByDate(
        fallback.map(row => buildPaper('nber', 'NBER', row, null)),
        dateFrom,
        dateTo
      ), category);
      return { status: items.length ? 'degraded' : 'blocked', items };
    } catch (fallbackError) {
      return { status: 'blocked', items: [], error: fallbackError.message };
    }
  }

  return { status: 'blocked', items: [] };
}

async function fetchAFAJOFPapersDetailed(category, limit = 10, options = {}) {
  const { dateFrom, dateTo } = options;
  try {
    const html = await fetchText(AFAJOF_URL);
    const $ = cheerio.load(html);
    let papers = [];

    $('.article-result-container').each((_, el) => {
      if (papers.length >= limit) return false;
      const title = cleanText($(el).find('p.has-medium-font-size a').first().text());
      const dateText = cleanText($(el).find('p').eq(1).text());
      const authors = cleanText($(el).find('strong').first().text());
      const abstract = cleanText($(el).find('p').eq(3).text());
      const doiMatch = dateText.match(/DOI:\s*([^\s|]+)/i);
      const doi = doiMatch ? cleanText(doiMatch[1]) : null;
      if (!title) return undefined;

      papers.push(buildPaper('afajof', 'AFAJOF', {
        title,
        authors,
        abstract,
        date: normalizeDate(dateText),
        doi,
        url: doi ? `https://doi.org/${doi}` : AFAJOF_URL
      }, null));
      return undefined;
    });

    if (category) {
      papers = papers.filter(p => p.category === category);
    }
    papers = papers.slice(0, limit);
    return { status: papers.length ? 'ok' : 'degraded', items: filterByDate(papers, dateFrom, dateTo) };
  } catch (error) {
    return { status: 'blocked', items: [], error: error.message };
  }
}

async function fetchERJPapersDetailed(category, limit = 5, options = {}) {
  const { dateFrom, dateTo } = options;
  try {
    const payload = {
      JournalID: ERJ_JOURNAL_ID,
      CurrentPage: 1,
      PageSize: Math.max(limit, 10)
    };
    const data = await fetchJson(`${ERJ_API_BASE}/IssueContentApi/GetIssueSimpleSearch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rows = Array.isArray(data.data) ? data.data : [];
    let papers = rows.map(row => buildPaper('erj', 'ERJ', {
      title: row.title,
      authors: row.authorsName,
      abstract: cheerio.load(row.abstract || '').text(),
      date: row.year ? `${row.year}-01-01` : null,
      url: `https://erj.ajcass.com/#/detail?id=${row.contentId || ''}`,
      pdfUrl: row.filePath ? `https://api.ajcass.com${row.filePath}` : null,
      rawMeta: {
        year: row.year,
        issue: row.issue,
        contentId: row.contentId
      }
    }, null));

    papers = papers.filter(p => p.category !== '未分类');
    if (category) {
      papers = papers.filter(p => p.category === category);
    }
    papers = papers.slice(0, limit);

    return { status: papers.length ? 'ok' : 'degraded', items: filterByDate(papers, dateFrom, dateTo) };
  } catch (error) {
    return { status: 'blocked', items: [], error: error.message };
  }
}

async function fetchGLSJPapersDetailed(category, limit = 5, options = {}) {
  const { dateFrom, dateTo } = options;
  try {
    const html = await fetchText(GLSJ_URL);
    const $ = cheerio.load(html);
    let papers = [];

    const seenUrls = new Set();
    $('a[href]').each((_, el) => {
      if (papers.length >= limit * 2) return false;
      const title = cleanText($(el).text());
      const href = $(el).attr('href');
      if (!href || !title || title.length < 8) return undefined;
      if (
        /check\.cnki|find\.cb\.cnki|采编系统|检测系统|腾云|投稿系统|协同采编|微信|论坛|发布会|年会|开通|办法|通知|公告|征稿/i
          .test(`${href} ${title}`)
      ) {
        return undefined;
      }
      const fullUrl = href.startsWith('http') ? href : new URL(href, GLSJ_URL).toString();
      if (!/wkTextContent\.aspx|Article|detail|Content/i.test(fullUrl)) return undefined;
      if (seenUrls.has(fullUrl)) return undefined;
      seenUrls.add(fullUrl);
      const paper = buildPaper('glsj', 'GLSJ', { title, url: fullUrl }, null);
      if (paper.category === '未分类') return undefined;
      papers.push(paper);
      return undefined;
    });

    if (!papers.length) {
      const fallback = await firecrawlSearch('管理科学学报 finance insurance econometrics china', Math.max(limit, 8));
      papers = fallback
        .filter(item => /cbpt\.cnki\.net|cnki/i.test(item.url || ''))
        .map(item => buildPaper('glsj', 'GLSJ', item, null))
        .filter(item => item.category !== '未分类')
        .slice(0, limit);
      if (category) papers = papers.filter(p => p.category === category);
      return { status: papers.length ? 'degraded' : 'blocked', items: filterByDate(papers, dateFrom, dateTo) };
    }

    if (category) papers = papers.filter(p => p.category === category);
    papers = papers.slice(0, limit);
    return { status: 'ok', items: filterByDate(papers, dateFrom, dateTo) };
  } catch (error) {
    return { status: 'blocked', items: [], error: error.message };
  }
}

async function fetchOpenAlexPapersDetailed(category, limit = 6, options = {}) {
  const { dateFrom, dateTo } = options;
  try {
    if (!category) {
      return { status: 'degraded', items: [] };
    }

    const rows = await openalex.getPapersByTopic(category, limit, { dateFrom, dateTo });
    const items = (rows || []).map(row => {
      let doi = null;
      if (row.url && /^https?:\/\/doi\.org\//i.test(row.url)) {
        doi = row.url.replace(/^https?:\/\/doi\.org\//i, '').trim();
      }
      return buildPaper('openalex', row.source || 'OpenAlex', {
        title: row.title,
        authors: row.authors,
        abstract: row.abstract,
        date: row.date,
        url: row.url,
        pdfUrl: row.pdfUrl,
        doi,
        category: row.category || category,
        subcategory: row.subcategory,
        citations: row.citations || 0,
        rawMeta: {
          openalexId: row.openalexId || null
        }
      }, row.category || category);
    }).filter(item => item.category === category);

    return {
      status: items.length ? 'ok' : 'degraded',
      items: filterByDate(items, dateFrom, dateTo)
    };
  } catch (error) {
    return { status: 'blocked', items: [], error: error.message };
  }
}

function mapDomainToSource(host) {
  if (/ssrn\.com$/.test(host)) return { source: 'SSRN', sourceId: 'ssrn' };
  if (/nber\.org$/.test(host)) return { source: 'NBER', sourceId: 'nber' };
  if (/afajof\.org$/.test(host)) return { source: 'AFAJOF', sourceId: 'afajof' };
  if (host === 'erj.ajcass.com') return { source: 'ERJ', sourceId: 'erj' };
  if (/cbpt\.cnki\.net$/.test(host)) return { source: 'GLSJ', sourceId: 'glsj' };
  return { source: '周国富老师推荐', sourceId: 'zhou_seeds' };
}

async function fetchScholarSeedsDetailed(category, limit = 30, options = {}) {
  const { dateFrom, dateTo } = options;
  try {
    const html = await fetchText(ZHOU_URL);
    const $ = cheerio.load(html);
    let seeds = [];

    $('a[href]').each((_, el) => {
      const href = cleanText($(el).attr('href'));
      const text = cleanText($(el).text());
      if (!href || !/^https?:\/\//i.test(href) || !text || text.length > 240) return undefined;

      let host = '';
      try {
        host = new URL(href).hostname.toLowerCase();
      } catch (_) {
        return undefined;
      }
      if (!ZHOU_WHITELIST.has(host)) return undefined;

      const mapped = mapDomainToSource(host);
      seeds.push(buildPaper('zhou_seeds', '周国富老师推荐', {
        title: text,
        url: href,
        category: inferCategory(text, ''),
        rawMeta: {
          mappedSource: mapped.source,
          mappedSourceId: mapped.sourceId
        }
      }, null));
      return undefined;
    });

    if (category) {
      seeds = seeds.filter(seed => seed.category === category);
    }

    const dedup = new Map();
    seeds.forEach(seed => {
      const key = `${(seed.title || '').toLowerCase()}|${seed.url || ''}`;
      if (!dedup.has(key)) dedup.set(key, seed);
    });
    seeds = Array.from(dedup.values()).slice(0, limit);

    return { status: seeds.length ? 'ok' : 'degraded', items: filterByDate(seeds, dateFrom, dateTo) };
  } catch (error) {
    return { status: 'blocked', items: [], error: error.message };
  }
}

const ADAPTERS = {
  openalex: fetchOpenAlexPapersDetailed,
  ssrn: fetchSSRNPapersDetailed,
  nber: fetchNBERPapersDetailed,
  afajof: fetchAFAJOFPapersDetailed,
  erj: fetchERJPapersDetailed,
  glsj: fetchGLSJPapersDetailed,
  zhou_seeds: fetchScholarSeedsDetailed
};

async function fetchFromSource(sourceId, category, limit = 5, options = {}) {
  const fn = ADAPTERS[sourceId];
  if (!fn) return { status: 'blocked', items: [], error: `Unknown source: ${sourceId}` };
  return fn(category, limit, options);
}

// Backward-compatible exports for existing callers.
async function fetchSSRNPapers(category, limit = 5, options = {}) {
  const result = await fetchSSRNPapersDetailed(category, limit, options);
  return result.items;
}

async function fetchNBERPapers(category, limit = 5, options = {}) {
  const result = await fetchNBERPapersDetailed(category, limit, options);
  return result.items;
}

async function fetchAFAJOFPapers(limit = 10, options = {}) {
  const result = await fetchAFAJOFPapersDetailed(null, limit, options);
  return result.items;
}

async function fetchCNKIPapers(journal, limit = 5, options = {}) {
  if (journal === 'ERJ') {
    const result = await fetchERJPapersDetailed(null, limit, options);
    return result.items;
  }
  const result = await fetchGLSJPapersDetailed(null, limit, options);
  return result.items;
}

async function fetchScholarLinks(limit = 30, options = {}) {
  const result = await fetchScholarSeedsDetailed(null, limit, options);
  return result.items.map(item => ({
    name: item.title,
    url: item.url,
    source: '周国富老师推荐'
  }));
}

module.exports = {
  ADAPTERS,
  fetchFromSource,
  fetchSSRNPapersDetailed,
  fetchNBERPapersDetailed,
  fetchOpenAlexPapersDetailed,
  fetchAFAJOFPapersDetailed,
  fetchERJPapersDetailed,
  fetchGLSJPapersDetailed,
  fetchScholarSeedsDetailed,
  fetchSSRNPapers,
  fetchNBERPapers,
  fetchAFAJOFPapers,
  fetchCNKIPapers,
  fetchScholarLinks,
  inferCategory,
  inferSubcategory
};
