/**
 * CNKI 系列数据源适配器
 * ERJ (Economic Research Journal) / GLSJ (管理科学学报)
 */

const cheerio = require('cheerio');

const ERJ_URL = 'https://erj.ajcass.com/#/index';
const GLSJ_URL = 'https://glsj.cbpt.cnki.net/WKB2/WebPublication/index.aspx?mid=GLSJ';

async function fetchCNKIPapers(journal, limit = 5) {
  const url = journal === 'ERJ' ? ERJ_URL : GLSJ_URL;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });
    const html = await response.text();
    return parseCNKIHtml(html, journal, limit);
  } catch (e) {
    console.error(`CNKI ${journal} fetch error:`, e.message);
    return [];
  }
}

function parseCNKIHtml(html, journal, limit) {
  const $ = cheerio.load(html);
  const papers = [];

  // CNKI 系列列表结构（选择器可能需要根据实际页面调整）
  $('.article, .article-list li, .paper, .article-item').slice(0, limit).each((i, el) => {
    const titleEl = $(el).find('h3, h4, .title, .article-title, a').first();
    const title = titleEl.text().trim();
    const link = titleEl.attr('href') || $(el).find('a').first().attr('href');
    const authors = $(el).find('.author, .authors, .info').first().text().trim();
    const date = $(el).find('.date, .time, .published').first().text().trim();

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
  // CNKI 日期格式可能是 2026-03-15 或 2026年03月15日
  const match = dateStr.match(/(\d{4})[年\-](\d{1,2})[月\-](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  return null;
}

function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('计量') || t.includes('econometric') || t.includes('回归') || t.includes('面板')) return '计量经济学';
  if (t.includes('机器学习') || t.includes('machine learning') || t.includes('深度学习')) return '金融机器学习';
  if (t.includes('行为金融') || t.includes('投资者情绪') || t.includes('behavioral')) return '行为金融';
  if (t.includes('巨灾') || t.includes('气候风险') || t.includes('catastrophe')) return '巨灾保险';
  if (t.includes('农业') || t.includes('农作物') || t.includes('crop')) return '农业保险';
  if (t.includes('普惠') || t.includes('农村金融') || t.includes('microfinance')) return '普惠金融';
  return '计量经济学';
}

module.exports = (req, res) => {
  const journal = req.query.journal || 'ERJ';
  const limit = parseInt(req.query.limit) || 5;

  fetchCNKIPapers(journal, limit).then(papers => {
    res.status(200).json({ papers, source: journal });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
};
