/**
 * 标签 API - Cloudflare Workers 版本
 */

export default async function handler(request, env, ctx) {
  const tags = [
    { name: 'transformer', count: 1250, category: '大模型' },
    { name: 'BERT', count: 980, category: '大模型' },
    { name: 'attention', count: 890, category: '大模型' },
    { name: 'LLM', count: 780, category: '大模型' },
    { name: 'RAG', count: 450, category: '大模型' },
    { name: 'agent', count: 320, category: '大模型' },
    { name: 'sentiment', count: 280, category: '行为金融' },
    { name: 'behavioral', count: 250, category: '行为金融' },
    { name: 'momentum', count: 180, category: '行为金融' },
    { name: 'catastrophe', count: 150, category: '巨灾保险' },
    { name: 'climate risk', count: 120, category: '巨灾保险' },
    { name: 'agricultural insurance', count: 95, category: '农业保险' },
    { name: 'weather index', count: 88, category: '农业保险' },
    { name: 'financial inclusion', count: 75, category: '普惠金融' },
    { name: 'rural finance', count: 65, category: '普惠金融' }
  ];

  return new Response(JSON.stringify(tags), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}