# 论文检索系统重新设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将论文推送从"海量检索"转变为"精选推荐"，新增6个数据源，更新分类体系为六大领域

**Architecture:** 新增 source adapters 层统一封装各来源（SSRN/NBER/AFAJOF/ERJ/GLSJ），上层通过 quality scorer 做精选，下层更新 push.js 接入新数据

**Tech Stack:** Node.js serverless functions (Vercel), cheerio 抓取, 现有 axios/缓存架构

---

## 文件结构

```
api/
├── push.js          # 修改: 接入新来源、更新精选逻辑
├── papers.js        # 修改: 六大分类导航
├── ssrn.js          # 创建: SSRN 数据源适配器
├── nber.js          # 创建: NBER 数据源适配器
├── afajof.js        # 创建: AFAJOF 数据源适配器
├── cnki.js          # 创建: CNKI系列(ERJ/GLSJ)适配器
├── scholars.js       # 创建: 周国富老师主页链接解析
├── scorer.js         # 创建: 质量评分模块
└── categories.js    # 修改: 更新分类关键词
```

---

## Task 1: 创建 SSRN 数据源适配器

**Files:**
- Create: `api/ssrn.js`
- Test: `curl -s https://paperhub-liart.vercel.app/api/ssrn | head -c 500`

- [ ] **Step 1: 创建 api/ssrn.js**

```javascript
/**
 * SSRN 数据源适配器
 * 抓取 SSRN 论文列表
 */

const BASE_URL = 'https://www.ssrn.com/en';

async function fetchSSRNPapers(category, limit = 5) {
  // SSRN 分类页示例: https://www.ssrn.com/en/lsr/finance
  const categoryMap = {
    '计量经济学': 'econometrics',
    '行为金融': 'behavioral-finance',
    '金融机器学习': 'machine-learning-finance',
    '巨灾保险': 'risk-management',
    '农业保险': 'agri-finance',
    '普惠金融': 'financial-inclusion'
  };

  const path = categoryMap[category] || 'general';
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
  // cheerio 解析
  const $ = cheerio.load(html);
  const papers = [];

  // SSRN 论文列表在 .paper-list 或类似结构
  $('.paper').slice(0, limit).each((i, el) => {
    const title = $(el).find('.title').text().trim();
    const authors = $(el).find('.authors').text().trim();
    const date = $(el).find('.date').text().trim();
    const link = $(el).find('a').attr('href');

    if (title) {
      papers.push({
        id: `ssrn-${Date.now()}-${i}`,
        title,
        authors,
        date,
        url: link ? `https://www.ssrn.com${link}` : null,
        source: 'SSRN',
        category: inferCategory(title)
      });
    }
  });

  return papers;
}

function inferCategory(title) {
  // 简单关键词匹配
  const t = title.toLowerCase();
  if (t.includes('econometric') || t.includes('causal')) return '计量经济学';
  if (t.includes('machine learning') || t.includes('quantitative')) return '金融机器学习';
  if (t.includes('behavioral') || t.includes('sentiment')) return '行为金融';
  if (t.includes('catastrophe') || t.includes('climate')) return '巨灾保险';
  if (t.includes('agricultural') || t.includes('crop')) return '农业保险';
  if (t.includes('inclusion') || t.includes('microfinance')) return '普惠金融';
  return '行为金融'; // 默认
}

module.exports = { fetchSSRNPapers };
```

- [ ] **Step 2: 测试 SSRN 模块**

Run: `curl -s https://paperhub-liart.vercel.app/api/ssrn?category=计量经济学 | python3 -c "import sys,json; print(json.load(sys.stdin))"`

Expected: 返回 SSRN 论文列表或错误

- [ ] **Step 3: 提交**

```bash
git add api/ssrn.js
git commit -m "feat: 添加 SSRN 数据源适配器"
```

---

## Task 2: 创建 NBER 数据源适配器

**Files:**
- Create: `api/nber.js`

- [ ] **Step 1: 创建 api/nber.js**

```javascript
/**
 * NBER 数据源适配器
 * 抓取 NBER 论文列表
 */

const BASE_URL = 'https://www.nber.org/papers';

async function fetchNBERPapers(category, limit = 5) {
  const categoryMap = {
    '计量经济学': 'econometrics',
    '行为金融': 'finance',
    '金融机器学习': 'machine-learning',
    '巨灾保险': 'risk',
    '农业保险': 'agriculture',
    '普惠金融': 'development'
  };

  const sub = categoryMap[category] || 'economics';
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
  $('.paper-listing').slice(0, limit).each((i, el) => {
    const title = $(el).find('h2 a').text().trim();
    const link = $(el).find('h2 a').attr('href');
    const authors = $(el).find('.authors').text().trim();
    const date = $(el).find('.date').text().trim();

    if (title) {
      papers.push({
        id: `nber-${Date.now()}-${i}`,
        title,
        authors,
        date,
        url: link ? `https://www.nber.org${link}` : null,
        source: 'NBER',
        category: inferCategory(title)
      });
    }
  });

  return papers;
}

function inferCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('econometric') || t.includes('regression') || t.includes('causal')) return '计量经济学';
  if (t.includes('machine learning') || t.includes('prediction')) return '金融机器学习';
  if (t.includes('behavioral') || t.includes('investor')) return '行为金融';
  if (t.includes('climate') || t.includes('disaster')) return '巨灾保险';
  if (t.includes('agricultural') || t.includes('farm')) return '农业保险';
  if (t.includes('financial inclusion') || t.includes('poverty')) return '普惠金融';
  return '计量经济学';
}

module.exports = { fetchNBERPapers };
```

- [ ] **Step 2: 测试 NBER 模块**

Run: `curl -s https://paperhub-liart.vercel.app/api/nber | python3 -c "import sys,json; print(json.load(sys.stdin))"`

- [ ] **Step 3: 提交**

```bash
git add api/nber.js
git commit -m "feat: 添加 NBER 数据源适配器"
```

---

## Task 3: 创建 AFAJOF 数据源适配器

**Files:**
- Create: `api/afajof.js`

- [ ] **Step 1: 创建 api/afajof.js**

```javascript
/**
 * AFAJOF (American Finance Association) 数据源适配器
 * 抓取 forthcoming articles
 */

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

  $('.article-item, .forthcoming-article').slice(0, limit).each((i, el) => {
    const title = $(el).find('h3, .title').text().trim();
    const link = $(el).find('a').attr('href');
    const authors = $(el).find('.author, .byline').text().trim();

    if (title) {
      papers.push({
        id: `afajof-${Date.now()}-${i}`,
        title,
        authors,
        date: new Date().toISOString().split('T')[0],
        url: link ? `https://afajof.org${link}` : null,
        source: 'AFAJOF',
        category: '行为金融'
      });
    }
  });

  return papers;
}

module.exports = { fetchAFAJOFPapers };
```

- [ ] **Step 2: 测试**

Run: `curl -s https://paperhub-liart.vercel.app/api/afajof | python3 -c "import sys,json; print(json.load(sys.stdin))"`

- [ ] **Step 3: 提交**

```bash
git add api/afajof.js
git commit -m "feat: 添加 AFAJOF 数据源适配器"
```

---

## Task 4: 创建 CNKI (ERJ/GLSJ) 数据源适配器

**Files:**
- Create: `api/cnki.js`

- [ ] **Step 1: 创建 api/cnki.js**

```javascript
/**
 * CNKI 系列数据源适配器
 * ERJ (Economic Research Journal) / GLSJ (管理科学学报)
 */

const ERJ_URL = 'https://erj.ajcass.com/#/index';
const GLSJ_URL = 'https://glsj.cbpt.cnki.net/WKB2/WebPublication/index.aspx?mid=GLSJ';

const CATEGORY_MAP = {
  '计量经济学': 'econometrics',
  '行为金融': 'behavioral-finance',
  '金融机器学习': 'ml-finance',
  '巨灾保险': 'catastrophe',
  '农业保险': 'agri-insurance',
  '普惠金融': 'financial-inclusion'
};

async function fetchCNKIPapers(journal, category, limit = 5) {
  const url = journal === 'ERJ' ? ERJ_URL : GLSJ_URL;

  try {
    // CNKI 可能需要特殊处理（cookie session）
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

  // CNKI 列表结构可能不同，需要根据实际页面调整
  $('.article, .article-list li').slice(0, limit).each((i, el) => {
    const title = $(el).find('h3, .title, a').first().text().trim();
    const link = $(el).find('a').first().attr('href');
    const authors = $(el).find('.author, .info').text().trim();
    const date = $(el).find('.date, .time').text().trim();

    if (title) {
      papers.push({
        id: `cnki-${journal}-${Date.now()}-${i}`,
        title,
        authors,
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
  if (t.includes('计量') || t.includes('econometric')) return '计量经济学';
  if (t.includes('机器学习') || t.includes('machine learning')) return '金融机器学习';
  if (t.includes('行为金融') || t.includes('投资者情绪')) return '行为金融';
  if (t.includes('巨灾') || t.includes('气候风险')) return '巨灾保险';
  if (t.includes('农业') || t.includes('农作物')) return '农业保险';
  if (t.includes('普惠') || t.includes('农村金融')) return '普惠金融';
  return '计量经济学';
}

module.exports = { fetchCNKIPapers };
```

- [ ] **Step 2: 提交**

```bash
git add api/cnki.js
git commit -m "feat: 添加 CNKI (ERJ/GLSJ) 数据源适配器"
```

---

## Task 5: 创建周国富老师主页解析器

**Files:**
- Create: `api/scholars.js`

- [ ] **Step 1: 创建 api/scholars.js**

```javascript
/**
 * 学者主页解析器
 * 周国富老师个人主页: https://guofuzhou.github.io/zothers.html
 */

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

  // 解析页面上的链接
  $('#content, .zothers, main, article').find('a').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');

    if (href && text && href.startsWith('http')) {
      links.push({
        name: text,
        url: href,
        source: '周国富老师推荐'
      });
    }
  });

  return links;
}

// 从学者链接列表获取论文（需要进一步处理）
async function fetchPapersFromScholarLinks(links, limit = 10) {
  const papers = [];

  for (const link of links.slice(0, limit)) {
    try {
      // 根据链接类型判断如何获取论文
      const response = await fetch(link.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (link.url.includes('ssrn')) {
        // SSRN 链接
        const html = await response.text();
        // 解析 SSRN 论文
      } else if (link.url.includes('nber')) {
        // NBER 链接
        const html = await response.text();
        // 解析 NBER 论文
      }

      papers.push({
        id: `scholar-${Date.now()}-${i}`,
        title: link.name,
        url: link.url,
        source: '周国富老师推荐',
        category: '行为金融' // 默认
      });
    } catch (e) {
      console.error(`Failed to fetch ${link.url}:`, e.message);
    }
  }

  return papers;
}

module.exports = { fetchScholarLinks, fetchPapersFromScholarLinks };
```

- [ ] **Step 2: 提交**

```bash
git add api/scholars.js
git commit -m "feat: 添加周国富老师主页解析器"
```

---

## Task 6: 创建质量评分模块

**Files:**
- Create: `api/scorer.js`

- [ ] **Step 1: 创建 api/scorer.js**

```javascript
/**
 * 质量评分模块
 * 综合打分 = 来源声望(40%) + 引用量(30%) + 作者/机构(30%)
 */

const SOURCE_WEIGHTS = {
  'NBER': 0.95,
  'SSRN': 0.85,
  'AFAJOF': 0.90,
  'ERJ': 0.90,
  'GLSJ': 0.90,
  'arXiv': 0.60,
  '周国富老师推荐': 0.80
};

const AUTHOR_WEIGHTS = {
  // 知名学者列表（可扩展）
  'Fama': 0.90,
  'French': 0.90,
  'Shiller': 0.90,
  'Hansen': 0.90,
  'Rubin': 0.90,
  // 诺贝尔奖得主等
};

function scorePaper(paper) {
  const sourceScore = SOURCE_WEIGHTS[paper.source] || 0.50;

  // 引用量评分（归一化，假设最高引用10000）
  const citations = paper.citations || 0;
  const citationScore = Math.min(citations / 10000, 1);

  // 作者/机构评分
  const authorScore = calculateAuthorScore(paper.authors || '');

  // 综合评分
  const totalScore = sourceScore * 0.4 + citationScore * 0.3 + authorScore * 0.3;

  return {
    ...paper,
    qualityScore: Math.round(totalScore * 100) / 100,
    sourceScore,
    citationScore,
    authorScore
  };
}

function calculateAuthorScore(authors) {
  if (!authors) return 0.50;

  let score = 0.50;
  const authorList = authors.toLowerCase();

  for (const [name, weight] of Object.entries(AUTHOR_WEIGHTS)) {
    if (authorList.includes(name.toLowerCase())) {
      score = Math.max(score, weight);
    }
  }

  return score;
}

// 精选：从候选论文中选出 top N
function selectTopPapers(papers, category, limit = 4) {
  return papers
    .filter(p => !category || p.category === category)
    .map(p => scorePaper(p))
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit);
}

module.exports = { scorePaper, selectTopPapers, SOURCE_WEIGHTS };
```

- [ ] **Step 2: 提交**

```bash
git add api/scorer.js
git commit -m "feat: 添加质量评分模块"
```

---

## Task 7: 更新分类关键词和映射

**Files:**
- Modify: `api/categories.js`

- [ ] **Step 1: 更新 api/categories.js**

替换现有分类为六大分类：

```javascript
// 六大分类定义
const CATEGORIES = {
  '计量经济学': {
    keywords: ['econometrics', 'time series', 'panel data', 'causal inference', 'regression', 'VAR', 'cointegration', 'GARCH', '计量经济'],
    sources: ['NBER', 'ERJ']
  },
  '金融机器学习': {
    keywords: ['machine learning', 'deep learning', 'quantitative', 'algorithmic trading', 'prediction model', 'neural network', '金融机器学习'],
    sources: ['SSRN', 'arXiv']
  },
  '行为金融': {
    keywords: ['behavioral finance', 'investor sentiment', 'market anomaly', 'overconfidence', 'loss aversion', '行为金融'],
    sources: ['AFAJOF', 'SSRN']
  },
  '巨灾保险': {
    keywords: ['catastrophe insurance', 'climate risk', 'reinsurance', 'hurricane', 'earthquake', '巨灾保险', '气候风险'],
    sources: ['SSRN', 'NBER']
  },
  '农业保险': {
    keywords: ['agricultural insurance', 'crop insurance', 'weather index', 'farm insurance', '农业保险', '农作物保险'],
    sources: ['ERJ', 'GLSJ']
  },
  '普惠金融': {
    keywords: ['financial inclusion', 'microfinance', 'rural finance', 'digital finance', '普惠金融', '农村金融'],
    sources: ['ERJ', 'GLSJ', 'SSRN']
  }
};
```

- [ ] **Step 2: 提交**

```bash
git add api/categories.js
git commit -m "refactor: 更新为六大分类体系"
```

---

## Task 8: 更新 push.js 接入新数据源

**Files:**
- Modify: `api/push.js`

- [ ] **Step 1: 重写 getAllPapersForPush 函数**

```javascript
const ssrn = require('./ssrn');
const nber = require('./nber');
const afajof = require('./afajof');
const cnki = require('./cnki');
const scholars = require('./scholars');
const { selectTopPapers } = require('./scorer');

// 分类到来源的映射
const CATEGORY_SOURCES = {
  '计量经济学': ['nber', 'cnki'],
  '金融机器学习': ['ssrn', 'nber'],
  '行为金融': ['ssrn', 'afajof'],
  '巨灾保险': ['ssrn', 'nber'],
  '农业保险': ['cnki', 'erj'],
  '普惠金融': ['cnki', 'ssrn']
};

async function getAllPapersForPush() {
  const categories = Object.keys(CATEGORY_SOURCES);
  let allPapers = [];

  // 并行获取所有来源的论文
  const [ssrnPapers, nberPapers, afajofPapers, cnkiErjPapers, cnkiGlsjPapers] = await Promise.all([
    ssrn.fetchSSRNPapers('行为金融', 5),
    nber.fetchNBERPapers('计量经济学', 5),
    afajof.fetchAFAJOFPapers(5),
    cnki.fetchCNKIPapers('ERJ', '计量经济学', 3),
    cnki.fetchCNKIPapers('GLSJ', '普惠金融', 3)
  ]);

  // 合并所有论文
  allPapers = [
    ...ssrnPapers,
    ...nberPapers,
    ...afajofPapers,
    ...cnkiErjPapers,
    ...cnkiGlsjPapers
  ];

  // 去重（基于标题）
  const seen = new Set();
  allPapers = allPapers.filter(p => {
    const key = p.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return allPapers;
}

// 修改筛选逻辑：每分类精选3-4篇
function selectPapersForPush(papers) {
  const categories = ['计量经济学', '金融机器学习', '行为金融', '巨灾保险', '农业保险', '普惠金融'];
  const selected = [];

  for (const cat of categories) {
    const catPapers = papers.filter(p => p.category === cat);
    const top = selectTopPapers(catPapers, cat, 4);
    selected.push(...top);
  }

  return selected;
}
```

- [ ] **Step 2: 更新路由**

```javascript
// 保留现有 /api/push/daily 和 /api/push/history 端点
// 但修改内部逻辑使用新的 selectPapersForPush
```

- [ ] **Step 3: 测试**

Run: `curl -s https://paperhub-liart.vercel.app/api/push/daily | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {len(d[\"papers\"])}')"`

- [ ] **Step 4: 提交**

```bash
git add api/push.js
git commit -m "refactor: push.js 接入新数据源和精选逻辑"
```

---

## Task 9: 更新前端分类导航

**Files:**
- Modify: `api/categories.js` (已有)
- Modify: `js/app.js` (更新分类显示)

- [ ] **Step 1: 检查现有分类导航代码**

确认 js/app.js 中的 nav-items 和 mobile-nav-items 使用分类

- [ ] **Step 2: 更新分类名称**

如果需要，调整分类显示名称

- [ ] **Step 3: 提交**

```bash
git add js/app.js
git commit -m "chore: 更新前端分类导航适配六大分类"
```

---

## Task 10: 验证完整流程

- [ ] **Step 1: 测试所有来源**

```bash
curl -s https://paperhub-liart.vercel.app/api/ssrn | python3 -c "import sys,json; print(json.load(sys.stdin))"
curl -s https://paperhub-liart.vercel.app/api/nber | python3 -c "import sys,json; print(json.load(sys.stdin))"
curl -s https://paperhub-liart.vercel.app/api/afajof | python3 -c "import sys,json; print(json.load(sys.stdin))"
```

- [ ] **Step 2: 测试推送API**

```bash
curl -s https://paperhub-liart.vercel.app/api/push/daily | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Total: {len(d[\"papers\"])} papers')
cats = {}
for p in d.get('papers', []):
    cats[p.get('category', 'unknown')] = cats.get(p.get('category', 'unknown'), 0) + 1
print('By category:', cats)
"
```

- [ ] **Step 3: 验证前端展示**

打开 https://paperhub-liart.vercel.app 检查今日推送和分类导航

---

## 实施顺序

1. Task 1-5: 创建各数据源适配器（可并行）
2. Task 6: 创建质量评分模块
3. Task 7: 更新分类体系
4. Task 8: 更新 push.js（核心变更）
5. Task 9: 前端适配
6. Task 10: 验证

---

## 注意事项

- **CNKI 可能需要登录/cookie**: ERJ 和 GLSJ 可能有访问限制，需要测试实际可用性
- **SSRN/NBER robots.txt**: 遵守爬虫规则
- **cheerio 依赖**: 新增 adapters 需要 cheerio，请先 `npm install cheerio`
- **爸爸验证**: 各来源 HTML 结构可能变化，需要根据实际页面调整选择器
