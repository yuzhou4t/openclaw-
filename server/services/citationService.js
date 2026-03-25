/**
 * 文献引用服务
 * 支持多种引用格式导出
 */

/**
 * 格式化作者列表
 */
function formatAuthors(authors, style) {
  if (!authors || authors.length === 0) return '';

  switch (style) {
    case 'apa':
      // APA: Last, F. M., & Last, F. M.
      return authors.map((author, index) => {
        const parts = author.split(' ');
        if (parts.length === 1) return author;
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n.charAt(0).toUpperCase() + '.').join(' ');
        return `${lastName}, ${initials}`;
      }).join(', & ');

    case 'mla':
      // MLA: Last, First, and First Last
      return authors.map((author, index) => {
        const parts = author.split(' ');
        if (parts.length === 1) return author;
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return index === 0 ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
      }).join(', and ');

    case 'chicago':
      // Chicago: Last, First, and First Last
      return authors.map((author, index) => {
        const parts = author.split(' ');
        if (parts.length === 1) return author;
        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return index === 0 ? `${lastName}, ${firstName}` : `${firstName} ${lastName}`;
      }).join(', and ');

    case 'gbt':
      // GB/T: 作者. 文献题名. 刊名, 年, 期: 页码
      return authors.join(', ');

    default:
      return authors.join(', ');
  }
}

/**
 * 格式化日期
 */
function formatDate(dateStr, style) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (style) {
    case 'apa':
      return `(${year})`;
    case 'mla':
      return `${year}`;
    case 'chicago':
      return `${year}`;
    case 'gbt':
      return year;
    default:
      return year;
  }
}

/**
 * 生成 APA 格式引用
 */
function formatAPA(paper) {
  const authors = formatAuthors(paper.authors, 'apa');
  const date = formatDate(paper.publishDate, 'apa');
  const source = paper.source || '';

  return `${authors} ${date}. ${paper.title}. ${source}.`;
}

/**
 * 生成 MLA 格式引用
 */
function formatMLA(paper) {
  const authors = formatAuthors(paper.authors, 'mla');
  const date = formatDate(paper.publishDate, 'mla');
  const source = paper.source || '';

  return `"${paper.title}." ${source}, ${date}.`;
}

/**
 * 生成 Chicago 格式引用
 */
function formatChicago(paper) {
  const authors = formatAuthors(paper.authors, 'chicago');
  const date = formatDate(paper.publishDate, 'chicago');
  const source = paper.source || '';

  return `${authors}. "${paper.title}." ${source} (${date}).`;
}

/**
 * 生成 GB/T 7714 格式引用（中国标准）
 */
function formatGBT(paper) {
  const authors = formatAuthors(paper.authors, 'gbt');
  const year = formatDate(paper.publishDate, 'gbt');

  return `${authors}. ${paper.title}[J]. ${paper.source}, ${year}.`;
}

/**
 * 格式化单篇论文引用
 */
function formatCitation(paper, style = 'apa') {
  switch (style.toLowerCase()) {
    case 'apa':
      return formatAPA(paper);
    case 'mla':
      return formatMLA(paper);
    case 'chicago':
      return formatChicago(paper);
    case 'gbt':
      return formatGBT(paper);
    default:
      return formatAPA(paper);
  }
}

/**
 * 批量导出引用（用于Zotero/EndNote）
 */
function exportToBibTeX(papers) {
  return papers.map(paper => {
    const key = paper.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown';
    const year = new Date(paper.publishDate).getFullYear();

    return `@article{${key}${year},
  title = {${paper.title}},
  author = {${paper.authors.join(' and ')}},
  journal = {${paper.source}},
  year = {${year}},
  keywords = {${paper.tags?.join(', ')}}
}`;
  }).join('\n\n');
}

/**
 * 导出为 RIS 格式（支持EndNote）
 */
function exportToRIS(papers) {
  return papers.map(paper => {
    const lines = [
      'TY  - JOUR',
      `TI  - ${paper.title}`,
      ...paper.authors.map(a => `AU  - ${a}`),
      `JO  - ${paper.source}`,
      `PY  - ${new Date(paper.publishDate).getFullYear()}`,
      `AB  - ${paper.abstract?.substring(0, 500) || ''}`,
      ...(paper.tags || []).map(t => `KW  - ${t}`),
      'ER  - '
    ];
    return lines.join('\n');
  }).join('\n');
}

/**
 * 导出为 CSV
 */
function exportToCSV(papers) {
  const headers = ['Title', 'Authors', 'Source', 'Date', 'Category', 'Citations', 'Tags'];
  const rows = papers.map(p => [
    `"${p.title}"`,
    `"${p.authors.join('; ')}"`,
    `"${p.source}"`,
    p.publishDate,
    p.category,
    p.citations,
    `"${p.tags?.join('; ')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出为 JSON（通用格式）
 */
function exportToJSON(papers) {
  return JSON.stringify(papers, null, 2);
}

/**
 * 生成引用卡片（网页展示）
 */
function generateCitationCard(paper, style = 'apa') {
  return {
    text: formatCitation(paper, style),
    style,
    paper: {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      source: paper.source,
      date: paper.publishDate,
      url: paper.url,
      pdfUrl: paper.pdfUrl
    }
  };
}

module.exports = {
  formatCitation,
  formatAPA,
  formatMLA,
  formatChicago,
  formatGBT,
  exportToBibTeX,
  exportToRIS,
  exportToCSV,
  exportToJSON,
  generateCitationCard
};
