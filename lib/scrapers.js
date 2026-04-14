/**
 * 轻量级爬虫 - 使用 axios + cheerio 解析静态页面
 * 不依赖 Firecrawl，直接请求网页并解析
 */

const axios = require('axios');
const cheerio = require('cheerio');

// 代理 URL（Vercel 部署后可用）
const PROXY_URL = process.env.PROXY_URL || '';

/**
 * 通过代理获取网页内容
 */
async function fetchWithProxy(url) {
  if (PROXY_URL) {
    const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
    const r = await axios.get(proxyUrl, { timeout: 15000 });
    return r.data;
  } else {
    // 无代理时直接请求
    const r = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return r.data;
  }
}

/**
 * 爬取周国富老师主页的论文链接
 * https://guofuzhou.github.io/zothers.html
 */
async function scrapeZhouGuofu() {
  try {
    const url = 'https://guofuzhou.github.io/zothers.html';
    const html = await fetchWithProxy(url);
    const $ = cheerio.load(html);

    const papers = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      // 筛选论文相关链接（PDF、学术平台）
      if (href && text &&
          (href.includes('pdf') ||
           href.includes('ssrn') ||
           href.includes('arxiv') ||
           href.includes('nber') ||
           href.includes('paper') ||
           href.includes('.com') ||
           href.includes('.org')) &&
          !href.includes('@') &&
          text.length > 5 &&
          text.length < 200) {
        papers.push({
          title: text,
          url: href.startsWith('http') ? href : `https://guofuzhou.github.io${href}`,
          source: '周国富老师推荐'
        });
      }
    });

    return papers;
  } catch (error) {
    console.error('ZhouGuofu scrape error:', error.message);
    return [];
  }
}

/**
 * 爬取 AFAJOF forthcoming articles
 * 需要查看是否有 API 或 RSS
 */
async function scrapeAFAJOF() {
  try {
    // 尝试 RSS
    const rssUrl = 'https://afajof.org/feed';
    const rss = await axios.get(rssUrl, { timeout: 15000 });
    const $ = cheerio.load(rss.data, { xmlMode: true });

    const papers = [];
    $('item').slice(0, 10).each((i, el) => {
      const title = $(el).find('title').text();
      const link = $(el).find('link').text();
      const pubDate = $(el).find('pubDate').text();

      if (title && link && !title.includes('Editorial Statistics')) {
        papers.push({
          title,
          url: link,
          date: new Date(pubDate).toISOString().split('T')[0],
          source: 'AFAJOF'
        });
      }
    });

    return papers;
  } catch (error) {
    console.error('AFAJOF scrape error:', error.message);
    return [];
  }
}

module.exports = {
  scrapeZhouGuofu,
  scrapeAFAJOF,
  fetchWithProxy
};
