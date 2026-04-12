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
  'Engle': 0.90,
  'Granger': 0.90,
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
