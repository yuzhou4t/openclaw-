/**
 * 分类 API - Cloudflare Workers 版本
 */

export default async function handler(request, env, ctx) {
  const categories = [
    {
      id: 'all',
      name: '全部论文',
      icon: '📚',
      count: 15
    },
    {
      id: '大模型',
      name: '大模型 (LLM)',
      icon: '🤖',
      count: 7,
      color: '#8b5cf6',
      subcategories: [
        { id: '基础模型/预训练', name: '基础模型/预训练' },
        { id: '指令微调/RLHF', name: '指令微调/RLHF' },
        { id: 'RAG/知识增强', name: 'RAG/知识增强' },
        { id: '多模态模型', name: '多模态模型' },
        { id: 'AI Agent', name: 'AI Agent' }
      ]
    },
    {
      id: '行为金融',
      name: '行为金融',
      icon: '📊',
      count: 3,
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
      count: 2,
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
      count: 1,
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
      count: 2,
      color: '#06b6d4',
      subcategories: [
        { id: '数字普惠金融', name: '数字普惠金融' },
        { id: '农村信贷', name: '农村信贷' },
        { id: '小微金融', name: '小微金融' },
        { id: '金融排斥', name: '金融排斥' }
      ]
    }
  ];

  return new Response(JSON.stringify(categories), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}