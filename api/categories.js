/**
 * 分类 API
 */
module.exports = (req, res) => {
  // /api/categories - 获取分类
  const categories = [
    {
      id: 'all',
      name: '全部论文',
      icon: '📚',
      count: 0
    },
    {
      id: '计量经济学',
      name: '计量经济学',
      icon: '📈',
      count: 0,
      color: '#3b82f6',
      subcategories: [
        { id: '时间序列', name: '时间序列' },
        { id: '面板数据', name: '面板数据' },
        { id: '因果推断', name: '因果推断' },
        { id: 'VAR/GARCH', name: 'VAR/GARCH' }
      ]
    },
    {
      id: '金融机器学习',
      name: '金融机器学习',
      icon: '🤖',
      count: 0,
      color: '#8b5cf6',
      subcategories: [
        { id: '量化交易', name: '量化交易' },
        { id: '风险预测', name: '风险预测' },
        { id: '资产定价', name: '资产定价' },
        { id: '深度学习', name: '深度学习' }
      ]
    },
    {
      id: '行为金融',
      name: '行为金融',
      icon: '📊',
      count: 0,
      color: '#ec4899',
      subcategories: [
        { id: '投资者行为', name: '投资者行为' },
        { id: '市场异象', name: '市场异象' },
        { id: '行为资产定价', name: '行为资产定价' },
        { id: '金融科技', name: '金融科技' }
      ]
    },
    {
      id: '巨灾保险',
      name: '巨灾保险',
      icon: '🌪️',
      count: 0,
      color: '#f97316',
      subcategories: [
        { id: '地震保险', name: '地震保险' },
        { id: '洪水/飓风保险', name: '洪水/飓风保险' },
        { id: '气候风险建模', name: '气候风险建模' },
        { id: '再保险', name: '再保险' }
      ]
    },
    {
      id: '农业保险',
      name: '农业保险',
      icon: '🌾',
      count: 0,
      color: '#22c55e',
      subcategories: [
        { id: '农作物保险', name: '农作物保险' },
        { id: '畜牧保险', name: '畜牧保险' },
        { id: '天气指数保险', name: '天气指数保险' },
        { id: '农业信贷', name: '农业信贷' }
      ]
    },
    {
      id: '普惠金融',
      name: '普惠金融',
      icon: '💰',
      count: 0,
      color: '#06b6d4',
      subcategories: [
        { id: '数字普惠金融', name: '数字普惠金融' },
        { id: '农村信贷', name: '农村信贷' },
        { id: '小微金融', name: '小微金融' },
        { id: '金融排斥', name: '金融排斥' }
      ]
    }
  ];

  return res.status(200).json(categories);
};