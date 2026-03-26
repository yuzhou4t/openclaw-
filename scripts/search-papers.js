/**
 * 搜索论文脚本
 * 用法: node scripts/search-papers.js
 */

const axios = require('axios');

const OPENALEX_API = 'https://api.openalex.org';

const TOPICS = {
  '巨灾保险': [
    'catastrophe insurance',
    'climate risk insurance',
    'reinsurance pricing',
    'disaster risk insurance',
    'hurricane insurance',
    'earthquake insurance'
  ],
  '农业保险': [
    'agricultural insurance',
    'crop insurance',
    'weather index insurance',
    'farming risk',
    'rural insurance',
    'livestock insurance'
  ],
  '普惠金融': [
    'financial inclusion',
    'microfinance',
    'rural finance',
    'digital finance poverty',
    'mobile banking unbanked'
  ]
};

const SEARCH_QUERIES = {
  '巨灾保险': 'catastrophe insurance climate risk reinsurance OR disaster risk OR hurricane earthquake',
  '农业保险': 'agricultural insurance crop weather index OR farming rural OR livestock',
  '普惠金融': 'financial inclusion microfinance rural OR digital finance poverty OR mobile banking'
};

async function searchOpenAlex(query, perPage = 15) {
  try {
    const response = await axios.get(`${OPENALEX_API}/works`, {
      params: {
        search: query,
        'per-page': perPage,
        sort: 'publication_date:desc',
        filter: 'is_oa:true,publication_year:2025-2026'
      },
      timeout: 30000
    });

    return response.data.results || [];
  } catch (error) {
    console.error('OpenAlex error:', error.message);
    return [];
  }
}

function invertAbstract(invertedIndex) {
  if (!invertedIndex) return '';
  const words = Object.keys(invertedIndex);
  words.sort((a, b) => invertedIndex[a][0] - invertedIndex[b][0]);
  return words.join(' ');
}

function guessSubcategory(title, abstract, category) {
  const content = (title + ' ' + abstract).toLowerCase();

  if (category === '巨灾保险') {
    if (content.includes('climate') || content.includes('global warming')) return '气候风险建模';
    if (content.includes('reinsurance') || content.includes('retrocession')) return '再保险';
    if (content.includes('earthquake') || content.includes('seismic')) return '地震保险';
    if (content.includes('flood') || content.includes('hurricane') || content.includes('typhoon')) return '洪水/飓风保险';
    return '其他';
  }

  if (category === '农业保险') {
    if (content.includes('crop') || content.includes('farming') || content.includes('harvest')) return '农作物保险';
    if (content.includes('livestock') || content.includes('cattle') || content.includes('poultry')) return '畜牧保险';
    if (content.includes('weather index') || content.includes('rainfall') || content.includes('temperature')) return '天气指数保险';
    if (content.includes('credit') || content.includes('loan')) return '农业信贷';
    return '其他';
  }

  if (category === '普惠金融') {
    if (content.includes('digital finance') || content.includes('mobile payment') || content.includes('fintech')) return '数字普惠金融';
    if (content.includes('rural credit') || content.includes('village')) return '农村信贷';
    if (content.includes('microfinance') || content.includes('sme')) return '小微金融';
    if (content.includes('exclusion') || content.includes('literacy') || content.includes('unbanked')) return '金融排斥';
    return '其他';
  }

  return '其他';
}

function extractTags(title, abstract) {
  const tags = new Set();
  const content = (title + ' ' + abstract).toLowerCase();

  const keywords = [
    'catastrophe', 'insurance', 'climate risk', 'reinsurance',
    'agricultural', 'crop insurance', 'weather index',
    'financial inclusion', 'microfinance', 'digital finance',
    'risk management', 'climate change'
  ];

  keywords.forEach(kw => {
    if (content.includes(kw)) {
      tags.add(kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  return Array.from(tags).slice(0, 4);
}

async function main() {
  const allPapers = [];

  for (const [category, queries] of Object.entries(SEARCH_QUERIES)) {
    console.log(`\n=== ${category} ===`);

    const results = await searchOpenAlex(queries, 20);

    for (const work of results) {
      const title = work.title || 'Untitled';
      const abstractText = invertAbstract(work.abstract_inverted_index);

      // 过滤掉不相关的
      if (title === 'Untitled' || title.length < 20) continue;

      const authors = (work.authorships || [])
        .slice(0, 5)
        .map(a => a.author?.display_name || 'Unknown');

      const id = work.doi ? work.doi.split('/').pop() : (work.id ? work.id.split('/').pop() : `oa_${Date.now()}`);
      const journal = work.primary_location?.source?.display_name || 'OpenAlex';
      const date = work.publication_date || new Date().toISOString().split('T')[0];
      const citations = work.cited_by_count || 0;
      const pdfUrl = work.best_oa_location?.pdf_url || null;
      const url = work.doi || work.id;

      const paper = {
        id: id,
        title: title,
        authors: authors,
        source: journal,
        date: date,
        abstract: abstractText.substring(0, 400),
        category: category,
        subcategory: guessSubcategory(title, abstractText, category),
        tags: extractTags(title, abstractText),
        citations: citations,
        pdfUrl: pdfUrl,
        url: url
      };

      allPapers.push(paper);
      console.log(`[${date}] ${title.substring(0, 70)}...`);
      console.log(`  Subcategory: ${paper.subcategory}`);
    }
  }

  console.log(`\n\n=== 共找到 ${allPapers.length} 篇论文 ===`);

  // 输出 JSON 格式方便复制
  console.log('\n=== JSON 格式 ===');
  console.log(JSON.stringify(allPapers, null, 2));
}

main().catch(console.error);
