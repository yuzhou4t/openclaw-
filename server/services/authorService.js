/**
 * 作者服务
 * 管理作者信息和统计分析
 */
const { Paper, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 提取所有作者
 */
async function getAllAuthors() {
  const papers = await Paper.findAll({
    attributes: ['authors']
  });

  // 统计每个作者的论文数量和引用
  const authorStats = {};

  papers.forEach(paper => {
    paper.authors.forEach(author => {
      if (!authorStats[author]) {
        authorStats[author] = {
          name: author,
          paperCount: 0,
          totalCitations: 0,
          categories: new Set(),
          papers: []
        };
      }
      authorStats[author].paperCount += 1;
      authorStats[author].totalCitations += paper.citations || 0;
      authorStats[author].categories.add(paper.category);
      authorStats[author].papers.push({
        id: paper.id,
        title: paper.title,
        citations: paper.citations,
        category: paper.category
      });
    });
  });

  // 转换为数组并排序
  return Object.values(authorStats)
    .map(a => ({
      ...a,
      categories: [...a.categories]
    }))
    .sort((a, b) => b.totalCitations - a.totalCitations);
}

/**
 * 获取作者详情
 */
async function getAuthorDetail(authorName) {
  const papers = await Paper.findAll({
    where: {
      authors: { [Op.contains]: [authorName] }
    },
    order: [['publishDate', 'DESC']]
  });

  if (papers.length === 0) {
    return null;
  }

  // 统计
  const stats = {
    totalPapers: papers.length,
    totalCitations: papers.reduce((sum, p) => sum + (p.citations || 0), 0),
    avgCitations: Math.round(papers.reduce((sum, p) => sum + (p.citations || 0), 0) / papers.length),
    hIndex: calculateHIndex(papers.map(p => p.citations || 0)),
    i10Index: papers.filter(p => (p.citations || 0) >= 10).length
  };

  // 按年份统计
  const yearStats = {};
  papers.forEach(paper => {
    const year = new Date(paper.publishDate).getFullYear();
    yearStats[year] = (yearStats[year] || 0) + 1;
  });

  // 按类别统计
  const categoryStats = {};
  papers.forEach(paper => {
    categoryStats[paper.category] = (categoryStats[paper.category] || 0) + 1;
  });

  // 相关作者（合作者）
  const collaborators = {};
  papers.forEach(paper => {
    paper.authors.forEach(a => {
      if (a !== authorName) {
        collaborators[a] = (collaborators[a] || 0) + 1;
      }
    });
  });

  const topCollaborators = Object.entries(collaborators)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, coPapers: count }));

  return {
    name: authorName,
    stats,
    papers: papers.map(p => ({
      id: p.id,
      title: p.title,
      source: p.source,
      publishDate: p.publishDate,
      citations: p.citations,
      category: p.category,
      subcategory: p.subcategory
    })),
    yearStats,
    categoryStats,
    topCollaborators
  };
}

/**
 * 计算 H-index
 */
function calculateHIndex(citations) {
  const sorted = [...citations].sort((a, b) => b - a);
  let hIndex = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  return hIndex;
}

/**
 * 搜索作者
 */
async function searchAuthors(query, limit = 20) {
  const authors = await getAllAuthors();

  return authors
    .filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, limit);
}

/**
 * 获取热门作者
 */
async function getTopAuthors(limit = 20, category = null) {
  const authors = await getAllAuthors();

  let filtered = authors;

  if (category) {
    filtered = authors.filter(a => a.categories.includes(category));
  }

  return filtered.slice(0, limit).map(a => ({
    name: a.name,
    paperCount: a.paperCount,
    totalCitations: a.totalCitations,
    hIndex: calculateHIndex(a.papers.map(p => p.citations))
  }));
}

/**
 * 获取相似作者（同一领域，相似研究兴趣）
 */
async function getSimilarAuthors(authorName, limit = 5) {
  const authorDetail = await getAuthorDetail(authorName);

  if (!authorDetail) return [];

  const allAuthors = await getAllAuthors();

  // 找到同类别但非自己的作者
  const similar = allAuthors
    .filter(a =>
      a.name !== authorName &&
      a.categories.some(c => authorDetail.stats.categoryStats?.[c])
    )
    .slice(0, limit * 2);

  // 计算相似度并排序
  const scored = similar.map(a => {
    let score = 0;
    // 类别重叠
    const categoryOverlap = a.categories.filter(c => authorDetail.stats.categoryStats?.[c]).length;
    score += categoryOverlap * 10;
    // 引用量相近
    const citationDiff = Math.abs(a.totalCitations - authorDetail.stats.totalCitations);
    score -= citationDiff / 1000;

    return { ...a, similarityScore: score };
  });

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)
    .map(a => ({
      name: a.name,
      paperCount: a.paperCount,
      totalCitations: a.totalCitations,
      similarityScore: Math.round(a.similarityScore)
    }));
}

module.exports = {
  getAllAuthors,
  getAuthorDetail,
  searchAuthors,
  getTopAuthors,
  getSimilarAuthors,
  calculateHIndex
};
