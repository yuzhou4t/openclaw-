// ===================================
// Mock Data - 模拟论文数据
// 2025年以前的论文已移除
// ===================================
const papersData = [];


// ===================================
// 经典论文数据 - LLM 经典论文 (2017-2023)
// ===================================
const classicPapers = [
  { id: 'attention', title: 'Attention Is All You Need', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
  { id: 'rlhp', title: 'Deep Reinforcement Learning from Human Preferences', year: 2017, url: 'https://arxiv.org/abs/1706.06243' },
  { id: 'ppo', title: 'PPO (Proximal Policy Optimization)', year: 2017, url: 'https://arxiv.org/abs/1707.06347' },
  { id: 'moe', title: 'MoE (Mixture of Experts)', year: 2017, url: 'https://arxiv.org/abs/1701.06538' },
  { id: 'bert', title: 'BERT: Pre-training of Deep Bidirectional Transformers', year: 2019, url: 'https://aclanthology.org/N19-1423/' },
  { id: 'megatron', title: 'Megatron-LM: Training Multi-Billion Parameter Language Models', year: 2019, url: 'https://arxiv.org/abs/1909.08053' },
  { id: 'zero', title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', year: 2019, url: 'https://arxiv.org/abs/1910.02054' },
  { id: 'gpt3', title: 'GPT-3: Language Models are Few-Shot Learners', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
  { id: 'scaling', title: 'Scaling Laws for Neural Language Models', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
  { id: 'instructgpt', title: 'InstructGPT: Training language models to follow instructions', year: 2022, url: 'https://arxiv.org/abs/2203.02155' },
  { id: 'chinchilla', title: 'Chinchilla: Training Compute-Optimal Large Language Models', year: 2022, url: 'https://arxiv.org/abs/2203.15556' },
  { id: 'flashattn', title: 'FlashAttention: Fast and Memory-Efficient Exact Attention', year: 2022, url: 'https://arxiv.org/abs/2205.14135' },
  { id: 'cot', title: 'Chain-of-Thought Prompting Elicits Reasoning', year: 2022, url: 'https://arxiv.org/abs/2201.11903' },
  { id: 'emergent', title: 'Emergent Abilities of Large Language Models', year: 2022, url: 'https://arxiv.org/abs/2206.07682' },
  { id: 'laion', title: 'LAION-5B: A Large-Scale Dataset for Research', year: 2022, url: 'https://arxiv.org/abs/2210.08402' },
  { id: 'gpt4', title: 'GPT-4 Technical Report', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
  { id: 'llama', title: 'LLaMA: Open and Efficient Foundation Language Models', year: 2023, url: 'https://arxiv.org/abs/2302.13971' },
  { id: 'dpo', title: 'DPO: Direct Preference Optimization', year: 2023, url: 'https://arxiv.org/abs/2305.18290' },
  { id: 'qlora', title: 'QLoRA: Efficient Finetuning of Quantized LLMs', year: 2023, url: 'https://arxiv.org/abs/2305.14314' },
  { id: 'mamba', title: 'Mamba: Linear-Time Sequence Modeling', year: 2023, url: 'https://arxiv.org/abs/2312.00752' },
  { id: 'vllm', title: 'PagedAttention: Virtual Memory Management for LLMs', year: 2023, url: 'https://arxiv.org/abs/2309.06180' },
  { id: 'mistral', title: 'Mistral 7B: Efficient Language Models', year: 2023, url: 'https://arxiv.org/abs/2310.06825' },
  { id: 'tot', title: 'Tree of Thoughts: Deliberate Problem Solving', year: 2023, url: 'https://arxiv.org/abs/2305.10601' }
];


// ===================================
// Subcategories Data
// ===================================
const subcategoriesData = {
  '计量经济学': ["时间序列", "面板数据", "因果推断", "VAR/GARCH", "其他"],
  '金融机器学习': ["量化交易", "风险预测", "资产定价", "深度学习", "其他"],
  '行为金融': ["投资者行为", "市场异象", "行为资产定价", "金融科技", "其他"],
  '巨灾保险': ["地震保险", "洪水/飓风保险", "气候风险建模", "再保险", "其他"],
  '农业保险': ["农作物保险", "畜牧保险", "天气指数保险", "农业信贷", "其他"],
  '普惠金融': ["数字普惠金融", "农村信贷", "小微金融", "金融排斥", "其他"]
};

// ===================================
// State
// ===================================
let state = {
  currentCategory: "all",
  currentSubcategory: null,
  searchQuery: "",
  sortBy: "latest",
  currentPage: 1,
  papersPerPage: 10,
  readingList: new Set()
};

const PDF_STATUS = {
  UNKNOWN: 'unknown',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable'
};

const pdfAvailabilityCache = new Map();
const pdfAvailabilityPending = new Map();
let currentDetailPaperId = null;

// ===================================
// DOM Elements
// ===================================
const elements = {
  paperList: document.getElementById("paperList"),
  skeletonList: document.getElementById("skeletonList"),
  pagination: document.getElementById("pagination"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  pageTitle: document.getElementById("pageTitle"),
  subcategoryList: document.getElementById("subcategoryList"),
  hotList: document.getElementById("hotList"),
  tagCloud: document.getElementById("tagCloud"),
  sidebar: document.getElementById("sidebar")
};

// ===================================
// Helper Functions
// ===================================
function getCategoryName(category) {
  const names = {
    all: "全部论文",
    econometrics: "计量经济学",
    finml: "金融机器学习",
    behavior: "行为金融",
    catastrophe: "巨灾保险",
    agriculture: "农业保险",
    inclusive: "普惠金融"
  };
  return names[category] || category;
}

// 获取分类的 CSS 类名（中文分类 -> 英文类名）
function getCategoryClass(category) {
  const classMap = {
    '计量经济学': 'econometrics',
    '金融机器学习': 'finml',
    '行为金融': 'behavior',
    '巨灾保险': 'catastrophe',
    '农业保险': 'agriculture',
    '普惠金融': 'inclusive'
  };
  return classMap[category] || category;
}

function formatDate(dateStr) {
  if (!dateStr) return '最近';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '最近';
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function normalizePaperId(id) {
  return String(id);
}

function isSamePaperId(a, b) {
  return normalizePaperId(a) === normalizePaperId(b);
}

function getPaperIdAttr(id) {
  return encodeURIComponent(normalizePaperId(id));
}

function generateTagCloud() {
  const tags = {};
  papersData.forEach(paper => {
    paper.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  elements.tagCloud.innerHTML = sortedTags.map(([tag]) => {
    return `<span class="tag-item" onclick="searchByTag('${tag}')">${tag}</span>`;
  }).join("");
}

function renderHotList() {
  // 显示5篇经典论文
  const top5 = classicPapers.slice(0, 5);
  elements.hotList.innerHTML = top5.map((paper, index) => `
    <li class="hot-item" onclick="window.open('${paper.url}', '_blank')">
      <span class="hot-rank ${index < 3 ? `top-${index + 1}` : ''}">${index + 1}</span>
      <span class="hot-title">${paper.title}</span>
    </li>
  `).join("");
}

// 显示经典论文弹窗
function showClassicModal() {
  const modal = document.getElementById('classicModal');
  const body = document.getElementById('classicModalBody');

  body.innerHTML = `
    <h2 class="modal-title">经典论文</h2>
    <p class="modal-subtitle">23篇 LLM 经典论文 (2017-2023)</p>
    <div class="classic-list">
      ${classicPapers.map((paper, index) => `
        <a href="${paper.url}" target="_blank" class="classic-item">
          <span class="classic-rank ${index < 3 ? `top-${index + 1}` : ''}">${index + 1}</span>
          <span class="classic-info">
            <span class="classic-title">${paper.title}</span>
            <span class="classic-meta">${paper.year}</span>
          </span>
          <svg class="classic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      `).join('')}
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 关闭经典论文弹窗
function closeClassicModal() {
  const modal = document.getElementById('classicModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function updateCounts() {
  document.getElementById("countAll").textContent = papersData.length;
  document.getElementById("countEconometrics").textContent = papersData.filter(p => p.category === "计量经济学").length;
  document.getElementById("countFinML").textContent = papersData.filter(p => p.category === "金融机器学习").length;
  document.getElementById("countBehavior").textContent = papersData.filter(p => p.category === "行为金融").length;
  document.getElementById("countCatastrophe").textContent = papersData.filter(p => p.category === "巨灾保险").length;
  document.getElementById("countAgriculture").textContent = papersData.filter(p => p.category === "农业保险").length;
  document.getElementById("countInclusive").textContent = papersData.filter(p => p.category === "普惠金融").length;
}

// ===================================
// Render Functions
// ===================================
function renderPapers(papers) {
  if (papers.length === 0) {
    elements.paperList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">暂无论文</div>
        <div class="empty-state-desc">试试调整搜索条件或选择其他分类</div>
      </div>
    `;
    return;
  }

  elements.paperList.innerHTML = papers.map(paper => `
    <article class="paper-card" data-paper-id="${getPaperIdAttr(paper.id)}">
      <div class="paper-header">
        <h2 class="paper-title" onclick="viewPaper('${paper.id}')">${paper.title}</h2>
      </div>
      <div class="paper-meta">
        <span class="paper-author">${paper.authors.map((author, i) =>
          `<span class="paper-author-link" onclick="event.stopPropagation(); viewAuthor('${author}');">${author}</span>${i < paper.authors.length - 1 ? ', ' : ''}`
        ).join('')}</span>
        <span class="paper-source">${paper.source}</span>
        <span>${formatDate(paper.date)}</span>
        <span class="paper-tag ${getCategoryClass(paper.category)}">${getCategoryName(paper.category)}</span>
      </div>
      <p class="paper-abstract">${paper.abstract}</p>
      <div class="paper-footer">
        <div class="paper-stats">
          <span class="paper-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
            </svg>
            ${paper.citations.toLocaleString()}
          </span>
          ${paper.tags.map(tag => `<span class="paper-stat" onclick="searchByTag('${tag}')">#${tag}</span>`).join("")}
        </div>
        <div class="paper-links">
          <a href="#" class="paper-link paper-link-secondary" onclick="viewPaper('${paper.id}')">详情</a>
          ${renderPaperPdfLink(paper)}
        </div>
      </div>
      ${paper.url ? `<div class="paper-url"><a href="${paper.url}" target="_blank">${paper.url}</a></div>` : ''}
    </article>
  `).join("");
}

function renderPagination(totalPapers) {
  const totalPages = Math.ceil(totalPapers / state.papersPerPage);

  if (totalPages <= 1) {
    elements.pagination.innerHTML = "";
    return;
  }

  let html = "";

  // Previous button
  html += `<button class="pagination-btn" onclick="goToPage(${state.currentPage - 1})" ${state.currentPage === 1 ? "disabled" : ""}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  </button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
      html += `<button class="pagination-btn ${i === state.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
      html += `<span class="pagination-btn" style="border: none;">...</span>`;
    }
  }

  // Next button
  html += `<button class="pagination-btn" onclick="goToPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? "disabled" : ""}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  </button>`;

  elements.pagination.innerHTML = html;
}

function renderSubcategories(category) {
  const subcategorySection = document.getElementById("subcategorySection");
  if (!subcategoriesData[category]) {
    elements.subcategoryList.innerHTML = "";
    elements.subcategoryList.classList.remove("show");
    if (subcategorySection) subcategorySection.style.display = "none";
    return;
  }

  // 显示子领域区域
  if (subcategorySection) subcategorySection.style.display = "block";

  // 统计每个子领域的论文数量
  const subCounts = {};
  papersData.forEach(paper => {
    if (paper.category === category && paper.subcategory) {
      subCounts[paper.subcategory] = (subCounts[paper.subcategory] || 0) + 1;
    }
  });

  elements.subcategoryList.innerHTML = subcategoriesData[category].map(sub => {
    const count = subCounts[sub] || 0;
    return `
    <a href="#" class="subcategory-item ${state.currentSubcategory === sub ? 'active' : ''}"
       onclick="selectSubcategory('${sub}')">${sub} <span class="sub-count">(${count})</span></a>
  `}).join("");

  elements.subcategoryList.classList.add("show");
}

// ===================================
// Filter & Sort Functions
// ===================================
function getFilteredPapers() {
  let filtered = [...papersData];

  // Filter by category
  if (state.currentCategory !== "all") {
    filtered = filtered.filter(p => p.category === state.currentCategory);
  }

  // Filter by subcategory
  if (state.currentSubcategory) {
    filtered = filtered.filter(p => p.subcategory === state.currentSubcategory);
  }

  // Filter by search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(query) ||
      (Array.isArray(p.authors) && p.authors.some(a => a.toLowerCase().includes(query))) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(query))) ||
      (p.abstract && p.abstract.toLowerCase().includes(query))
    );
  }

  // Sort
  switch (state.sortBy) {
    case "latest":
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case "cited":
      filtered.sort((a, b) => b.citations - a.citations);
      break;
    case "popular":
      filtered.sort((a, b) => b.citations - a.citations);
      break;
  }

  return filtered;
}

function applyFilters() {
  const filtered = getFilteredPapers();
  const startIndex = (state.currentPage - 1) * state.papersPerPage;
  const paginatedPapers = filtered.slice(startIndex, startIndex + state.papersPerPage);

  elements.paperList.style.display = "none";
  elements.skeletonList.classList.add("show");

  // Simulate loading
  setTimeout(() => {
    elements.skeletonList.classList.remove("show");
    elements.paperList.style.display = "flex";
    renderPapers(paginatedPapers);
    renderPagination(filtered.length);
  }, 400);
}

// ===================================
// Event Handlers
// ===================================
function selectCategory(category) {
  state.currentCategory = category;
  state.currentSubcategory = null;
  state.currentPage = 1;

  // Update active state in nav
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.category === category);
  });

  // Update page title
  elements.pageTitle.textContent = getCategoryName(category);

  // Render subcategories
  renderSubcategories(category);

  // Update mobile nav
  document.querySelectorAll(".mobile-nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.category === category);
  });

  applyFilters();
}

function selectSubcategory(subcategory) {
  state.currentSubcategory = subcategory;
  state.currentPage = 1;

  document.querySelectorAll(".subcategory-item").forEach(item => {
    item.classList.toggle("active", item.textContent.trim() === subcategory);
  });

  elements.pageTitle.textContent = `${getCategoryName(state.currentCategory)} / ${subcategory}`;
  applyFilters();
}

function goToPage(page) {
  const filtered = getFilteredPapers();
  const totalPages = Math.ceil(filtered.length / state.papersPerPage);

  if (page < 1 || page > totalPages) return;

  state.currentPage = page;
  applyFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleReadingList(id) {
  if (state.readingList.has(id)) {
    state.readingList.delete(id);
  } else {
    state.readingList.add(id);
  }
  applyFilters();
}

async function viewPaper(id) {
  // 先从本地数据查找
  let paper = papersData.find(p => isSamePaperId(p.id, id));

  // 如果本地没有，从 API 获取
  if (!paper) {
    try {
      const response = await fetch(`${API_BASE}/api/papers/${id}`);
      if (response.ok) {
        const apiPaper = await response.json();
        // 转换为前端格式
        paper = {
          id: apiPaper.id,
          title: apiPaper.title,
          authors: apiPaper.authors,
          source: apiPaper.source || 'arXiv',
          date: apiPaper.date,
          abstract: apiPaper.abstract,
          category: apiPaper.category,
          subcategory: apiPaper.subcategory,
          tags: apiPaper.tags || [],
          citations: apiPaper.citations || 0,
          pdfUrl: apiPaper.pdfUrl || '',
          url: apiPaper.url || `https://arxiv.org/abs/${apiPaper.id}`
        };
      }
    } catch (e) {
      console.error('Failed to fetch paper:', e);
    }
  }

  if (!paper) return;

  currentDetailPaperId = normalizePaperId(paper.id);

  // 标记已读
  markPushAsRead(id);

  // 获取相关论文
  const relatedPapers = getRelatedPapers(paper);

  // 渲染作者（可点击）
  const authorsHtml = paper.authors.map((author, index) => {
    return `<span class="paper-author-link" onclick="viewAuthor('${author}'); closePaperModal();">${author}</span>${index < paper.authors.length - 1 ? ', ' : ''}`;
  }).join('');

  // 渲染详情
  const modalBody = document.getElementById("paperModalBody");
  modalBody.innerHTML = `
    <div class="paper-detail-header">
      <div class="paper-detail-category">
        <span class="paper-detail-tag ${getCategoryClass(paper.category)}">${getCategoryName(paper.category)}</span>
        <span class="paper-detail-subcategory">${paper.subcategory}</span>
      </div>
      <h1 class="paper-detail-title">${paper.title}</h1>
      <div class="paper-detail-meta">
        <span class="paper-detail-author">${authorsHtml}</span>
        <span class="paper-detail-source">${paper.source}</span>
        <span>${formatDate(paper.date)}</span>
      </div>
      <div class="paper-detail-actions">
        ${buildPaperDetailPdfAction(paper)}
        <button class="paper-detail-action secondary" onclick='exportCitation(${JSON.stringify(paper.id)})'>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          导出引用
        </button>
        <button class="paper-detail-action secondary ${state.readingList.has(paper.id) ? 'active' : ''}"
                onclick='toggleReadingList(${JSON.stringify(paper.id)}); viewPaper(${JSON.stringify(paper.id)});'>
          <svg viewBox="0 0 24 24" fill="${state.readingList.has(paper.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"></path>
          </svg>
          ${state.readingList.has(paper.id) ? '已加入' : '待读'}
        </button>
        <button class="paper-detail-action secondary" onclick='sharePaper(${JSON.stringify(paper.id)})'>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          分享
        </button>
      </div>
    </div>

    <div class="paper-detail-section">
      <h3 class="paper-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        摘要
      </h3>
      <p class="paper-detail-abstract">${paper.abstract}</p>
    </div>

    <div class="paper-detail-section">
      <h3 class="paper-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        标签
      </h3>
      <div class="paper-detail-tags">
        ${paper.tags.map(tag => `
          <span class="paper-detail-tag-item" onclick="searchByTag('${tag}')">${tag}</span>
        `).join("")}
      </div>
    </div>

    <div class="paper-detail-section">
      <h3 class="paper-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        数据统计
      </h3>
      <div class="paper-detail-stats">
        <div class="paper-detail-stat">
          <div class="paper-detail-stat-value">${paper.citations.toLocaleString()}</div>
          <div class="paper-detail-stat-label">引用次数</div>
        </div>
        <div class="paper-detail-stat">
          <div class="paper-detail-stat-value">${paper.authors.length}</div>
          <div class="paper-detail-stat-label">作者数量</div>
        </div>
        <div class="paper-detail-stat">
          <div class="paper-detail-stat-value">${paper.tags.length}</div>
          <div class="paper-detail-stat-label">标签数量</div>
        </div>
        <div class="paper-detail-stat">
          <div class="paper-detail-stat-value">${getDaysSincePublish(paper.date)}</div>
          <div class="paper-detail-stat-label">发布天数</div>
        </div>
      </div>
    </div>

    <div class="paper-detail-section">
      <h3 class="paper-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        相关论文
      </h3>
      <div class="paper-detail-related">
        ${relatedPapers.map(rel => `
          <div class="paper-related-card" onclick="viewPaper('${rel.id}')">
            <div class="paper-related-card-title">${rel.title}</div>
            <div class="paper-related-card-meta">${rel.source} · ${formatDate(rel.date)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // 显示模态框
  const modal = document.getElementById("paperModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePaperModal() {
  const modal = document.getElementById("paperModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  currentDetailPaperId = null;
}

// 获取相关论文
function getRelatedPapers(paper) {
  return papersData
    .filter(p => !isSamePaperId(p.id, paper.id))
    .filter(p =>
      p.category === paper.category ||
      p.tags.some(t => paper.tags.includes(t))
    )
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 4);
}

// 获取发布天数
function getDaysSincePublish(dateStr) {
  const publishDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - publishDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// 分享论文
function sharePaper(id) {
  const paper = papersData.find(p => isSamePaperId(p.id, id));
  if (!paper) return;

  // 复制链接到剪贴板
  const shareUrl = `${window.location.origin}/paper/${encodeURIComponent(id)}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert("链接已复制到剪贴板");
  });
}

// ===================================
// Author Service - 作者服务
// ===================================

// 获取所有作者统计（从论文数据中提取）
function getAllAuthors() {
  const authorStats = {};

  papersData.forEach(paper => {
    paper.authors.forEach(author => {
      if (!authorStats[author]) {
        authorStats[author] = {
          name: author,
          paperCount: 0,
          totalCitations: 0,
          categories: new Set(),
          papers: []
        };
      }
      authorStats[author].paperCount += 1;
      authorStats[author].totalCitations += paper.citations || 0;
      authorStats[author].categories.add(paper.category);
      authorStats[author].papers.push({
        id: paper.id,
        title: paper.title,
        source: paper.source,
        date: paper.date,
        citations: paper.citations,
        category: paper.category
      });
    });
  });

  return Object.values(authorStats)
    .map(a => ({
      ...a,
      categories: [...a.categories]
    }))
    .sort((a, b) => b.totalCitations - a.totalCitations);
}

// 计算H指数
function calculateHIndex(citations) {
  const sorted = [...citations].sort((a, b) => b - a);
  let hIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) hIndex = i + 1;
    else break;
  }
  return hIndex;
}

// 打开作者详情
function viewAuthor(authorName) {
  const authors = getAllAuthors();
  const author = authors.find(a => a.name === authorName);

  if (!author) return;

  const hIndex = calculateHIndex(author.papers.map(p => p.citations));
  const citations = author.papers.map(p => p.citations);

  // 计算年份统计
  const yearStats = {};
  author.papers.forEach(p => {
    const year = new Date(p.date).getFullYear();
    yearStats[year] = (yearStats[year] || 0) + 1;
  });

  // 计算类别统计
  const categoryStats = {};
  author.papers.forEach(p => {
    categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
  });

  // 找出合作者
  const collaborators = {};
  author.papers.forEach(p => {
    p.authors.forEach(a => {
      if (a !== authorName) {
        collaborators[a] = (collaborators[a] || 0) + 1;
      }
    });
  });

  const topCollaborators = Object.entries(collaborators)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const modalBody = document.getElementById("authorModalBody");
  modalBody.innerHTML = `
    <div class="author-header">
      <div class="author-avatar-large">${authorName.charAt(0)}</div>
      <div class="author-info">
        <h2>${authorName}</h2>
        <p class="author-institution">研究者</p>
        <div class="author-stats-row">
          <div class="author-stat">
            <div class="author-stat-value">${author.paperCount}</div>
            <div class="author-stat-label">论文数量</div>
          </div>
          <div class="author-stat">
            <div class="author-stat-value">${author.totalCitations.toLocaleString()}</div>
            <div class="author-stat-label">总引用</div>
          </div>
          <div class="author-stat">
            <div class="author-stat-value">${hIndex}</div>
            <div class="author-stat-label">H指数</div>
          </div>
          <div class="author-stat">
            <div class="author-stat-value">${author.categories.length}</div>
            <div class="author-stat-label">研究领域</div>
          </div>
        </div>
      </div>
    </div>

    <div class="author-section">
      <h3 class="author-section-title">论文列表 (${author.papers.length})</h3>
      <div class="author-papers-list">
        ${author.papers.slice(0, 10).map(p => `
          <div class="author-paper-item" onclick="viewPaper('${p.id}'); closeAuthorModal();">
            <div class="author-paper-title">${p.title}</div>
            <div class="author-paper-meta">${p.source} · ${formatDate(p.date)} · ${p.citations} 引用</div>
          </div>
        `).join("")}
      </div>
    </div>

    ${topCollaborators.length > 0 ? `
    <div class="author-section">
      <h3 class="author-section-title">合作学者</h3>
      <div class="author-collaborators">
        ${topCollaborators.map(([name, count]) => `
          <span class="author-collaborator" onclick="viewAuthor('${name}');">${name} (${count})</span>
        `).join("")}
      </div>
    </div>
    ` : ''}
  `;

  const modal = document.getElementById("authorModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAuthorModal() {
  const modal = document.getElementById("authorModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ===================================
// Citation Service - 引用服务
// ===================================

// 引用格式化
function formatCitation(paper, style) {
  const authors = paper.authors;
  const year = new Date(paper.date).getFullYear();

  switch (style) {
    case 'apa':
      // Last, F. M., & Last, F. M. (Year). Title. Source.
      const apaAuthors = authors.map((a, i) => {
        const parts = a.split(' ');
        if (parts.length === 1) return a;
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n.charAt(0).toUpperCase() + '.').join(' ');
        return i === authors.length - 1 && authors.length > 1 ? `& ${lastName}, ${initials}` : `${lastName}, ${initials}`;
      }).join(', ');
      return `${apaAuthors} (${year}). ${paper.title}. ${paper.source}.`;

    case 'mla':
      // "Title." Source, Year.
      return `"${paper.title}." ${paper.source}, ${year}.`;

    case 'chicago':
      // Last, First. "Title." Source (Year).
      const chiAuthors = authors.map((a, i) => {
        const parts = a.split(' ');
        if (parts.length === 1) return a;
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return i === 0 ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
      }).join(', ');
      return `${chiAuthors}. "${paper.title}." ${paper.source} (${year}).`;

    case 'gbt':
      // 作者. 题目[J]. 刊名, 年.
      return `${authors.join(', ')}. ${paper.title}[J]. ${paper.source}, ${year}.`;

    default:
      return `${authors.join(', ')} (${year}). ${paper.title}. ${paper.source}.`;
  }
}

// 打开引用导出弹窗
function exportCitation(id) {
  const paper = papersData.find(p => isSamePaperId(p.id, id));
  if (!paper) return;

  let currentStyle = 'apa';

  function renderCitation() {
    const modalBody = document.getElementById("citationModalBody");
    modalBody.innerHTML = `
      <h3 class="citation-title">导出引用格式</h3>
      <div class="citation-format-tabs">
        <button class="citation-format-tab ${currentStyle === 'apa' ? 'active' : ''}" onclick="setCitationStyle('apa')">APA</button>
        <button class="citation-format-tab ${currentStyle === 'mla' ? 'active' : ''}" onclick="setCitationStyle('mla')">MLA</button>
        <button class="citation-format-tab ${currentStyle === 'chicago' ? 'active' : ''}" onclick="setCitationStyle('chicago')">Chicago</button>
        <button class="citation-format-tab ${currentStyle === 'gbt' ? 'active' : ''}" onclick="setCitationStyle('gbt')">GB/T</button>
      </div>
      <div class="citation-preview">
        <p class="citation-preview-text" id="citationText">${formatCitation(paper, currentStyle)}</p>
      </div>
      <button class="citation-copy-btn" onclick="copyCitation()">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        复制到剪贴板
      </button>
      <div class="citation-export-btns">
        <button class="citation-export-btn" onclick="downloadBibTeX()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          BibTeX
        </button>
        <button class="citation-export-btn" onclick="downloadRIS()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          RIS
        </button>
        <button class="citation-export-btn" onclick="downloadCSV()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          CSV
        </button>
      </div>
    `;
  }

  // 暴露给全局
  window.setCitationStyle = (style) => {
    currentStyle = style;
    document.getElementById("citationText").textContent = formatCitation(paper, style);
    document.querySelectorAll('.citation-format-tab').forEach((btn, i) => {
      const styles = ['apa', 'mla', 'chicago', 'gbt'];
      btn.classList.toggle('active', styles[i] === style);
    });
  };

  window.copyCitation = () => {
    const text = formatCitation(paper, currentStyle);
    navigator.clipboard.writeText(text).then(() => {
      alert("引用已复制到剪贴板");
    });
  };

  window.downloadBibTeX = () => {
    const bibtex = `@article{${paper.authors[0]?.split(' ').pop()}${new Date(paper.date).getFullYear()},
  title = {${paper.title}},
  author = {${paper.authors.join(' and ')}},
  journal = {${paper.source}},
  year = {${new Date(paper.date).getFullYear()}}
}`;
    downloadFile(bibtex, `${paper.title.substring(0, 20)}.bib`, 'text/plain');
  };

  window.downloadRIS = () => {
    const ris = `TY  - JOUR
TI  - ${paper.title}
AU  - ${paper.authors.join('\nAU  - ')}
JO  - ${paper.source}
PY  - ${new Date(paper.date).getFullYear()}
AB  - ${paper.abstract?.substring(0, 500) || ''}
ER  - `;
    downloadFile(ris, `${paper.title.substring(0, 20)}.ris`, 'text/plain');
  };

  window.downloadCSV = () => {
    const csv = `Title,Authors,Source,Date,Category,Citations\n"${paper.title}","${paper.authors.join('; ')}","${paper.source}",${paper.date},${paper.category},${paper.citations}`;
    downloadFile(csv, `${paper.title.substring(0, 20)}.csv`, 'text/csv');
  };

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderCitation();

  const modal = document.getElementById("citationModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCitationModal() {
  const modal = document.getElementById("citationModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ===================================
// PDF Service - PDF下载/预览
// ===================================

let currentPdfPaper = null;

function getPdfStatusFromCache(pdfUrl) {
  if (!pdfUrl) return PDF_STATUS.UNAVAILABLE;
  const cached = pdfAvailabilityCache.get(pdfUrl);
  return cached?.status || PDF_STATUS.UNKNOWN;
}

function getPaperPdfStatus(paper) {
  if (!paper || !paper.pdfUrl) return PDF_STATUS.UNAVAILABLE;
  return getPdfStatusFromCache(paper.pdfUrl);
}

function buildPaperDetailPdfAction(paper) {
  const actionSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `;
  const openPdfAction = `openPdfViewer(${JSON.stringify(paper.id)})`;
  const pdfStatus = getPaperPdfStatus(paper);

  if (!paper.pdfUrl) {
    return `
      <button id="paperDetailPdfAction" class="paper-detail-action secondary" onclick='${openPdfAction}'>
        ${actionSvg}
        请求 PDF
      </button>
    `;
  }

  if (pdfStatus === PDF_STATUS.UNAVAILABLE) {
    return `
      <button id="paperDetailPdfAction" class="paper-detail-action secondary" disabled title="PDF链接不可用">
        ${actionSvg}
        PDF 不可用
      </button>
    `;
  }

  return `
    <button id="paperDetailPdfAction" class="paper-detail-action primary" onclick='${openPdfAction}'>
      ${actionSvg}
      查看 PDF
    </button>
  `;
}

function renderPaperPdfLink(paper) {
  const paperIdAttr = getPaperIdAttr(paper.id);
  const openAction = `event.preventDefault(); openPdfViewer(${JSON.stringify(paper.id)});`;
  const pdfStatus = getPaperPdfStatus(paper);

  if (!paper.pdfUrl) {
    return `<a href="#" class="paper-link paper-link-disabled" data-role="paper-pdf-link" data-paper-id="${paperIdAttr}" title="暂无可用PDF" onclick='${openAction}'>PDF</a>`;
  }

  if (pdfStatus === PDF_STATUS.UNAVAILABLE) {
    return `<a href="#" class="paper-link paper-link-disabled" data-role="paper-pdf-link" data-paper-id="${paperIdAttr}" title="PDF链接不可用" aria-disabled="true" onclick="event.preventDefault(); return false;">PDF</a>`;
  }

  return `<a href="#" class="paper-link paper-link-primary" data-role="paper-pdf-link" data-paper-id="${paperIdAttr}" onclick='${openAction}'>PDF</a>`;
}

function updatePaperCardPdfButton(paper) {
  return renderPaperPdfLink(paper);
}

function refreshPdfButtonsForPaper(paper) {
  const paperIdAttr = getPaperIdAttr(paper.id);
  const cardPdfBtn = document.querySelector(`[data-role="paper-pdf-link"][data-paper-id="${paperIdAttr}"]`);
  if (cardPdfBtn) {
    cardPdfBtn.outerHTML = updatePaperCardPdfButton(paper);
  }

  if (currentDetailPaperId && isSamePaperId(currentDetailPaperId, paper.id)) {
    const detailPdfBtn = document.getElementById("paperDetailPdfAction");
    if (detailPdfBtn) {
      detailPdfBtn.outerHTML = buildPaperDetailPdfAction(paper);
    }
  }
}

function getPaperPageUrl(paper) {
  let paperPageUrl = paper.url;

  if (paperPageUrl && paperPageUrl.includes('.pdf')) {
    if (paperPageUrl.includes('ssrn.com')) {
      const match = paperPageUrl.match(/abstract_id=(\d+)/);
      if (match) {
        paperPageUrl = `https://papers.ssrn.com/sol3/papers.cfm?abstract_id=${match[1]}`;
      }
    }
    if (paperPageUrl.includes('nber.org')) {
      const match = paperPageUrl.match(/w(\d+)/);
      if (match) {
        paperPageUrl = `https://www.nber.org/papers/w${match[1]}`;
      }
    }
  }

  return paperPageUrl;
}

function setPdfModalActionButtons({
  showDownload = false,
  showOpen = false,
  openHref = "#",
  disableDownload = false,
  disableOpen = false
}) {
  const pdfDownloadBtn = document.getElementById("pdfDownloadBtn");
  const pdfOpenBtn = document.getElementById("pdfOpenBtn");

  pdfDownloadBtn.style.display = showDownload ? 'flex' : 'none';
  pdfOpenBtn.style.display = showOpen ? 'flex' : 'none';

  pdfDownloadBtn.disabled = disableDownload;
  pdfDownloadBtn.classList.toggle('disabled', disableDownload);

  pdfOpenBtn.classList.toggle('disabled', disableOpen);
  if (disableOpen) {
    pdfOpenBtn.setAttribute('aria-disabled', 'true');
    pdfOpenBtn.href = '#';
  } else {
    pdfOpenBtn.removeAttribute('aria-disabled');
    pdfOpenBtn.href = openHref;
  }
}

function setPdfAlternativeButtons(paperPageUrl) {
  const pdfNoSource = document.getElementById("pdfNoSource");
  const altBtns = pdfNoSource.querySelectorAll('.pdf-alt-btn');
  const alternatives = pdfNoSource.querySelector('.pdf-alternatives');

  if (!altBtns.length || !alternatives) return;

  altBtns[0].onclick = searchPaperOnline;
  altBtns[0].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="M21 21l-4.35-4.35"></path>
  </svg>百度学术搜索`;

  if (paperPageUrl) {
    altBtns[0].onclick = () => window.open(paperPageUrl, '_blank');
    altBtns[0].innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>查看论文页面`;
  }

  alternatives.style.display = 'flex';
}

function showPdfNoSource(paper, titleText, descText, disableActions = false) {
  const pdfViewer = document.getElementById("pdfViewer");
  const pdfViewerContainer = document.getElementById("pdfViewerContainer");
  const pdfNoSource = document.getElementById("pdfNoSource");
  const titleEl = pdfNoSource.querySelector('h4');
  const descEl = pdfNoSource.querySelector('p');

  pdfViewer.src = "";
  pdfViewerContainer.style.display = 'none';
  pdfNoSource.style.display = 'flex';

  if (titleEl) titleEl.textContent = titleText;
  if (descEl) descEl.textContent = descText;

  if (paper?.pdfUrl && disableActions) {
    setPdfModalActionButtons({
      showDownload: true,
      showOpen: true,
      disableDownload: true,
      disableOpen: true
    });
  } else {
    setPdfModalActionButtons({ showDownload: false, showOpen: false });
  }

  setPdfAlternativeButtons(getPaperPageUrl(paper));
}

function showPdfCheckingState() {
  const pdfNoSource = document.getElementById("pdfNoSource");
  const titleEl = pdfNoSource.querySelector('h4');
  const descEl = pdfNoSource.querySelector('p');
  const alternatives = pdfNoSource.querySelector('.pdf-alternatives');
  const pdfViewer = document.getElementById("pdfViewer");
  const pdfViewerContainer = document.getElementById("pdfViewerContainer");

  pdfViewer.src = "";
  pdfViewerContainer.style.display = 'none';
  pdfNoSource.style.display = 'flex';
  if (titleEl) titleEl.textContent = '正在检测 PDF 可用性';
  if (descEl) descEl.textContent = '请稍候，我们正在确认该链接是否可访问。';
  if (alternatives) alternatives.style.display = 'none';
  setPdfModalActionButtons({ showDownload: true, showOpen: true, disableDownload: true, disableOpen: true });
}

function showPdfPreview(paper) {
  const pdfViewer = document.getElementById("pdfViewer");
  const pdfViewerContainer = document.getElementById("pdfViewerContainer");
  const pdfNoSource = document.getElementById("pdfNoSource");

  pdfViewerContainer.style.display = 'block';
  pdfNoSource.style.display = 'none';

  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
  pdfViewer.src = viewerUrl;

  setPdfModalActionButtons({
    showDownload: true,
    showOpen: true,
    openHref: paper.pdfUrl,
    disableDownload: false,
    disableOpen: false
  });
}

async function fetchPdfAvailability(pdfUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE}/api/proxy?url=${encodeURIComponent(pdfUrl)}`, {
      method: 'GET',
      signal: controller.signal
    });

    if (response.body && typeof response.body.cancel === 'function') {
      response.body.cancel();
    }

    if (!response.ok) {
      return { status: PDF_STATUS.UNAVAILABLE, reason: `http_${response.status}` };
    }

    return { status: PDF_STATUS.AVAILABLE };
  } catch (error) {
    console.warn('PDF可用性检测失败:', error);
    return { status: PDF_STATUS.UNAVAILABLE, reason: 'check_failed' };
  } finally {
    clearTimeout(timeout);
  }
}

async function ensurePdfAvailability(pdfUrl, { force = false } = {}) {
  if (!pdfUrl) return { status: PDF_STATUS.UNAVAILABLE, reason: 'missing_url' };

  const cached = pdfAvailabilityCache.get(pdfUrl);
  if (!force && cached) {
    return cached;
  }

  if (pdfAvailabilityPending.has(pdfUrl)) {
    return pdfAvailabilityPending.get(pdfUrl);
  }

  const pendingPromise = (async () => {
    const result = await fetchPdfAvailability(pdfUrl);
    if (result.status === PDF_STATUS.UNKNOWN) {
      pdfAvailabilityCache.delete(pdfUrl);
    } else {
      pdfAvailabilityCache.set(pdfUrl, result);
    }
    pdfAvailabilityPending.delete(pdfUrl);
    return result;
  })();

  pdfAvailabilityPending.set(pdfUrl, pendingPromise);
  return pendingPromise;
}

function markPdfUnavailable(paper, reason = 'unreachable') {
  if (!paper?.pdfUrl) return;
  pdfAvailabilityCache.set(paper.pdfUrl, { status: PDF_STATUS.UNAVAILABLE, reason });
  refreshPdfButtonsForPaper(paper);
}

// 打开PDF预览
async function openPdfViewer(id) {
  const paper = papersData.find(p => isSamePaperId(p.id, id));
  if (!paper) return;

  currentPdfPaper = paper;

  const modalTitle = document.getElementById("pdfModalTitle");
  modalTitle.textContent = paper.title;

  const modal = document.getElementById("pdfModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  if (!paper.pdfUrl) {
    showPdfNoSource(paper, '暂无可用 PDF', '该论文暂无 PDF 资源，您可以：');
    return;
  }

  showPdfCheckingState();
  const availability = await ensurePdfAvailability(paper.pdfUrl);

  if (availability.status === PDF_STATUS.UNAVAILABLE) {
    markPdfUnavailable(paper, availability.reason);
    showPdfNoSource(paper, 'PDF 暂时不可访问', '该链接当前无法打开，已自动灰色显示。', true);
    return;
  }

  showPdfPreview(paper);
  refreshPdfButtonsForPaper(paper);
}

function closePdfModal() {
  const modal = document.getElementById("pdfModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";

  // 清除iframe
  const pdfViewer = document.getElementById("pdfViewer");
  pdfViewer.src = "";
  currentPdfPaper = null;
}

// 下载PDF
function downloadPdf() {
  if (!currentPdfPaper || !currentPdfPaper.pdfUrl) return;

  // 创建下载链接
  const link = document.createElement('a');
  link.href = currentPdfPaper.pdfUrl;
  link.target = '_blank';

  // 设置下载属性（如果浏览器支持）
  const filename = currentPdfPaper.title.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 搜索 arXiv
function searchArxiv() {
  if (!currentPdfPaper) return;

  const query = currentPdfPaper.title;
  const searchUrl = `https://arxiv.org/search/advanced?advanced=&classification-physics_archives=all&classification-q_math=all&date-filter_by=all_dates&size=50&order=-announced_date_first&abstracts=show`;
  window.open(searchUrl, '_blank');
}

// 在线搜索PDF - 使用百度学术
function searchPaperOnline() {
  if (!currentPdfPaper) return;

  const query = `${currentPdfPaper.title} ${currentPdfPaper.authors[0]}`;
  // 使用百度学术搜索
  const searchUrl = `https://xueshu.baidu.com/s?wd=${encodeURIComponent(query)}&rsv_bp=0&tn=SE_baiduxueshu_c1gjeupa&ie=utf-8&sc_from=result`;
  window.open(searchUrl, '_blank');
}

// 请求添加PDF
function requestPdf() {
  alert("感谢您的反馈！我们会尽快添加该论文的PDF资源。");
  closePdfModal();
}

function searchByTag(tag) {
  state.searchQuery = tag;
  elements.searchInput.value = tag;
  state.currentCategory = "all";
  state.currentSubcategory = null;
  state.currentPage = 1;

  // Reset nav
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.category === "all");
  });
  elements.pageTitle.textContent = `搜索: ${tag}`;
  elements.subcategoryList.classList.remove("show");

  applyFilters();
}

// ===================================
// Event Listeners
// ===================================
// Search input
let searchTimeout;
elements.searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    state.currentPage = 1;
    applyFilters();
  }, 300);
});

// Sort select
elements.sortSelect.addEventListener("change", (e) => {
  state.sortBy = e.target.value;
  applyFilters();
});

// Category navigation
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    selectCategory(item.dataset.category);
  });
});

// Mobile navigation
document.querySelectorAll(".mobile-nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    selectCategory(item.dataset.category);
  });
});

// 每日推送"查看全部"点击事件
document.querySelector(".daily-push-more")?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (dailyPushMoreMode === 'today_more' && allTodayPapers.length > 5) {
    showAllTodayPapers();
    return;
  }
  await showPushHistory();
});

// 显示推送历史（最近一周）
async function showPushHistory() {
  const paperList = document.getElementById("paperList");
  const pageTitle = document.getElementById("pageTitle");
  const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  pageTitle.textContent = "推送历史";
  paperList.innerHTML = '<div class="loading">加载中...</div>';

  try {
    const response = await fetch(`${API_BASE}/api/push/history`);
    const data = await response.json();

    if (!data.history || data.history.length === 0) {
      paperList.innerHTML = '<p>暂无推送历史</p>';
      return;
    }

    // 渲染历史推送
    let html = '';
    data.history.forEach(dayPush => {
      const date = new Date(dayPush.date);
      const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      const weekday = WEEKDAY_LABELS[date.getDay()];
      const windowStart = new Date(date);
      windowStart.setDate(windowStart.getDate() - 2);
      const windowStr = `${windowStart.getFullYear()}年${windowStart.getMonth() + 1}月${windowStart.getDate()}日 - ${dateStr}`;

      html += `
        <div class="push-history-day">
          <h3 class="push-history-date">推送日期：${dateStr}（${weekday}）</h3>
          <div class="push-history-window">统计窗口：${windowStr}</div>
          <div class="push-history-papers">
      `;

      if (!dayPush.hasNewPapers || !Array.isArray(dayPush.papers) || dayPush.papers.length === 0) {
        html += `
          <div class="push-history-empty">${dayPush.message || '该日期无推送内容'}</div>
        `;
      } else {
        dayPush.papers.forEach(paper => {
          const isNew = (new Date() - new Date(paper.date)) < 30 * 24 * 60 * 60 * 1000;
          const isHot = paper.citations > 5000;
          const categoryClass = getCategoryClass(paper.category) || paper.category;

          html += `
            <div class="paper-card" onclick="viewPaper('${paper.id}')">
              <div class="paper-header">
                <span class="paper-category ${categoryClass}">${paper.category}</span>
                ${isNew ? '<span class="paper-badge new">🆕</span>' : ''}
                ${isHot ? '<span class="paper-badge hot">🔥</span>' : ''}
              </div>
              <h3 class="paper-title">${paper.title}</h3>
              <div class="paper-meta">
                <span class="paper-authors">${paper.authors.join(', ')}</span>
                <span class="paper-source">${paper.source || paper.venue || 'arXiv'}</span>
                <span class="paper-date">${paper.date}</span>
              </div>
              <p class="paper-abstract">${paper.abstract}</p>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    paperList.innerHTML = html;
  } catch (error) {
    console.error('获取推送历史失败:', error);
    paperList.innerHTML = '<p>加载失败，请稍后重试</p>';
  }
}

// Keyboard shortcut for search and modal
document.addEventListener("keydown", (e) => {
  // 搜索: Cmd/Ctrl + K
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    elements.searchInput.focus();
  }
  // 关闭模态框: ESC
  if (e.key === "Escape") {
    closePaperModal();
    closeAuthorModal();
    closeCitationModal();
    closePdfModal();
  }
});

// ===================================
// Daily Push - 每日推送功能
// ===================================

// 获取每日推送论文
function getDailyPushPapers() {
  const pushCount = 5;
  const papers = [...papersData];

  // 简单策略：最新5篇论文
  return papers
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, pushCount);
}

// 存储今日推送的全部论文（用于查看全部）
let allTodayPapers = [];
let dailyPushMoreMode = 'history';

function updateDailyPushMoreButton(dailyPushMore, pushPapers = []) {
  if (!dailyPushMore) return;

  if (pushPapers.length > 5) {
    dailyPushMoreMode = 'today_more';
    dailyPushMore.textContent = `更多 (${pushPapers.length}) →`;
  } else {
    dailyPushMoreMode = 'history';
    dailyPushMore.textContent = '推送历史 →';
  }

  dailyPushMore.style.display = '';
}

// 渲染推送卡片
function renderPushCards(papers, container) {
  container.innerHTML = papers.map(paper => {
    const isNew = (new Date() - new Date(paper.date)) < 30 * 24 * 60 * 60 * 1000;
    const isHot = paper.citations > 5000;
    const categoryClass = getCategoryClass(paper.category) || paper.category;

    return `
      <div class="push-card" onclick="viewPaper('${paper.id}')">
        <span class="push-card-tag ${categoryClass}">${paper.category}</span>
        <h4 class="push-card-title">${paper.title}</h4>
        <div class="push-card-meta">${paper.source || paper.venue || 'arXiv'}</div>
        ${isNew ? '<span class="push-card-badge new">🆕 新论文</span>' : ''}
        ${isHot ? '<span class="push-card-badge hot">🔥 热门</span>' : ''}
      </div>
    `;
  }).join("");
}

// 渲染每日推送
async function renderDailyPush() {
  const pushGrid = document.getElementById("pushGrid");
  const pushDate = document.getElementById("pushDate");
  const dailyPushMore = document.querySelector(".daily-push-more");

  try {
    // 从 API 获取今日推送
    const response = await fetch(`${API_BASE}/api/push/daily`);
    const data = await response.json();

    const pushPapers = data.papers || [];
    const today = new Date();
    pushDate.textContent = `· ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    // 存储全部论文
    allTodayPapers = pushPapers;

    // 检查是否有新论文
    if (!data.hasNewPapers || pushPapers.length === 0) {
      pushGrid.innerHTML = `
        <div class="push-card empty">
          <div class="push-empty-icon">📭</div>
          <div class="push-empty-text">${data.message || '今日暂无内容'}</div>
        </div>
      `;
      updateDailyPushMoreButton(dailyPushMore, []);
      return;
    }

    // 渲染推送卡片（只显示前5篇）
    const displayPapers = pushPapers.slice(0, 5);
    renderPushCards(displayPapers, pushGrid);

    updateDailyPushMoreButton(dailyPushMore, pushPapers);
  } catch (error) {
    console.error('获取每日推送失败:', error);
    pushGrid.innerHTML = '<p>暂无推送</p>';
    updateDailyPushMoreButton(dailyPushMore, []);
  }
}

// 显示今日全部推送
function showAllTodayPapers() {
  const pushGrid = document.getElementById("pushGrid");
  const dailyPushMore = document.querySelector(".daily-push-more");

  if (allTodayPapers.length === 0) return;

  // 渲染全部论文
  renderPushCards(allTodayPapers, pushGrid);

  // 展开当日全部后，按钮切换为“推送历史”
  updateDailyPushMoreButton(dailyPushMore, []);
}

// 存储推送历史到localStorage
function savePushHistory() {
  const today = new Date().toISOString().split("T")[0];
  const history = JSON.parse(localStorage.getItem("pushHistory") || "{}");

  if (!history[today]) {
    history[today] = getDailyPushPapers().map(p => p.id);
    localStorage.setItem("pushHistory", JSON.stringify(history));
  }
}

// 标记已读
function markPushAsRead(paperId) {
  const readPapers = JSON.parse(localStorage.getItem("readPapers") || "[]");
  if (!readPapers.includes(paperId)) {
    readPapers.push(paperId);
    localStorage.setItem("readPapers", JSON.stringify(readPapers));
  }
}

// ===================================
// API Configuration
// ===================================
const API_BASE = '';

// ===================================
// API Functions
// ===================================
async function loadPapersFromAPI() {
  try {
    const pageLimit = 200;
    const firstResponse = await fetch(`${API_BASE}/api/papers?page=1&limit=${pageLimit}`);
    if (!firstResponse.ok) {
      throw new Error(`HTTP ${firstResponse.status}`);
    }

    const firstPage = await firstResponse.json();
    const totalPages = Math.max(Number(firstPage.totalPages || 1), 1);
    const allRawPapers = Array.isArray(firstPage.papers) ? [...firstPage.papers] : [];

    if (totalPages > 1) {
      const restPages = [];
      for (let page = 2; page <= totalPages; page += 1) {
        restPages.push(
          fetch(`${API_BASE}/api/papers?page=${page}&limit=${pageLimit}`)
            .then(resp => {
              if (!resp.ok) throw new Error(`HTTP ${resp.status} (page ${page})`);
              return resp.json();
            })
            .then(data => Array.isArray(data.papers) ? data.papers : [])
        );
      }
      const restResults = await Promise.all(restPages);
      restResults.forEach(items => allRawPapers.push(...items));
    }

    // 去重：按 title|doi|url，避免不同论文因 id 冲突被误删
    const deduped = new Map();
    allRawPapers.forEach(p => {
      const title = String(p.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const doi = String(p.doi || '').toLowerCase().trim();
      const url = String(p.url || '').toLowerCase().trim();
      const key = `${title}|${doi}|${url}`;
      if (!deduped.has(key)) {
        deduped.set(key, p);
      }
    });

    const normalized = Array.from(deduped.values()).map(p => ({
      id: p.id,
      title: p.title,
      authors: p.authors || [],
      source: p.source || 'arXiv',
      date: p.date,
      abstract: p.abstract,
      category: p.category,
      subcategory: p.subcategory,
      tags: p.tags || [],
      citations: p.citations || 0,
      pdfUrl: p.pdfUrl || '',
      url: p.url || `https://arxiv.org/abs/${p.id}`
    }));

    console.log('API all pages loaded:', normalized.length, 'papers; totalPages =', totalPages);
    if (normalized.length > 0) {
      return normalized;
    }

    console.log('No papers found in API response');
    return null;
  } catch (error) {
    console.log('API load failed, using local data:', error);
    return null;
  }
}

// ===================================
// Initialize
// ===================================
async function init() {
  // 尝试从 API 加载数据
  const apiPapers = await loadPapersFromAPI();
  if (apiPapers) {
    papersData.length = 0;
    papersData.push(...apiPapers);
  }

  updateCounts();
  generateTagCloud();
  renderHotList();
  renderDailyPush();
  savePushHistory();
  applyFilters();
}

// Run on DOM ready
document.addEventListener("DOMContentLoaded", init);
