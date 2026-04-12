/**
 * NBER 数据源适配器
 */

const cheerio = require('cheerio');

const BASE_URL = 'https://www.nber.org/papers';

const CATEGORY_MAP = {
  '计量经济学': 'econometrics',
  '行为金融': 'finance',
  '金融机器学习': 'machine-learning',
  '巨灾保险': 'risk',
  '农业保险': 'agriculture',
  '普惠金融': 'development'
};

async function fetchNBERPapers(category, limit = 5) {
  const sub = CATEGORY_MAP[category] || 'economics';
  const url = `${BASE_URL}/${sub}.html?page=1&perPage=${limit}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    return parseNBERHtml(html, limit);
  } catch (e) {
    console.error('NBER fetch error:', e.message);
    return [];
  }
}

function parseNBERHtml(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];

  // NBER 列表结构
  $('.paper-listing, .paper, .abstract-list-item').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h2 a, h3 a, .title a, a.title').first();
    const title = titleEl.text().trim();
    const link = titleEl.attr('href');
    const authors = $(el).find('.authors, .author, .byline').first().text().trim();
    const date = $(el).find('.date, .date-display, time').first().text().trim();

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

function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('econometric') || t.includes('regression') || t.includes('causal') || t.includes('panel')) return '计量经济学';
  if (t.includes('machine learning') || t.includes('prediction') || t.includes('neural')) return '金融机器学习';
  if (t.includes('behavioral') || t.includes('investor') || t.includes('sentiment')) return '行为金融';
  if (t.includes('climate') || t.includes('disaster') || t.includes('hurricane')) return '巨灾保险';
  if (t.includes('agricultural') || t.includes('farm') || t.includes('crop')) return '农业保险';
  if (t.includes('financial inclusion') || t.includes('poverty') || t.includes('development')) return '普惠金融';
  return '计量经济学';
}

module.exports = (req, res) => {
  const category = req.query.category || '计量经济学';
  const limit = parseInt(req.query.limit) || 5;

  fetchNBERPapers(category, limit).then(papers => {
    res.status(200).json({ papers, source: 'NBER' });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
};
