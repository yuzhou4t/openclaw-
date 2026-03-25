/**
 * 每日推送 API
 */

// 2025年以前的论文已移除
const paperDatabase = [];

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

  // /api/push/daily - 获取今日推送
  if (pathParts.includes('daily')) {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 筛选最近3天发表的论文
    const recentPapers = paperDatabase.filter(paper => {
      const paperDate = new Date(paper.date);
      return paperDate >= threeDaysAgo && paperDate <= today;
    });

    // 按日期排序，最新的在前
    recentPapers.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 如果有最近3天的新论文，最多推送5篇；否则显示暂无内容
    const dailyPapers = recentPapers.slice(0, 5);
    const hasNewPapers = dailyPapers.length > 0;

    return res.status(200).json({
      papers: dailyPapers,
      date: today.toISOString().split('T')[0],
      hasNewPapers: hasNewPapers,
      message: hasNewPapers ? '' : '今日暂无内容'
    });
  }

  // /api/push/history - 获取最近一周的推送历史
  if (pathParts.includes('history')) {
    const history = [];
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 生成过去7天的推送记录
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 计算该日期范围内（往前3天）的论文
      const dayStart = new Date(date);
      dayStart.setDate(dayStart.getDate() - 3);
      const dayEnd = new Date(date);

      const dayPapers = paperDatabase.filter(paper => {
        const paperDate = new Date(paper.date);
        return paperDate >= dayStart && paperDate <= dayEnd;
      }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      history.push({
        date: dateStr,
        papers: dayPapers,
        hasNewPapers: dayPapers.length > 0,
        message: dayPapers.length > 0 ? '' : '暂无内容'
      });
    }

    return res.status(200).json({
      history: history,
      total: history.length
    });
  }

  res.status(404).json({ error: 'Not found' });
};
