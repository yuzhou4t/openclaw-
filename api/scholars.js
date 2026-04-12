/**
 * 学者主页解析器
 * 周国富老师个人主页: https://guofuzhou.github.io/zothers.html
 */

const cheerio = require('cheerio');

const ZHOU_URL = 'https://guofuzhou.github.io/zothers.html';

async function fetchScholarLinks() {
  try {
    const response = await fetch(ZHOU_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    return parseZhouPage(html);
  } catch (e) {
    console.error('Zhou page fetch error:', e.message);
    return [];
  }
}

function parseZhouPage(html) {
  const $ = cheerio.load(html);
  const links = [];

  // 解析页面上的链接 - 选择器需要根据实际页面调整
  $('a[href]').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');

    // 只保留外部链接
    if (href && text && (href.startsWith('http://') || href.startsWith('https://'))) {
      // 过滤掉邮箱和锚点链接
      if (!href.includes('@') && !href.startsWith('#')) {
        links.push({
          name: text,
          url: href,
          source: '周国富老师推荐'
        });
      }
    }
  });

  return links;
}

module.exports = (req, res) => {
  fetchScholarLinks().then(links => {
    res.status(200).json({ links, source: '周国富老师主页' });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
};
