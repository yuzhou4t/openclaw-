/**
 * 论文 API
 */

// 模拟论文数据
const mockPapers = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
    venue: 'NeurIPS 2017',
    date: '2017-12-06',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and the decoder. The best performing models also connect the encoder and the decoder through an attention mechanism.',
    category: '大模型',
    subcategory: '基础模型/预训练',
    tags: ['transformer', 'attention', 'NLP'],
    citations: 98000,
    pdfUrl: 'https://arxiv.org/abs/1706.03762'
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
    venue: 'NAACL 2019',
    date: '2019-05-24',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
    category: '大模型',
    subcategory: '指令微调/RLHF',
    tags: ['BERT', 'pre-training', 'NLP'],
    citations: 78000,
    pdfUrl: 'https://arxiv.org/abs/1810.04805'
  },
  {
    id: '3',
    title: 'GPT-4 Technical Report',
    authors: ['OpenAI'],
    venue: 'OpenAI 2023',
    date: '2023-03-15',
    abstract: 'We report the development of GPT-4, a large-scale, multimodal model capable of processing image and text inputs and producing text outputs.',
    category: '大模型',
    subcategory: '多模态模型',
    tags: ['GPT-4', 'LLM', 'multimodal'],
    citations: 5200,
    pdfUrl: 'https://arxiv.org/abs/2303.08774'
  },
  {
    id: '4',
    title: 'Large Language Models are Zero-Shot Reasoners',
    authors: ['Kojima Takeshi', 'Shixiang Shane Gu', 'Masao Okumura'],
    venue: 'NeurIPS 2022',
    date: '2022-09-15',
    abstract: 'We show that large language models can be prompted to be zero-shot reasoners by adding "Let\'s think step by step" before each answer.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['chain-of-thought', 'zero-shot', 'reasoning'],
    citations: 8900,
    pdfUrl: 'https://arxiv.org/abs/2205.11916'
  },
  {
    id: '5',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP',
    authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus'],
    venue: 'ACL 2020',
    date: '2020-05-12',
    abstract: 'We present a general-purpose retrieval-augmented generation model that can be fine-tuned on any knowledge-intensive downstream tasks.',
    category: '大模型',
    subcategory: 'RAG/知识增强',
    tags: ['RAG', 'retrieval', 'knowledge'],
    citations: 4500,
    pdfUrl: 'https://arxiv.org/abs/2005.11401'
  },
  {
    id: '6',
    title: 'Investor Sentiment and Stock Returns',
    authors: ['Malcolm Baker', 'Jeffrey Wurgler'],
    venue: 'Journal of Finance 2006',
    date: '2006-04-01',
    abstract: 'We use sentiment indicators based on closed-end fund discounts, NYSE volume, the dividend premium, and the equity share of new issues to test for the effects of investor sentiment on cross-sectional expected returns.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['sentiment', 'stock returns', 'behavioral'],
    citations: 3200,
    pdfUrl: 'https://doi.org/10.1111/j.1540-6261.2006.00878.x'
  },
  {
    id: '7',
    title: 'A Theory of Fads, Fashion, and Cultural Change',
    authors: ['Gary Becker', 'Kevin Murphy'],
    venue: 'Journal of Political Economy 1992',
    date: '1992-08-01',
    abstract: 'This paper develops a simple model of supply and demand in markets for goods whose value depends heavily on their social environment.',
    category: '行为金融',
    subcategory: '市场异象',
    tags: ['fads', 'fashion', 'cultural economics'],
    citations: 1800,
    pdfUrl: 'https://doi.org/10.1086/261953'
  },
  {
    id: '8',
    title: 'Catastrophe Insurance Demand and the 2008 Hurricane Season',
    authors: ['Katherine Collins', 'Howard Kunreuther'],
    venue: 'Risk Analysis 2011',
    date: '2011-06-01',
    abstract: 'This paper examines hurricane insurance purchase decisions in the Gulf and Atlantic coastal regions using data from the 2008 hurricane season.',
    category: '巨灾保险',
    subcategory: '洪水/飓风保险',
    tags: ['catastrophe', 'insurance', 'hurricane'],
    citations: 890,
    pdfUrl: 'https://doi.org/10.1111/j.1539-6924.2011.01600.x'
  },
  {
    id: '9',
    title: 'Weather Index Insurance for Agricultural Development',
    authors: ['Jerry Skees', 'Benjamin Collier'],
    venue: 'Agricultural Finance Review 2008',
    date: '2008-11-01',
    abstract: 'This paper examines the potential for weather index insurance as a mechanism to improve the delivery of agricultural finance in developing countries.',
    category: '农业保险',
    subcategory: '天气指数保险',
    tags: ['weather index', 'agricultural insurance', 'developing countries'],
    citations: 1250,
    pdfUrl: 'https://doi.org/10.1108/00021490810904314'
  },
  {
    id: '10',
    title: 'Financial Inclusion and Development in Rural China',
    authors: ['Lin Zhang', 'Jianhua Xu'],
    venue: 'China Economic Review 2020',
    date: '2020-03-01',
    abstract: 'This paper investigates the relationship between financial inclusion and rural development in China using panel data from 31 provinces.',
    category: '普惠金融',
    subcategory: '农村信贷',
    tags: ['financial inclusion', 'rural development', 'China'],
    citations: 780,
    pdfUrl: 'https://doi.org/10.1016/j.chieco.2020.01.004'
  },
  {
    id: '11',
    title: 'Llama 2: Open Foundation and Chat Models',
    authors: ['Meta AI'],
    venue: 'Meta 2023',
    date: '2023-07-18',
    abstract: 'We present Llama 2, a collection of pre-trained and instruction-tuned large language models ranging from 7B to 70B parameters.',
    category: '大模型',
    subcategory: '基础模型/预训练',
    tags: ['Llama', 'open source', 'LLM'],
    citations: 3200,
    pdfUrl: 'https://arxiv.org/abs/2307.13288'
  },
  {
    id: '12',
    title: 'Direct Preference Optimization',
    authors: ['Lianhui Qin', 'Aleksandra Piktus'],
    venue: 'ICML 2024',
    date: '2024-03-01',
    abstract: 'We present Direct Preference Optimization (DPO), a simple and effective algorithm for language model alignment that does not require reinforcement learning.',
    category: '大模型',
    subcategory: '指令微调/RLHF',
    tags: ['DPO', 'alignment', 'RLHF'],
    citations: 890,
    pdfUrl: 'https://arxiv.org/abs/2305.18290'
  },
  {
    id: '13',
    title: 'AgentWorkflow: From Language Models to Autonomous Agents',
    authors: ['Xingyao Wang', 'Zhiwei Liu'],
    venue: 'AAAI 2024',
    date: '2024-02-01',
    abstract: 'We propose a novel framework for building autonomous agents that can plan, execute, and adapt to complex tasks.',
    category: '大模型',
    subcategory: 'AI Agent',
    tags: ['agent', 'autonomous', 'workflow'],
    citations: 456,
    pdfUrl: 'https://arxiv.org/abs/2401.12345'
  },
  {
    id: '14',
    title: 'The Disposition Effect and Momentum',
    authors: ['Terrance Odean'],
    venue: 'Journal of Finance 1998',
    date: '1998-08-01',
    abstract: 'This paper examines whether individual investors are more likely to sell stocks that have increased in value than stocks that have decreased in value.',
    category: '行为金融',
    subcategory: '投资者行为',
    tags: ['disposition effect', 'momentum', 'individual investors'],
    citations: 4500,
    pdfUrl: 'https://doi.org/10.1111/0022-1082.00035'
  },
  {
    id: '15',
    title: 'Climate Risk and Insurance: A Global Assessment',
    authors: ['Michael Roth', 'Svenja Durrant'],
    venue: 'Geneva Papers 2023',
    date: '2023-09-01',
    abstract: 'We assess the global state of climate risk insurance and identify key challenges and opportunities for expansion.',
    category: '巨灾保险',
    subcategory: '气候风险建模',
    tags: ['climate risk', 'insurance', 'global assessment'],
    citations: 320,
    pdfUrl: 'https://doi.org/10.1057/s41288-023-00234-5'
  }
];

module.exports = (req, res) => {
  const { category, keyword, page = 1, limit = 20 } = req.query;
  // 解析路径，去掉 query string 和前导的 api/
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5); // 去掉 /api/ 前缀
  }
  const pathParts = path.split('/').filter(p => p);

  // /api/papers - 获取论文列表
  if (pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'papers')) {
    let filtered = [...mockPapers];

    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.abstract.toLowerCase().includes(kw) ||
        (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw)))
      );
    }

    const currentPage = parseInt(page);
    const currentLimit = parseInt(limit);
    const start = (currentPage - 1) * currentLimit;
    const end = start + currentLimit;
    const papers = filtered.slice(start, end);

    return res.status(200).json({
      papers,
      total: filtered.length,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(filtered.length / currentLimit)
    });
  }

  // /api/papers/hot - 获取热门论文
  if (pathParts.includes('hot')) {
    const hotPapers = [...mockPapers]
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 10);
    return res.status(200).json(hotPapers);
  }

  // /api/papers/search/:query - 搜索论文
  if (pathParts.includes('search')) {
    const queryIndex = pathParts.indexOf('search');
    const query = decodeURIComponent(pathParts[queryIndex + 1] || '');
    const kw = query.toLowerCase();
    const results = mockPapers.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.abstract.toLowerCase().includes(kw) ||
      (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(kw))) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(kw)))
    );
    return res.status(200).json({ papers: results, total: results.length });
  }

  // /api/papers/:id - 获取单个论文详情
  if (pathParts.length === 2 && !pathParts.includes('hot') && !pathParts.includes('search')) {
    const id = pathParts[1];
    const paper = mockPapers.find(p => p.id === id);
    if (paper) {
      return res.status(200).json(paper);
    }
    return res.status(404).json({ error: 'Paper not found' });
  }

  res.status(404).json({ error: 'Not found' });
};