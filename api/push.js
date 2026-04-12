/**
 * 每日推送 API
 * 从 SSRN、NBER、AFAJOF、CNKI 等获取精选论文
 * 每周二、周五推送
 */

const { selectTopPapers } = require('./scorer');

// 超时包装
const withTimeout = (ms, fn) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]).catch(() => null);
};

// 推送日：周二(2)、周五(5)
const PUSH_DAYS = [2, 5];

// 六大分类
const CATEGORIES = ['计量经济学', '金融机器学习', '行为金融', '巨灾保险', '农业保险', '普惠金融'];

// 分类来源映射
const CATEGORY_SOURCE_MAP = {
  '计量经济学': ['计量经济学', '计量经济学'],
  '金融机器学习': ['金融机器学习', '金融机器学习'],
  '行为金融': ['行为金融', '行为金融'],
  '巨灾保险': ['巨灾保险', '巨灾保险'],
  '农业保险': ['农业保险', '农业保险'],
  '普惠金融': ['普惠金融', '普惠金融']
};

// 模拟从各来源获取论文（实际需要调用对应API）
async function fetchFromSource(source, category, limit) {
  // 这里模拟返回空数组，实际部署时需要接入真实数据源
  // SSRN/NBER/AFAJOF/CNKI 的适配器已创建，但服务器端无法直接调用浏览器端API
  // 需要将这些适配器改为服务端抓取逻辑
  return [];
}

// 合并论文数据
async function getAllPapersForPush() {
  let allPapers = [];

  // 尝试从各来源获取论文
  for (const cat of CATEGORIES) {
    try {
      // SSRN
      const ssrnResult = await withTimeout(5000, () => fetchFromSSRN(cat, 2));
      if (ssrnResult && ssrnResult.length > 0) {
        allPapers.push(...ssrnResult);
      }
    } catch (e) {
      console.log(`[Push] SSRN ${cat} error:`, e.message);
    }

    try {
      // NBER
      const nberResult = await withTimeout(5000, () => fetchFromNBER(cat, 2));
      if (nberResult && nberResult.length > 0) {
        allPapers.push(...nberResult);
      }
    } catch (e) {
      console.log(`[Push] NBER ${cat} error:`, e.message);
    }

    try {
      // AFAJOF (主要是行为金融)
      if (cat === '行为金融') {
        const afajofResult = await withTimeout(5000, () => fetchFromAFAJOF(3));
        if (afajofResult && afajofResult.length > 0) {
          allPapers.push(...afajofResult);
        }
      }
    } catch (e) {
      console.log(`[Push] AFAJOF error:`, e.message);
    }

    try {
      // CNKI (农业保险、普惠金融)
      if (cat === '农业保险' || cat === '普惠金融') {
        const cnkiResult = await withTimeout(5000, () => fetchFromCNKI(cat === '农业保险' ? 'ERJ' : 'GLSJ', 2));
        if (cnkiResult && cnkiResult.length > 0) {
          allPapers.push(...cnkiResult);
        }
      }
    } catch (e) {
      console.log(`[Push] CNKI ${cat} error:`, e.message);
    }
  }

  // 去重（基于标题）
  const seen = new Set();
  allPapers = allPapers.filter(p => {
    if (!p.title) return false;
    const key = p.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return allPapers;
}

// 临时模拟函数 - 实际需要真实数据源
async function fetchFromSSRN(category, limit) {
  return [];
}

async function fetchFromNBER(category, limit) {
  return [];
}

async function fetchFromAFAJOF(limit) {
  return [];
}

async function fetchFromCNKI(journal, limit) {
  return [];
}

module.exports = async (req, res) => {
  // 解析路径
  let path = req.url.split('?')[0];
  if (path.startsWith('/api/')) {
    path = path.slice(5);
  }
  const pathParts = path.split('/').filter(p => p);

  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // /api/push/daily - 获取今日推送
  if (pathParts.includes('daily')) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const isPushDay = PUSH_DAYS.includes(dayOfWeek);

    if (!isPushDay) {
      return res.status(200).json({
        papers: [],
        date: today.toISOString().split('T')[0],
        hasNewPapers: false,
        message: '今日无推送'
      });
    }

    // 获取所有来源的论文
    const allPapers = await getAllPapersForPush();

    // 筛选最近2天发表的论文
    const todayStr = today.toISOString().split('T')[0];
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const recentPapers = allPapers.filter(p => p.date && p.date >= twoDaysAgoStr && p.date <= todayStr);

    // 按日期排序，最新的在前
    recentPapers.sort((a, b) => new Date(b.date) - new Date(a.date));

    const hasNewPapers = recentPapers.length > 0;

    return res.status(200).json({
      papers: recentPapers,
      date: todayStr,
      hasNewPapers: hasNewPapers,
      message: hasNewPapers ? '' : '暂无'
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();

    // 获取所有来源的论文
    const allPapers = await getAllPapersForPush();

    // 生成过去7天的推送记录
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isPushDay = PUSH_DAYS.includes(dayOfWeek);

      if (!isPushDay) {
        history.push({
          date: dateStr,
          papers: [],
          hasNewPapers: false,
          message: '今日无推送'
        });
        continue;
      }

      // 计算该日期范围内（往前2天）的论文
      const dayStart = new Date(date);
      dayStart.setDate(dayStart.getDate() - 2);
      const dayEnd = new Date(date);
      const dayStartStr = dayStart.toISOString().split('T')[0];
      const dayEndStr = dayEnd.toISOString().split('T')[0];

      const recentPapers = (allPapers || []).filter(paper => {
        const paperDate = new Date(paper.date);
        return paperDate >= dayStart && paperDate <= dayEnd;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      history.push({
        date: dateStr,
        papers: recentPapers,
        hasNewPapers: recentPapers.length > 0,
        message: recentPapers.length > 0 ? '' : '暂无'
      });
    }

    return res.status(200).json({
      history: history,
      total: history.length
    });
  }

  res.status(404).json({ error: 'Not found' });
};
