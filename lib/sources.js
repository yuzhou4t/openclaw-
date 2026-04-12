/**
 * 论文来源适配器汇总
 * SSRN / NBER / AFAJOF / CNKI / Scholars
 */

const cheerio = require('cheerio');

// ============ SSRN ============
const SSRN_BASE = 'https://www.ssrn.com/en';
const SSRN_CAT_MAP = {
  '计量经济学': 'econometrics',
  '行为金融': 'behavioral-finance',
  '金融机器学习': 'machine-learning-finance',
  '巨灾保险': 'risk-management',
  '农业保险': 'agri-finance',
  '普惠金融': 'financial-inclusion'
};

async function fetchSSRNPapers(category, limit = 5) {
  const path = SSRN_CAT_MAP[category] || 'general';
  try {
    const res = await fetch(`${SSRN_BASE}/lsr/${path}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    return parseSSRN(html, limit);
  } catch (e) {
    console.error('SSRN error:', e.message);
    return [];
  }
}

function parseSSRN(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];
  $('.paper, .paper-list-item, .abstract-panel').slice(0, limit).each((i, el) => {
    const title = $(el).find('.title, h3, .paper-title').first().text().trim();
    const authors = $(el).find('.authors, .author').first().text().trim();
    const date = $(el).find('.date, time').first().text().trim();
    const link = $(el).find('a').first().attr('href');
    if (title) {
      papers.push({
        id: `ssrn-${Date.now()}-${i}`,
        title,
        authors: authors || '',
        date: date || new Date().toISOString().split('T')[0],
        url: link ? (link.startsWith('http') ? link : `https://www.ssrn.com${link}`) : null,
        source: 'SSRN',
        category: inferCategory(title)
      });
    }
  });
  return papers;
}

// ============ NBER ============
const NBER_BASE = 'https://www.nber.org/papers';
const NBER_CAT_MAP = {
  '计量经济学': 'econometrics',
  '行为金融': 'finance',
  '金融机器学习': 'machine-learning',
  '巨灾保险': 'risk',
  '农业保险': 'agriculture',
  '普惠金融': 'development'
};

async function fetchNBERPapers(category, limit = 5) {
  const sub = NBER_CAT_MAP[category] || 'economics';
  try {
    const res = await fetch(`${NBER_BASE}/${sub}.html?page=1&perPage=${limit}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    return parseNBER(html, limit);
  } catch (e) {
    console.error('NBER error:', e.message);
    return [];
  }
}

function parseNBER(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];
  $('.paper-listing, .paper, .abstract-list-item').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h2 a, h3 a, a.title').first();
    const title = titleEl.text().trim();
    const link = titleEl.attr('href');
    const authors = $(el).find('.authors, .author').first().text().trim();
    const date = $(el).find('.date, .date-display').first().text().trim();
    if (title) {
      papers.push({
        id: `nber-${Date.now()}-${i}`,
        title,
        authors: authors || '',
        date: date || new Date().toISOString().split('T')[0],
        url: link ? (link.startsWith('http') ? link : `https://www.nber.org${link}`) : null,
        source: 'NBER',
        category: inferCategory(title)
      });
    }
  });
  return papers;
}

// ============ AFAJOF ============
const AFAJOF_BASE = 'https://afajof.org/forthcoming-articles';

async function fetchAFAJOFPapers(limit = 10) {
  try {
    const res = await fetch(AFAJOF_BASE, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    return parseAFAJOF(html, limit);
  } catch (e) {
    console.error('AFAJOF error:', e.message);
    return [];
  }
}

function parseAFAJOF(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];
  $('.article-item, .forthcoming-article, .article').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h3, h4, .title').first();
    const title = titleEl.text().trim();
    const link = $(el).find('a').first().attr('href');
    const authors = $(el).find('.author, .byline').first().text().trim();
    if (title) {
      papers.push({
        id: `afajof-${Date.now()}-${i}`,
        title,
        authors: authors || '',
        date: new Date().toISOString().split('T')[0],
        url: link ? (link.startsWith('http') ? link : `https://afajof.org${link}`) : null,
        source: 'AFAJOF',
        category: '行为金融'
      });
    }
  });
  return papers;
}

// ============ CNKI ============
const ERJ_URL = 'https://erj.ajcass.com/#/index';
const GLSJ_URL = 'https://glsj.cbpt.cnki.net/WKB2/WebPublication/index.aspx?mid=GLSJ';

async function fetchCNKIPapers(journal, limit = 5) {
  const url = journal === 'ERJ' ? ERJ_URL : GLSJ_URL;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
    });
    const html = await res.text();
    return parseCNKI(html, journal, limit);
  } catch (e) {
    console.error(`CNKI ${journal} error:`, e.message);
    return [];
  }
}

function parseCNKI(html, journal, limit) {
  const $ = cheerio.load(html);
  const papers = [];
  $('.article, .article-list li, .paper, .article-item').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h3, h4, .title, a').first();
    const title = titleEl.text().trim();
    const link = titleEl.attr('href') || $(el).find('a').first().attr('href');
    const authors = $(el).find('.author, .authors, .info').first().text().trim();
    const date = $(el).find('.date, .time').first().text().trim();
    if (title && title.length > 5) {
      papers.push({
        id: `cnki-${journal}-${Date.now()}-${i}`,
        title,
        authors: authors || '',
        date: parseCNKIDate(date) || new Date().toISOString().split('T')[0],
        url: link || '#',
        source: journal,
        category: inferCategory(title)
      });
    }
  });
  return papers;
}

function parseCNKIDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})[年\-](\d{1,2})[月\-](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  return null;
}

// ============ Scholars ============
const ZHOU_URL = 'https://guofuzhou.github.io/zothers.html';

async function fetchScholarLinks() {
  try {
    const res = await fetch(ZHOU_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    return parseZhouPage(html);
  } catch (e) {
    console.error('Zhou page error:', e.message);
    return [];
  }
}

function parseZhouPage(html) {
  const $ = cheerio.load(html);
  const links = [];
  $('a[href]').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (href && text && (href.startsWith('http://') || href.startsWith('https://'))) {
      if (!href.includes('@') && !href.startsWith('#')) {
        links.push({ name: text, url: href, source: '周国富老师推荐' });
      }
    }
  });
  return links;
}

// ============ 通用分类推断 ============
function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('econometric') || t.includes('causal') || t.includes('regression') || t.includes('panel') || t.includes('计量')) return '计量经济学';
  if (t.includes('machine learning') || t.includes('quantitative') || t.includes('deep learning') || t.includes('机器学习')) return '金融机器学习';
  if (t.includes('behavioral') || t.includes('sentiment') || t.includes('investor') || t.includes('行为金融')) return '行为金融';
  if (t.includes('catastrophe') || t.includes('climate') || t.includes('disaster') || t.includes('巨灾')) return '巨灾保险';
  if (t.includes('agricultural') || t.includes('crop') || t.includes('farm') || t.includes('农业')) return '农业保险';
  if (t.includes('inclusion') || t.includes('microfinance') || t.includes('rural') || t.includes('普惠')) return '普惠金融';
  return '行为金融';
}

// ============ 导出 ============
module.exports = {
  fetchSSRNPapers,
  fetchNBERPapers,
  fetchAFAJOFPapers,
  fetchCNKIPapers,
  fetchScholarLinks
};
