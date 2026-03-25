/**
 * PaperHub 后端服务入口
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

// 导入配置
const config = require('./config');
// 导入路由
const apiRoutes = require('./routes/api');
// 导入定时任务
const { setupCronJobs } = require('./services/crawler');

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/v1', apiRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.isDev ? err.message : undefined
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║     PaperHub Server Running             ║
  ║                                         ║
  ║   Local: http://localhost:${PORT}            ║
  ║   API:   http://localhost:${PORT}/api/v1     ║
  ║   Mode:  ${config.isDev ? 'Development' : 'Production'}                ║
  ╚════════════════════════════════════════╝
  `);

  // 启动定时任务
  if (config.enableCron) {
    setupCronJobs();
    console.log('⏰ 定时任务已启动');
  }
});

module.exports = app;
