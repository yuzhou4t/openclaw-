# 论文检索系统重新设计

## 目标
将论文推送从"海量检索"模式转变为"精选推荐"模式，聚焦金融与统计学院相关领域，提供高质量论文推荐。

## 数据来源

### 国际来源
| 来源 | 说明 | API/抓取 |
|------|------|----------|
| SSRN | 社会科学预印本库 | 可抓取 |
| NBER | 美国国家经济研究局 | 可抓取 |
| AFAJOF | 金融学顶刊 | 列表页 |
| arXiv | 机器学习部分 | API |

### 国内来源
| 来源 | 说明 | 处理方式 |
|------|------|----------|
| ERJ (Economic Research Journal) | 经济研究期刊 | CNKI 列表页 |
| GLSJ | 管理科学学报 | CNKI 列表页 |

### 专家库
- 周国富老师个人主页: https://guofuzhou.github.io/zothers.html
- 包含多位学者链接

## 六大分类

1. **计量经济学** - econometrics, time series, panel data, causal inference
2. **金融机器学习** - machine learning in finance, quantitative finance, algorithmic trading
3. **行为金融** - behavioral finance, investor sentiment, market anomaly
4. **巨灾保险** - catastrophe insurance, climate risk, reinsurance
5. **农业保险** - agricultural insurance, crop insurance, weather index
6. **普惠金融** - financial inclusion, microfinance, rural finance

## 质量评分体系

综合打分 = 来源声望(40%) + 引用量(30%) + 作者/机构(30%)

### 来源声望权重
- NBER: 0.95
- SSRN: 0.85
- AFAJOF / ERJ / GLSJ: 0.90
- arXiv: 0.60
- 周国富老师推荐: 0.80

### 分类匹配策略
采用 **来源+关键词混合** 模式：
1. 不同来源天然对应不同分类（NBER→计量经济学，SSRN→行为金融）
2. 关键词匹配做二次校正
3. 同一论文可跨分类保留

## 推送机制

- **频率**: 每周二、周五各推送一次
- **数量**: 每分类3-4篇，每天约18-24篇
- **时间窗口**: 最近3天内的论文

## 实施步骤

### Phase 1: 来源接入
1. 接入 SSRN 论文列表页
2. 接入 NBER 论文列表页
3. 接入 AFAJOF forthcoming articles
4. 配置国内 CNKI 列表页抓取
5. 解析周国富老师主页链接

### Phase 2: 分类体系
1. 定义各分类关键词库
2. 实现来源-分类映射
3. 开发质量评分算法

### Phase 3: 推送系统
1. 更新 push.js 使用新来源
2. 配置周二/周五定时任务
3. 实现"精选"逻辑（每分类限3-4篇）

### Phase 4: 前端适配
1. 更新分类导航
2. 调整论文卡片展示
3. 确保"查看全部"显示历史推送

## 技术注意

- 国内来源（CNKI）可能有访问限制，需要特殊处理
- SSRN/NBER 需遵守 robots.txt
- 论文去重：基于标题+日期做去重
- 缓存策略：减少重复请求
