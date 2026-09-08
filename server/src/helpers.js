/**
 * Build a paginated SQL query with optional search, filters, and sorting.
 *
 * @param {string} table - Table name
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.per_page
 * @param {string} [options.search] - Search term
 * @param {string[]} [options.searchColumns] - Columns to search across
 * @param {object} [options.filters] - { column: value } exact-match filters
 * @param {string} [options.orderBy] - Column to order by
 * @param {string} [options.orderDir] - 'ASC' or 'DESC'
 * @param {boolean} [options.includeDeleted] - Include soft-deleted rows (default false)
 */
export function buildPaginatedQuery(table, options = {}) {
  const {
    page = 1,
    per_page = 25,
    search = '',
    searchColumns = [],
    filters = {},
    orderBy = 'id',
    orderDir = 'DESC',
    includeDeleted = false,
    extraWhere = [],
    extraParams = [],
  } = options;

  const whereClauses = [];
  const params = [];

  // Soft delete filter
  if (!includeDeleted) {
    whereClauses.push('`deleted` = 0');
  }

  // Search across columns
  if (search && searchColumns.length > 0) {
    const searchClauses = searchColumns.map((col) => `\`${col}\` LIKE ?`);
    whereClauses.push(`(${searchClauses.join(' OR ')})`);
    searchColumns.forEach(() => params.push(`%${search}%`));
  }

  // Exact-match filters
  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      whereClauses.push(`\`${column}\` = ?`);
      params.push(value);
    }
  }

  // Extra WHERE clauses (e.g. subqueries for junction table filters)
  for (let i = 0; i < extraWhere.length; i++) {
    whereClauses.push(extraWhere[i]);
    if (extraParams[i] !== undefined) params.push(extraParams[i]);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Validate orderDir
  const safeDir = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (page - 1) * per_page;

  const countQuery = `SELECT COUNT(*) as total FROM \`${table}\` ${whereSQL}`;
  const dataQuery = `SELECT * FROM \`${table}\` ${whereSQL} ORDER BY \`${orderBy}\` ${safeDir} LIMIT ? OFFSET ?`;
  const dataParams = [...params, per_page, offset];

  return { countQuery, countParams: params, dataQuery, dataParams, page, per_page };
}

/**
 * Execute a paginated query and return a standard response envelope.
 */
export async function executePaginatedQuery(pool, table, options = {}) {
  const { countQuery, countParams, dataQuery, dataParams, page, per_page } =
    buildPaginatedQuery(table, options);

  const [[{ total }]] = await pool.query(countQuery, countParams);
  const [rows] = await pool.query(dataQuery, dataParams);

  return {
    success: true,
    data: rows,
    total,
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
  };
}

/**
 * Standard success response
 */
export function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Standard error response
 */
export function error(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

/**
 * Parse pagination params from query string
 */
export function parsePagination(query) {
  return {
    page: Math.max(1, parseInt(query.page) || 1),
    per_page: Math.min(100, Math.max(1, parseInt(query.per_page) || 25)),
    search: query.search || '',
    orderBy: query.order_by || 'id',
    orderDir: query.order_dir || 'DESC',
  };
}
