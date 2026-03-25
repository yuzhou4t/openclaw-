/**
 * 配置文件
 */
module.exports = {
  // 服务器配置
  port: process.env.PORT || 3000,
  isDev: process.env.NODE_ENV !== 'production',

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'paperhub',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },

  // 爬虫配置
  crawler: {
    enableCron: process.env.ENABLE_CRON !== 'false',
    arxiv: {
      categories: [
        'cs.CL',   // Computation and Language
        'cs.LG',   // Machine Learning
        'cs.AI',   // Artificial Intelligence
        'q-fin.GN' // General Finance
      ],
      maxResults: 50,
      crawlInterval: '0 8 * * *' // 每天 8:00
    }
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'paperhub-secret-key',
    expiresIn: '7d'
  },

  // 邮件配置
  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },

  // 论文配置
  paper: {
    perPage: 20,
    maxAbstractLength: 500
  }
};
