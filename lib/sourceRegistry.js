const CATEGORIES = ['计量经济学', '金融机器学习', '行为金融', '巨灾保险', '农业保险', '普惠金融'];

const SOURCE_REGISTRY = [
  {
    id: 'openalex',
    name: 'OpenAlex',
    weight: 0.70,
    ttlMs: 20 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: true
  },
  {
    id: 'ssrn',
    name: 'SSRN',
    weight: 0.85,
    ttlMs: 30 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: true
  },
  {
    id: 'nber',
    name: 'NBER',
    weight: 0.95,
    ttlMs: 30 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: true
  },
  {
    id: 'afajof',
    name: 'AFAJOF',
    weight: 0.90,
    ttlMs: 30 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: false
  },
  {
    id: 'erj',
    name: 'ERJ',
    weight: 0.90,
    ttlMs: 30 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: false
  },
  {
    id: 'glsj',
    name: 'GLSJ',
    weight: 0.90,
    ttlMs: 30 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: false
  },
  {
    id: 'zhou_seeds',
    name: '周国富老师推荐',
    weight: 0.80,
    ttlMs: 60 * 60 * 1000,
    categories: CATEGORIES,
    categoryScoped: false
  }
];

module.exports = {
  CATEGORIES,
  SOURCE_REGISTRY
};
