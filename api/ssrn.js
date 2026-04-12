/**
 * SSRN 数据源适配器
 */

const cheerio = require('cheerio');

const BASE_URL = 'https://www.ssrn.com/en';

const CATEGORY_MAP = {
  '计量经济学': 'econometrics',
  '行为金融': 'behavioral-finance',
  '金融机器学习': 'machine-learning-finance',
  '巨灾保险': 'risk-management',
  '农业保险': 'agri-finance',
  '普惠金融': 'financial-inclusion'
};

async function fetchSSRNPapers(category, limit = 5) {
  const path = CATEGORY_MAP[category] || 'general';
  const url = `${BASE_URL}/lsr/${path}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    return parseSSRNHtml(html, limit);
  } catch (e) {
    console.error('SSRN fetch error:', e.message);
    return [];
  }
}

function parseSSRNHtml(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];

  // SSRN 论文列表选择器需要根据实际页面调整
  $('.paper, .paper-list-item, .abstract-panel').slice(0, limit).each((i, el) => {
    const title = $(el).find('.title, h3, .paper-title').first().text().trim();
    const authors = $(el).find('.authors, .author, .byline').first().text().trim();
    const date = $(el).find('.date, .posted-date, time').first().text().trim();
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

function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('econometric') || t.includes('causal') || t.includes('regression')) return '计量经济学';
  if (t.includes('machine learning') || t.includes('quantitative') || t.includes('deep learning')) return '金融机器学习';
  if (t.includes('behavioral') || t.includes('sentiment') || t.includes('investor')) return '行为金融';
  if (t.includes('catastrophe') || t.includes('climate') || t.includes('disaster')) return '巨灾保险';
  if (t.includes('agricultural') || t.includes('crop') || t.includes('farm')) return '农业保险';
  if (t.includes('inclusion') || t.includes('microfinance') || t.includes('rural')) return '普惠金融';
  return '行为金融';
}

module.exports = (req, res) => {
  const category = req.query.category || '计量经济学';
  const limit = parseInt(req.query.limit) || 5;

  fetchSSRNPapers(category, limit).then(papers => {
    res.status(200).json({ papers, source: 'SSRN' });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
};
