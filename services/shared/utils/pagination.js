import { sql } from 'drizzle-orm';

export async function paginate(db, baseQuery, table, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  // Build count query
  let countQuery = db.select({ count: sql`count(*)::int` }).from(table);
  
  // Apply where conditions if present in baseQuery
  if (options.where) {
    countQuery = countQuery.where(options.where);
  }
  
  // Get total count
  const [{ count }] = await countQuery;
  
  // Build data query
  let dataQuery = baseQuery;
  
  // Apply sorting
  if (sortBy && sortOrder) {
    const column = table[sortBy];
    if (column) {
      dataQuery = sortOrder.toLowerCase() === 'desc' 
        ? dataQuery.orderBy(sql`${column} DESC`)
        : dataQuery.orderBy(column);
    }
  }
  
  // Apply pagination
  const data = await dataQuery.limit(limitNum).offset(offset);
  
  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum)
    }
  };
}

export function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = ['asc', 'desc'].includes(query.sortOrder?.toLowerCase()) 
    ? query.sortOrder.toLowerCase() 
    : 'desc';
  
  return { page, limit, sortBy, sortOrder };
}
