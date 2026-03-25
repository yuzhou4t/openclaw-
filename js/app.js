// ===================================
// Mock Data - 模拟论文数据
// 数据来源: arXiv API (2026年3月)
// ===================================
const papersData = [
  { id: 1, title: "WorldCache: Content-Aware Caching for Accelerated Video World Models", authors: ["Umair Nawaz", "Ahmed Heakl"], source: "arXiv:2603.22286", date: "2026-03-23", abstract: "Diffusion Transformers power high-fidelity video world models but remain computationally expensive. We propose WorldCache, a training-free feature caching framework.", category: "llm", subcategory: "基础模型", citations: 0, tags: ["Diffusion", "Video", "Caching"], pdfUrl: "https://arxiv.org/pdf/2603.22286v1", arxivId: "2603.22286", url: "https://arxiv.org/abs/2603.22286" },
  { id: 2, title: "ThinkJEPA: Empowering Latent World Models with Vision-Language Reasoning", authors: ["Haichao Zhang", "Yijiang Li"], source: "arXiv:2603.22281", date: "2026-03-23", abstract: "Recent progress in latent world models has shown promising capability in forecasting future world states. We propose ThinkJEPA.", category: "llm", subcategory: "多模态模型", citations: 0, tags: ["World Models", "Vision-Language", "Reasoning"], pdfUrl: "https://arxiv.org/pdf/2603.22281v1", arxivId: "2603.22281", url: "https://arxiv.org/abs/2603.22281" },
  { id: 3, title: "Autonomous Framework for Systematic Factor Investing via Agentic AI", authors: ["Allen Yikuan Huang", "Zheqi Fan"], source: "arXiv:2603.14288", date: "2026-03-15", abstract: "This paper develops an autonomous framework for systematic factor investing via agentic AI.", category: "behavior", subcategory: "金融科技", citations: 0, tags: ["Factor Investing", "Agentic AI", "Trading"], pdfUrl: "https://arxiv.org/pdf/2603.14288v1", arxivId: "2603.14288", url: "https://arxiv.org/abs/2603.14288" },
  { id: 4, title: "LR-Robot: Unified Framework for Systematic Literature Reviews with LLM", authors: ["Wei Wei", "Jin Zheng"], source: "arXiv:2603.17723", date: "2026-03-18", abstract: "We present LR-Robot, a unified framework that leverages large language models for real-time automated literature review generation.", category: "behavior", subcategory: "金融科技", citations: 0, tags: ["Systematic Review", "LLM", "NLP"], pdfUrl: "https://arxiv.org/pdf/2603.17723v1", arxivId: "2603.17723", url: "https://arxiv.org/abs/2603.17723" },
  { id: 5, title: "Dynamic Pareto Optima in Multi-Period Pure-Exchange Economies", authors: ["Jingnan Chen"], source: "arXiv:2603.19414", date: "2026-03-19", abstract: "This paper analyzes dynamic Pareto optima in multi-period pure-exchange economies with uncertainty.", category: "catastrophe", subcategory: "气候风险建模", citations: 0, tags: ["Pareto Optimal", "Risk Sharing", "Insurance"], pdfUrl: "https://arxiv.org/pdf/2603.19414v1", arxivId: "2603.19414", url: "https://arxiv.org/abs/2603.19414" },
  { id: 6, title: "Model Risk in the Optimal Execution Problem", authors: ["Michael L H Koch"], source: "arXiv:2603.19984", date: "2026-03-20", abstract: "We investigate model risk in the optimal execution problem for financial markets.", category: "catastrophe", subcategory: "再保险", citations: 0, tags: ["Model Risk", "Optimal Execution", "Trading"], pdfUrl: "https://arxiv.org/pdf/2603.19984v1", arxivId: "2603.19984", url: "https://arxiv.org/abs/2603.19984" },
  { id: 7, title: "Alpha-Bregman Wasserstein Clustering for Financial Applications", authors: ["Ran Kornowski", "Alessandro Faivis"], source: "arXiv:2603.20580", date: "2026-03-21", abstract: "We propose a novel clustering approach using alpha-Bregman Wasserstein divergence for financial applications.", category: "agriculture", subcategory: "天气指数保险", citations: 0, tags: ["Clustering", "Wasserstein", "Risk Assessment"], pdfUrl: "https://arxiv.org/pdf/2603.20580v1", arxivId: "2603.20580", url: "https://arxiv.org/abs/2603.20580" },
  { id: 8, title: "UniMotion: Unified Framework for Motion-Text-Vision Understanding", authors: ["Ziyi Wang", "Xinshun Wang"], source: "arXiv:2603.22282", date: "2026-03-23", abstract: "We present UniMotion, a unified framework for simultaneous understanding and generation of human motion, language, and images.", category: "agriculture", subcategory: "农作物保险", citations: 0, tags: ["Motion", "Multimodal", "Computer Vision"], pdfUrl: "https://arxiv.org/pdf/2603.22282v1", arxivId: "2603.22282", url: "https://arxiv.org/abs/2603.22282" },
  { id: 9, title: "Private Credit Markets: Theory, Evidence, and Emerging Frontiers", authors: ["Jiacheng Zou"], source: "arXiv:2603.14491", date: "2026-03-15", abstract: "Private credit assets grew from 158 billion to 2 trillion globally. This paper provides a systematic study of private credit markets.", category: "inclusive", subcategory: "数字普惠金融", citations: 0, tags: ["Private Credit", "Financial Markets", "Inclusion"], pdfUrl: "https://arxiv.org/pdf/2603.14491v1", arxivId: "2603.14491", url: "https://arxiv.org/abs/2603.14491" },
  { id: 10, title: "End-to-End Training for Unified Tokenization and Latent Denoising", authors: ["Shivam Duggal", "Xingjian Bai"], source: "arXiv:2603.22283", date: "2026-03-23", abstract: "Latent diffusion models enable high-fidelity synthesis. We propose an end-to-end training framework that unifies tokenization and latent denoising.", category: "inclusive", subcategory: "农村信贷", citations: 0, tags: ["Latent Diffusion", "Unified Training", "Finance"], pdfUrl: "https://arxiv.org/pdf/2603.22283v1", arxivId: "2603.22283", url: "https://arxiv.org/abs/2603.22283" }
];


// ===================================
// Subcategories Data
// ===================================
const subcategoriesData = {
  llm: ["基础模型", "指令微调", "RAG", "多模态模型", "AI Agent"],
  behavior: ["投资者行为", "市场异象", "行为资产定价", "金融科技"],
  catastrophe: ["地震保险", "洪水/飓风保险", "气候风险建模", "再保险"],
  agriculture: ["农作物保险", "畜牧保险", "天气指数保险", "农业信贷"],
  inclusive: ["数字普惠金融", "农村信贷", "小微金融", "金融排斥"]
};

// ===================================
// State
// ===================================
// 从 localStorage 加载收藏
const savedFavorites = localStorage.getItem("paperFavorites");
const favoritesArray = savedFavorites ? JSON.parse(savedFavorites) : [];

let state = {
  currentCategory: "all",
  currentSubcategory: null,
  searchQuery: "",
  sortBy: "latest",
  currentPage: 1,
  papersPerPage: 10,
  favorites: new Set(favoritesArray),
  readingList: new Set()
};

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
    llm: "大模型",
    behavior: "行为金融",
    catastrophe: "巨灾保险",
    agriculture: "农业保险",
    inclusive: "普惠金融"
  };
  return names[category] || category;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
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

  const maxCount = sortedTags[0]?.[1] || 1;

  elements.tagCloud.innerHTML = sortedTags.map(([tag, count]) => {
    const size = count === maxCount ? "size-lg" : count > maxCount * 0.7 ? "size-md" : "size-sm";
    return `<span class="tag-item ${size}" onclick="searchByTag('${tag}')">${tag}</span>`;
  }).join("");
}

function renderHotList() {
  const hotPapers = [...papersData]
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 5);

  elements.hotList.innerHTML = hotPapers.map((paper, index) => `
    <li class="hot-item">
      <span class="hot-rank ${index < 3 ? `top-${index + 1}` : ''}">${index + 1}</span>
      <span class="hot-title" onclick="viewPaper(${paper.id})">${paper.title}</span>
    </li>
  `).join("");
}

function updateCounts() {
  document.getElementById("countAll").textContent = papersData.length;
  document.getElementById("countLLM").textContent = papersData.filter(p => p.category === "llm").length;
  document.getElementById("countBehavior").textContent = papersData.filter(p => p.category === "behavior").length;
  document.getElementById("countCatastrophe").textContent = papersData.filter(p => p.category === "catastrophe").length;
  document.getElementById("countAgriculture").textContent = papersData.filter(p => p.category === "agriculture").length;
  document.getElementById("countInclusive").textContent = papersData.filter(p => p.category === "inclusive").length;
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
    <article class="paper-card">
      <div class="paper-header">
        <h2 class="paper-title" onclick="viewPaper(${paper.id})">${paper.title}</h2>
        <div class="paper-actions">
          <button class="paper-action-btn ${state.favorites.has(paper.id) ? 'active' : ''}"
                  onclick="toggleFavorite(${paper.id})" title="收藏">
            <svg viewBox="0 0 24 24" fill="${state.favorites.has(paper.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="paper-meta">
        <span class="paper-author">${paper.authors.map((author, i) =>
          `<span class="paper-author-link" onclick="event.stopPropagation(); viewAuthor('${author}');">${author}</span>${i < paper.authors.length - 1 ? ', ' : ''}`
        ).join('')}</span>
        <span class="paper-source">${paper.source}</span>
        <span>${formatDate(paper.date)}</span>
        <span class="paper-tag ${paper.category}">${getCategoryName(paper.category)}</span>
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
          <a href="#" class="paper-link paper-link-secondary" onclick="viewPaper(${paper.id})">详情</a>
          ${paper.pdfUrl ?
            `<a href="#" class="paper-link paper-link-primary" onclick="event.preventDefault(); openPdfViewer(${paper.id});">PDF</a>` :
            `<a href="#" class="paper-link paper-link-disabled" title="暂无可用PDF" onclick="event.preventDefault(); openPdfViewer(${paper.id});">PDF</a>`
          }
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
  if (!subcategoriesData[category]) {
    elements.subcategoryList.innerHTML = "";
    elements.subcategoryList.classList.remove("show");
    return;
  }

  elements.subcategoryList.innerHTML = subcategoriesData[category].map(sub => `
    <a href="#" class="subcategory-item ${state.currentSubcategory === sub ? 'active' : ''}"
       onclick="selectSubcategory('${sub}')">${sub}</a>
  `).join("");

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
      p.authors.some(a => a.toLowerCase().includes(query)) ||
      p.tags.some(t => t.toLowerCase().includes(query)) ||
      p.abstract.toLowerCase().includes(query)
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

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  // 保存到 localStorage
  localStorage.setItem("paperFavorites", JSON.stringify([...state.favorites]));
  applyFilters();
}

function toggleReadingList(id) {
  if (state.readingList.has(id)) {
    state.readingList.delete(id);
  } else {
    state.readingList.add(id);
  }
  applyFilters();
}

function viewPaper(id) {
  const paper = papersData.find(p => p.id === id);
  if (!paper) return;

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
        <span class="paper-detail-tag ${paper.category}">${getCategoryName(paper.category)}</span>
        <span class="paper-detail-subcategory">${paper.subcategory}</span>
      </div>
      <h1 class="paper-detail-title">${paper.title}</h1>
      <div class="paper-detail-meta">
        <span class="paper-detail-author">${authorsHtml}</span>
        <span class="paper-detail-source">${paper.source}</span>
        <span>${formatDate(paper.date)}</span>
      </div>
      <div class="paper-detail-actions">
        ${paper.pdfUrl ? `
        <button class="paper-detail-action primary" onclick="openPdfViewer(${paper.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          查看 PDF
        </button>
        ` : `
        <button class="paper-detail-action secondary" onclick="openPdfViewer(${paper.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          请求 PDF
        </button>
        `}
        <button class="paper-detail-action secondary" onclick="exportCitation(${paper.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          导出引用
        </button>
        <button class="paper-detail-action secondary ${state.favorites.has(paper.id) ? 'active' : ''}"
                onclick="toggleFavorite(${paper.id}); viewPaper(${paper.id});">
          <svg viewBox="0 0 24 24" fill="${state.favorites.has(paper.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          ${state.favorites.has(paper.id) ? '已收藏' : '收藏'}
        </button>
        <button class="paper-detail-action secondary ${state.readingList.has(paper.id) ? 'active' : ''}"
                onclick="toggleReadingList(${paper.id}); viewPaper(${paper.id});">
          <svg viewBox="0 0 24 24" fill="${state.readingList.has(paper.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"></path>
          </svg>
          ${state.readingList.has(paper.id) ? '已加入' : '待读'}
        </button>
        <button class="paper-detail-action secondary" onclick="sharePaper(${paper.id})">
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
          <div class="paper-related-card" onclick="viewPaper(${rel.id})">
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
}

// 显示收藏夹
function showFavorites() {
  const modal = document.getElementById("favoritesModal");
  const body = document.getElementById("favoritesModalBody");
  const count = document.getElementById("favoritesCount");

  // 获取收藏的论文
  const favoritePapers = papersData.filter(p => state.favorites.has(p.id));

  count.textContent = `${favoritePapers.length} 篇论文`;

  if (favoritePapers.length === 0) {
    body.innerHTML = `
      <div class="favorites-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <p>暂无收藏论文</p>
        <span>点击论文卡片上的收藏按钮来添加收藏</span>
      </div>
    `;
  } else {
    body.innerHTML = favoritePapers.map(paper => `
      <article class="paper-card">
        <div class="paper-header">
          <h2 class="paper-title" onclick="viewPaper(${paper.id})">${paper.title}</h2>
          <div class="paper-actions">
            <button class="paper-action-btn active"
                    onclick="toggleFavorite(${paper.id})" title="收藏">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="paper-meta">
          <span class="paper-authors">${paper.authors.join(", ")}</span>
          <span class="paper-source">${paper.source}</span>
          <span class="paper-date">${paper.date}</span>
        </div>
        <p class="paper-abstract">${paper.abstract.substring(0, 120)}...</p>
        <div class="paper-footer">
          <div class="paper-tags">
            ${paper.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <span class="paper-category ${paper.category}">${getCategoryName(paper.category)}</span>
        </div>
      </article>
    `).join("");
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// 关闭收藏夹
function closeFavoritesModal() {
  const modal = document.getElementById("favoritesModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// 获取相关论文
function getRelatedPapers(paper) {
  return papersData
    .filter(p => p.id !== paper.id)
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
  const paper = papersData.find(p => p.id === id);
  if (!paper) return;

  // 复制链接到剪贴板
  const shareUrl = `${window.location.origin}/paper/${id}`;
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
          <div class="author-paper-item" onclick="viewPaper(${p.id}); closeAuthorModal();">
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
  const paper = papersData.find(p => p.id === id);
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

// 打开PDF预览
function openPdfViewer(id) {
  const paper = papersData.find(p => p.id === id);
  if (!paper) return;

  currentPdfPaper = paper;

  const modalTitle = document.getElementById("pdfModalTitle");
  const pdfViewer = document.getElementById("pdfViewer");
  const pdfViewerContainer = document.getElementById("pdfViewerContainer");
  const pdfNoSource = document.getElementById("pdfNoSource");
  const pdfDownloadBtn = document.getElementById("pdfDownloadBtn");
  const pdfOpenBtn = document.getElementById("pdfOpenBtn");

  modalTitle.textContent = paper.title;

  if (paper.pdfUrl) {
    // 有PDF链接
    pdfViewerContainer.style.display = 'block';
    pdfNoSource.style.display = 'none';

    // 使用Google Docs Viewer预览PDF
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(paper.pdfUrl)}&embedded=true`;
    pdfViewer.src = viewerUrl;

    // 设置下载按钮
    pdfDownloadBtn.style.display = 'flex';
    pdfOpenBtn.style.display = 'flex';
    pdfOpenBtn.href = paper.pdfUrl;
  } else {
    // 无PDF链接
    pdfViewerContainer.style.display = 'none';
    pdfNoSource.style.display = 'flex';
    pdfDownloadBtn.style.display = 'none';
    pdfOpenBtn.style.display = 'none';
  }

  const modal = document.getElementById("pdfModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
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

// 更新论文卡片的PDF按钮
function updatePaperCardPdfButton(paper) {
  if (paper.pdfUrl) {
    return `<a href="#" class="paper-link paper-link-primary" onclick="event.preventDefault(); openPdfViewer(${paper.id});">PDF</a>`;
  } else {
    return `<a href="#" class="paper-link paper-link-disabled" title="暂无可用PDF" onclick="event.preventDefault(); openPdfViewer(${paper.id});">PDF</a>`;
  }
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
  await showPushHistory();
});

// 显示推送历史（最近一周）
async function showPushHistory() {
  const paperList = document.getElementById("paperList");
  const pageTitle = document.getElementById("pageTitle");

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

      html += `
        <div class="push-history-day">
          <h3 class="push-history-date">${dateStr}</h3>
          <div class="push-history-papers">
      `;

      dayPush.papers.forEach(paper => {
        const isNew = (new Date() - new Date(paper.date)) < 30 * 24 * 60 * 60 * 1000;
        const isHot = paper.citations > 5000;

        html += `
          <div class="paper-card" onclick="viewPaper('${paper.id}')">
            <div class="paper-header">
              <span class="paper-category ${paper.category}">${paper.category}</span>
              ${isNew ? '<span class="paper-badge new">🆕</span>' : ''}
              ${isHot ? '<span class="paper-badge hot">🔥</span>' : ''}
            </div>
            <h3 class="paper-title">${paper.title}</h3>
            <div class="paper-meta">
              <span class="paper-authors">${paper.authors.join(', ')}</span>
              <span class="paper-source">${paper.venue}</span>
              <span class="paper-date">${paper.date}</span>
            </div>
            <p class="paper-abstract">${paper.abstract}</p>
          </div>
        `;
      });

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

// 用户订阅的领域（模拟数据，实际从后端获取）
let userSubscriptions = new Set(["llm", "behavior"]);

// 获取每日推送论文
function getDailyPushPapers() {
  const pushCount = 5;
  const papers = [...papersData];

  // 策略分配
  const subscribedPapers = papers.filter(p => userSubscriptions.has(p.category));
  const popularPapers = [...papers].sort((a, b) => b.citations - a.citations);
  const recentPapers = [...papers].sort((a, b) => new Date(b.date) - new Date(a.date));

  let pushPapers = [];

  // 30% 用户订阅领域的最新论文
  const subLatest = subscribedPapers
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, Math.ceil(pushCount * 0.3));
  pushPapers.push(...subLatest);

  // 30% 全局热门论文
  const hotPapers = popularPapers
    .filter(p => !pushPapers.includes(p))
    .slice(0, Math.ceil(pushCount * 0.3));
  pushPapers.push(...hotPapers);

  // 20% 随机推荐（探索新领域）
  const remaining = papers.filter(p => !pushPapers.includes(p));
  const randomPapers = remaining
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.ceil(pushCount * 0.2));
  pushPapers.push(...randomPapers);

  // 20% 经典必读（高引用）
  const classicPapers = popularPapers
    .filter(p => !pushPapers.includes(p))
    .slice(0, pushCount - pushPapers.length);
  pushPapers.push(...classicPapers);

  // 截取需要的数量
  return pushPapers.slice(0, pushCount);
}

// 渲染每日推送
async function renderDailyPush() {
  const pushGrid = document.getElementById("pushGrid");
  const pushDate = document.getElementById("pushDate");

  try {
    // 从 API 获取今日推送
    const response = await fetch(`${API_BASE}/api/push/daily`);
    const data = await response.json();

    const pushPapers = data.papers || [];
    const today = new Date();
    pushDate.textContent = `· ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    // 检查是否有新论文
    if (!data.hasNewPapers || pushPapers.length === 0) {
      pushGrid.innerHTML = `
        <div class="push-card empty">
          <div class="push-empty-icon">📭</div>
          <div class="push-empty-text">${data.message || '今日暂无内容'}</div>
          <div class="push-empty-hint">最近3天无新论文</div>
        </div>
      `;
      return;
    }

    // 渲染推送卡片
    pushGrid.innerHTML = pushPapers.map(paper => {
      const isNew = (new Date() - new Date(paper.date)) < 30 * 24 * 60 * 60 * 1000;
      const isHot = paper.citations > 5000;

      return `
        <div class="push-card" onclick="viewPaper('${paper.id}')">
          <span class="push-card-tag ${paper.category}">${paper.category}</span>
          <h4 class="push-card-title">${paper.title}</h4>
          <div class="push-card-meta">${paper.venue}</div>
          ${isNew ? '<span class="push-card-badge new">🆕 新论文</span>' : ''}
          ${isHot ? '<span class="push-card-badge hot">🔥 热门</span>' : ''}
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error('获取每日推送失败:', error);
    pushGrid.innerHTML = '<p>暂无推送</p>';
  }
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
const API_BASE = 'https://paperhub-api.paperhub-api-2026.workers.dev';

// ===================================
// API Functions
// ===================================
async function loadPapersFromAPI() {
  try {
    const response = await fetch(`${API_BASE}/api/papers`);
    const data = await response.json();
    if (data.papers && data.papers.length > 0) {
      // 转换为前端格式
      return data.papers.map(p => ({
        id: parseInt(p.id),
        title: p.title,
        authors: p.authors,
        source: p.venue || 'arXiv',
        date: p.date,
        abstract: p.abstract,
        category: mapCategoryToEnglish(p.category),
        subcategory: p.subcategory,
        tags: p.tags || [],
        citations: p.citations || 0,
        pdfUrl: p.pdfUrl || '',
        url: p.pdfUrl || ''
      }));
    }
    return null;
  } catch (error) {
    console.log('API load failed, using local data:', error);
    return null;
  }
}

function mapCategoryToEnglish(category) {
  const map = {
    '大模型': 'llm',
    '行为金融': 'behavior',
    '巨灾保险': 'catastrophe',
    '农业保险': 'agriculture',
    '普惠金融': 'inclusive'
  };
  return map[category] || category;
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
