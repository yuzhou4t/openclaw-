/**
 * Cron Job API - 定时任务
 */
module.exports = (req, res) => {
  // 验证 cron secret（可选安全措施）
  const authHeader = req.headers.authorization;
  const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET || 'cron-secret-key'}`;

  // 如果需要认证，取消注释下面这行
  // if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized' });

  // 记录 cron 执行
  console.log(`[Cron] Daily push executed at ${new Date().toISOString()}`);

  // 返回成功状态
  return res.status(200).json({
    success: true,
    message: 'Daily push cron job executed',
    timestamp: new Date().toISOString()
  });
};