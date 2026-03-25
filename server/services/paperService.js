/**
 * 论文服务
 */
const { Op } = require('sequelize');
const { Paper, Tag, User, Favorite, ReadingList } = require('../models');

// 获取论文列表
async function getPapers({ category, subcategory, keyword, page, limit, sort }) {
  const where = {};

  if (category && category !== 'all') {
    where.category = category;
  }

  if (subcategory) {
    where.subcategory = subcategory;
  }

  if (keyword) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${keyword}%` } },
      { abstract: { [Op.iLike]: `%${keyword}%` } }
    ];
  }

  const order = sort === 'cited'
    ? [['citations', 'DESC']]
    : [['publishDate', 'DESC']];

  const { count, rows } = await Paper.findAndCountAll({
    where,
    order,
    limit,
    offset: (page - 1) * limit,
    include: [{ model: Tag, through: { attributes: [] } }]
  });

  return {
    papers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// 获取论文详情
async function getPaperById(id) {
  const paper = await Paper.findByPk(id, {
    include: [{ model: Tag, through: { attributes: [] } }]
  });

  if (!paper) return null;

  // 获取相关论文
  const relatedPapers = await Paper.findAll({
    where: {
      id: { [Op.ne]: id },
      category: paper.category
    },
    limit: 5,
    order: [['citations', 'DESC']]
  });

  return {
    ...paper.toJSON(),
    relatedPapers
  };
}

// 搜索论文
async function searchPapers(query, { page, limit }) {
  const { count, rows } = await Paper.findAndCountAll({
    where: {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { abstract: { [Op.iLike]: `%${query}%` } },
        { '$Tags.name$': { [Op.iLike]: `%${query}%` } }
      ]
    },
    include: [{ model: Tag, through: { attributes: [] } }],
    limit,
    offset: (page - 1) * limit,
    order: [['publishDate', 'DESC']]
  });

  return {
    papers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

// 获取热门论文
async function getHotPapers(category, limit = 10) {
  const where = {};
  if (category) {
    where.category = category;
  }

  return await Paper.findAll({
    where,
    order: [['citations', 'DESC']],
    limit,
    include: [{ model: Tag, through: { attributes: [] } }]
  });
}

// 获取标签列表
async function getTags(category, limit = 50) {
  const where = {};
  if (category) {
    where.category = category;
  }

  return await Tag.findAll({
    where,
    order: [['usageCount', 'DESC']],
    limit
  });
}

// 获取论文统计
async function getPaperStats() {
  const total = await Paper.count();
  const byCategory = await Paper.findAll({
    attributes: [
      'category',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['category']
  });

  const recentPapers = await Paper.findAll({
    order: [['publishDate', 'DESC']],
    limit: 10
  });

  return {
    total,
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category] = parseInt(item.dataValues.count);
      return acc;
    }, {}),
    recentPapers
  };
}

// 添加论文
async function addPaper(paperData) {
  const { tags, ...paperInfo } = paperData;

  const paper = await Paper.create(paperInfo);

  // 添加标签关联
  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      let [tag] = await Tag.findOrCreate({
        where: { name: tagName }
      });
      await paper.addTag(tag);
      await tag.increment('usageCount');
    }
  }

  return paper;
}

// 更新论文
async function updatePaper(id, paperData) {
  const paper = await Paper.findByPk(id);
  if (!paper) return null;

  await paper.update(paperData);
  return paper;
}

// 删除论文
async function deletePaper(id) {
  const paper = await Paper.findByPk(id);
  if (!paper) return false;

  await paper.destroy();
  return true;
}

module.exports = {
  getPapers,
  getPaperById,
  searchPapers,
  getHotPapers,
  getTags,
  getPaperStats,
  addPaper,
  updatePaper,
  deletePaper
};
