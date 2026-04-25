const { CATEGORIES, SOURCE_REGISTRY } = require('./sourceRegistry');
const { fetchFromSource } = require('./sources');

const cache = new Map();
const DEFAULT_PER_SOURCE_LIMIT = 4;
const DEFAULT_ACTIVE_SOURCE_IDS = SOURCE_REGISTRY
  .filter(source => source.id !== 'zhou_seeds')
  .map(source => source.id);

function cacheKey(sourceId, category, limit, dateFrom, dateTo) {
  return `${sourceId}|${category || 'all'}|${limit}|${dateFrom || ''}|${dateTo || ''}`;
}

function shouldUseCache(entry, forceRefresh) {
  if (forceRefresh) return false;
  if (!entry) return false;
  return entry.expiresAt > Date.now();
}

function normalizeTitle(title = '') {
  return String(title).toLowerCase().replace(/\s+/g, ' ').trim();
}

function toAuthorString(authors) {
  if (Array.isArray(authors)) return authors.join(', ');
  return String(authors || '');
}

function mergePaper(base, next) {
  const merged = { ...base };
  if ((!merged.abstract || merged.abstract.length < 20) && next.abstract) merged.abstract = next.abstract;
  if ((!merged.doi || merged.doi.length < 5) && next.doi) merged.doi = next.doi;
  if (!merged.url && next.url) merged.url = next.url;
  if (!merged.pdfUrl && next.pdfUrl) merged.pdfUrl = next.pdfUrl;
  if ((!merged.authors || merged.authors.length === 0) && next.authors) merged.authors = next.authors;
  if ((!merged.date || merged.date.length < 10) && next.date) merged.date = next.date;
  if (!merged.category && next.category) merged.category = next.category;
  if (next.sourceId && merged.sourceId !== next.sourceId) {
    merged.rawMeta = {
      ...(merged.rawMeta || {}),
      mergedFrom: [...new Set([...(merged.rawMeta?.mergedFrom || []), next.sourceId])]
    };
  }
  return merged;
}

function dedupePapers(items) {
  const map = new Map();

  items.forEach(item => {
    const titleKey = normalizeTitle(item.title);
    const doiKey = (item.doi || '').toLowerCase();
    const urlKey = (item.url || '').toLowerCase();
    const key = `${titleKey}|${doiKey}|${urlKey}`;

    if (!map.has(key)) {
      map.set(key, item);
      return;
    }
    const existing = map.get(key);
    map.set(key, mergePaper(existing, item));
  });

  return Array.from(map.values());
}

function sortByDateDesc(items) {
  return items.sort((a, b) => {
    const ad = Date.parse(a.date || '1970-01-01');
    const bd = Date.parse(b.date || '1970-01-01');
    return bd - ad;
  });
}

async function fetchSourceBatch(source, category, limit, options = {}) {
  const key = cacheKey(source.id, category, limit, options.dateFrom, options.dateTo);
  const cached = cache.get(key);
  if (shouldUseCache(cached, options.forceRefresh)) {
    return cached.value;
  }

  const result = await fetchFromSource(source.id, category, limit, options);
  const value = {
    sourceId: source.id,
    sourceName: source.name,
    status: result.status || 'blocked',
    error: result.error || null,
    items: Array.isArray(result.items) ? result.items : []
  };

  cache.set(key, {
    value,
    expiresAt: Date.now() + (source.ttlMs || 30 * 60 * 1000)
  });

  return value;
}

async function getUnifiedPapers(options = {}) {
  const categories = options.categories && options.categories.length
    ? options.categories
    : CATEGORIES;
  const perSourceLimit = Number(options.perSourceLimit || DEFAULT_PER_SOURCE_LIMIT);
  const includeSourceIds = options.includeSourceIds || DEFAULT_ACTIVE_SOURCE_IDS;
  const activeSources = SOURCE_REGISTRY.filter(s => includeSourceIds.includes(s.id));

  const tasks = [];
  activeSources.forEach(source => {
    if (source.categoryScoped) {
      categories.forEach(category => {
        tasks.push(fetchSourceBatch(source, category, perSourceLimit, options));
      });
    } else {
      const sourceLimit = Math.max(perSourceLimit * 2, 8);
      tasks.push(fetchSourceBatch(source, null, sourceLimit, options));
    }
  });

  const batches = await Promise.all(tasks);
  const sourceStatuses = {};
  let mergedItems = [];

  batches.forEach(batch => {
    const prev = sourceStatuses[batch.sourceId];
    sourceStatuses[batch.sourceId] = {
      sourceId: batch.sourceId,
      source: batch.sourceName,
      status: batch.status,
      error: batch.error,
      count: (prev ? prev.count : 0) + batch.items.length
    };

    const acceptedItems = batch.items.filter(item => {
      if (!item || !item.category || item.category === '未分类') return false;
      if (options.categories && options.categories.length) {
        return options.categories.includes(item.category);
      }
      return true;
    });
    mergedItems.push(...acceptedItems);
  });

  mergedItems = dedupePapers(mergedItems);
  mergedItems = sortByDateDesc(mergedItems);

  return {
    papers: mergedItems,
    sourceStatuses,
    fetchedAt: new Date().toISOString()
  };
}

module.exports = {
  CATEGORIES,
  SOURCE_REGISTRY,
  getUnifiedPapers
};
