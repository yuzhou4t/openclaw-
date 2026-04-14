/**
 * 代理 API - 用于绕过网络限制访问被墙的网站
 * Vercel 部署在海外，可以访问国内无法访问的网站
 */

const axios = require('axios');

module.exports = async (req, res) => {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // 验证 URL 格式，防止 SSRF 攻击
  try {
    const targetUrl = new URL(url);
    // 只允许 http/https
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
    // 禁止访问内网地址
    const hostname = targetUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.internal')
    ) {
      return res.status(400).json({ error: 'Access denied' });
    }

    // 发起请求
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
      },
      responseType: 'text'
    });

    return res.status(200).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
};
