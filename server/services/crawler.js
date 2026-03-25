/**
 * 论文爬虫服务
 * 支持从 arXiv、SSRN 等平台获取论文
 */
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const config = require('../config');
const paperService = require('./paperService');

// 分类映射
const CATEGORY_MAP = {
  // arXiv 分类到内部分类
  'cs.CL': { category: 'llm', subcategory: '基础模型' },
  'cs.LG': { category: 'llm', subcategory: '基础模型' },
  'cs.AI': { category: 'llm', subcategory: 'AI Agent' },
  'cs.CL': { category: 'llm', subcategory: '指令微调' },
  'q-fin.GN': { category: 'behavior', subcategory: '行为资产定价' },
  'q-fin.MF': { category: 'behavior', subcategory: '市场异象' },
  'q-fin.PR': { category: 'catastrophe', subcategory: '再保险' },
  'q-fin.RM': { category: 'agriculture', subcategory: '农业信贷' }
};

/**
 * 从 arXiv 获取论文
 */
async function crawlArxiv(category, maxResults = 50) {
  const url = 'http://export.arxiv.org/api/query';
  const params = {
    search_query: `cat:${category}`,
    start: 0,
    max_results: maxResults,
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  };

  try {
    const response = await axios.get(url, { params });
    const $ = cheerio.load(response.data, { xmlMode: true });

    const papers = [];

    $('entry').each((_, element) => {
      const $el = $(element);
      const arxivId = $el.find('id').text().split('/').pop();
      const title = $el.find('title').text().trim().replace(/\n/g, ' ');
      const abstract = $el.find('summary').text().trim().replace(/\n/g, ' ');
      const authors = $el.find('author name').map((_, a) => $(a).text()).get();
      const published = $el.find('published').text();
      const updated = $el.find('updated').text();
      const pdfUrl = $el.find('link[title="pdf"]').attr('href');

      // 提取分类
      const cats = $el.find('category').map((_, c) => $(c).attr('term')).get();
      const primaryCat = cats[0] || category;
      const mapped = CATEGORY_MAP[primaryCat] || { category: 'llm', subcategory: '基础模型' };

      // 提取标签
      const tags = $el.find('arxiv\\:keyword, category')
        .map((_, t) => $(t).attr('term') || $(t).text())
        .get()
        .filter(t => t && t.length < 30);

      papers.push({
        title,
        authors,
        abstract: abstract.substring(0, 1000),
        source: `arXiv (${primaryCat})`,
        publishDate: published.split('T')[0],
        updateDate: updated.split('T')[0],
        url: $el.find('id').text(),
        pdfUrl,
        category: mapped.category,
        subcategory: mapped.subcategory,
        citations: 0,
        tags: [...new Set([...tags, primaryCat])]
      });
    });

    return papers;
  } catch (error) {
    console.error(`❌ 爬取 arXiv ${category} 失败:`, error.message);
    return [];
  }
}

/**
 * 从 SSRN 获取金融论文
 */
async function crawlSSRN(keyword = 'behavioral finance', maxResults = 20) {
  const url = 'https://papers.ssrn.com/sol3/JELCodes.cfm';
  // SSRN 需要更复杂的处理，这里简化示例

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    });

    const $ = cheerio.load(response.data);
    const papers = [];

    // 简化处理 - 实际需要更复杂的解析
    // 这里返回空数组作为占位

    return papers;
  } catch (error) {
    console.error('❌ 爬取 SSRN 失败:', error.message);
    return [];
  }
}

/**
 * 从 Semantic Scholar 获取引用数
 */
async function getCitations(paperTitle) {
  try {
    const apiUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
    const response = await axios.get(apiUrl, {
      params: {
        query: paperTitle,
        limit: 1,
        fields: 'citationCount'
      }
    });

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].citationCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('获取引用数失败:', error.message);
    return 0;
  }
}

/**
 * 保存论文到数据库（去重）
 */
async function savePapers(papers) {
  let saved = 0;
  let skipped = 0;

  for (const paper of papers) {
    try {
      // 检查是否已存在
      const existing = await require('../models').Paper.findOne({
        where: { title: paper.title }
      });

      if (existing) {
        // 更新引用数
        const citations = await getCitations(paper.title);
        if (citations > existing.citations) {
          await existing.update({ citations });
          console.log(`  📈 更新引用: ${paper.title.substring(0, 30)}... (${citations})`);
        }
        skipped++;
        continue;
      }

      // 创建新论文
      await paperService.addPaper(paper);
      saved++;
      console.log(`  ✅ 新增论文: ${paper.title.substring(0, 30)}...`);
    } catch (error) {
      console.error(`  ❌ 保存失败: ${error.message}`);
    }
  }

  return { saved, skipped };
}

/**
 * 执行全量爬取
 */
async function crawlAll() {
  console.log('\n🚀 开始爬取论文...\n');

  const arxivCategories = config.crawler.arxiv.categories;

  for (const category of arxivCategories) {
    console.log(`📂 正在爬取 arXiv ${category}...`);
    const papers = await crawlArxiv(category, config.crawler.arxiv.maxResults);
    console.log(`  获取到 ${papers.length} 篇论文`);
    await savePapers(papers);
  }

  console.log('\n✅ 爬取完成!\n');
}

/**
 * 增量爬取（只获取最新论文）
 */
async function crawlLatest() {
  console.log('\n🔄 增量爬取最新论文...\n');

  const arxivCategories = config.crawler.arxiv.categories;

  for (const category of arxivCategories) {
    // 只获取最新的 10 篇
    const papers = await crawlArxiv(category, 10);
    const result = await savePapers(papers);
    console.log(`📂 ${category}: 新增 ${result.saved}, 跳过 ${result.skipped}`);
  }

  console.log('\n✅ 增量爬取完成!\n');
}

/**
 * 设置定时任务
 */
function setupCronJobs() {
  // 每天 8:00 执行爬取
  cron.schedule(config.crawler.arxiv.crawlInterval, () => {
    console.log('\n⏰ 定时任务: 爬取论文');
    crawlLatest();
  });

  // 每小时更新引用数
  cron.schedule('0 * * * *', () => {
    console.log('\n⏰ 定时任务: 更新引用数');
    updateCitations();
  });
}

/**
 * 更新所有论文的引用数
 */
async function updateCitations() {
  const { Paper } = require('../models');

  const papers = await Paper.findAll({
    limit: 100, // 每次更新 100 篇
    order: [['citations', 'ASC']] // 优先更新低引用论文
  });

  for (const paper of papers) {
    const citations = await getCitations(paper.title);
    if (citations > paper.citations) {
      await paper.update({ citations });
      console.log(`  📈 ${paper.title.substring(0, 30)}: ${citations} citations`);
    }
  }
}

module.exports = {
  crawlArxiv,
  crawlSSRN,
  crawlAll,
  crawlLatest,
  setupCronJobs,
  getCitations,
  updateCitations
};
