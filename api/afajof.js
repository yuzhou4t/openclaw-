/**
 * AFAJOF (American Finance Association) 数据源适配器
 */

const cheerio = require('cheerio');

const BASE_URL = 'https://afajof.org/forthcoming-articles';

async function fetchAFAJOFPapers(limit = 10) {
  try {
    const response = await fetch(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    return parseAFAJOFHtml(html, limit);
  } catch (e) {
    console.error('AFAJOF fetch error:', e.message);
    return [];
  }
}

function parseAFAJOFHtml(html, limit) {
  const $ = cheerio.load(html);
  const papers = [];

  // AFAJOF 列表结构
  $('.article-item, .forthcoming-article, .article, .article-listing').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h3, h4, .title, .article-title').first();
    const title = titleEl.text().trim();
    const link = $(el).find('a').first().attr('href');
    const authors = $(el).find('.author, .byline, .authors').first().text().trim();

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

module.exports = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  fetchAFAJOFPapers(limit).then(papers => {
    res.status(200).json({ papers, source: 'AFAJOF' });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
};
