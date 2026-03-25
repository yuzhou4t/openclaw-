/**
 * 每日推送 API
 */

// 模拟论文库（用于生成历史推送）
const paperDatabase = [
  {
    id: '16',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans'],
    venue: 'NeurIPS 2022',
    date: '2022-11-15',
    abstract: 'We explore how chain-of-thought prompting can improve the reasoning abilities of large language models.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['chain-of-thought', 'reasoning', 'prompting'],
    citations: 15600,
    pdfUrl: 'https://arxiv.org/abs/2201.11903',
    badge: '🆕'
  },
  {
    id: '17',
    title: 'Self-Consistency Improves Chain-of-Thought Reasoning',
    authors: ['Xuezhi Wang', 'Jason Wei', 'Dale Schuurmans'],
    venue: 'ICLR 2023',
    date: '2023-03-01',
    abstract: 'We propose self-consistency, a decoding strategy that samples diverse reasoning paths.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['self-consistency', 'reasoning'],
    citations: 8900,
    pdfUrl: 'https://arxiv.org/abs/2203.11171',
    badge: '🆕'
  },
  {
    id: '18',
    title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
    authors: ['Timo Schick', 'Jane Dwivedi-Yu'],
    venue: 'NeurIPS 2023',
    date: '2023-02-20',
    abstract: 'We introduce Toolformer, a model trained to use external tools via API calls.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['tools', 'API'],
    citations: 2300,
    pdfUrl: 'https://arxiv.org/abs/2302.04761',
    badge: '🔥'
  },
  {
    id: '19',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    authors: ['Shunyu Yao', 'Jeffrey Zhao', 'Denny Zhou'],
    venue: 'ICLR 2023',
    date: '2023-03-10',
    abstract: 'We propose ReAct, a reasoning + acting approach for language models.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['ReAct', 'reasoning'],
    citations: 7800,
    pdfUrl: 'https://arxiv.org/abs/2210.03629',
    badge: '🆕'
  },
  {
    id: '20',
    title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
    authors: ['Noah Shinn', 'Gennaro Cassano'],
    venue: 'NeurIPS 2023',
    date: '2023-06-15',
    abstract: 'We introduce Reflexion, an approach that enables agents to learn from past mistakes.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['reflexion', 'reinforcement'],
    citations: 1200,
    pdfUrl: 'https://arxiv.org/abs/2303.11366',
    badge: '🆕'
  },
  {
    id: '21',
    title: 'Behavioral Finance: A New Paradigm for Understanding Markets',
    authors: ['Richard Thaler'],
    venue: 'Journal of Economic Literature',
    date: '2023-01-10',
    abstract: 'A comprehensive review of behavioral finance and its impact on modern finance theory.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['behavioral finance', 'decision making'],
    citations: 5200,
    pdfUrl: '',
    badge: '🔥'
  },
  {
    id: '22',
    title: 'Climate Change and Catastrophe Insurance: Modeling Approaches',
    authors: ['J. Smith', 'M. Johnson'],
    venue: 'Nature Climate Change',
    date: '2023-04-15',
    abstract: 'This paper examines how climate change affects catastrophe insurance pricing.',
    category: '巨灾保险',
    subcategory: '气候风险建模',
    tags: ['climate risk', 'insurance'],
    citations: 1800,
    pdfUrl: '',
    badge: '🆕'
  },
  {
    id: '23',
    title: 'Weather Index Insurance for Agricultural Development',
    authors: ['A. Patel', 'B. Chen'],
    venue: 'World Development',
    date: '2022-12-01',
    abstract: 'Evaluating the effectiveness of weather index insurance in developing countries.',
    category: '农业保险',
    subcategory: '天气指数保险',
    tags: ['index insurance', 'agriculture'],
    citations: 920,
    pdfUrl: '',
    badge: ''
  },
  {
    id: '24',
    title: 'Financial Inclusion and Economic Growth: Evidence from Rural China',
    authors: ['Li Wei', 'Zhang Ming'],
    venue: 'Journal of Development Economics',
    date: '2023-05-20',
    abstract: 'Examining the relationship between financial inclusion and rural economic development.',
    category: '普惠金融',
    subcategory: '农村信贷',
    tags: ['financial inclusion', 'rural development'],
    citations: 650,
    pdfUrl: '',
    badge: '🆕'
  },
  {
    id: '25',
    title: 'Large Language Models Are Zero-Shot Reasoners',
    authors: ['Takeshi Kojima', 'Shixiang Shane Gu'],
    venue: 'ICLR 2023',
    date: '2022-11-10',
    abstract: 'We show that large language models are zero-shot reasoners.',
    category: '大模型',
    subcategory: '基础模型',
    tags: ['zero-shot', 'reasoning'],
    citations: 12500,
    pdfUrl: 'https://arxiv.org/abs/2205.11916',
    badge: '🔥'
  }
];

module.exports = (req, res) => {
  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // /api/push/daily - 获取今日推送（2篇）
  if (pathParts.includes('daily')) {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

    // 根据日期选择2篇不同的论文
    const dailyPapers = [
      paperDatabase[dayOfYear % paperDatabase.length],
      paperDatabase[(dayOfYear + 1) % paperDatabase.length]
    ];

    return res.status(200).json({
      papers: dailyPapers,
      date: today.toISOString().split('T')[0]
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();

    // 生成过去7天的推送记录
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

      // 每天2篇
      const dayPapers = [
        paperDatabase[dayOfYear % paperDatabase.length],
        paperDatabase[(dayOfYear + 1) % paperDatabase.length]
      ];

      history.push({
        date: dateStr,
        papers: dayPapers
      });
    }

    return res.status(200).json({
      history: history,
      total: history.length
    });
  }

  res.status(404).json({ error: 'Not found' });
};
