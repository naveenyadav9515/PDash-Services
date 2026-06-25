/**
 * Utility to calculate pagination skip values and build metadata.
 */
const buildPagination = (pageQuery, limitQuery, totalDocs) => {
  const page = parseInt(pageQuery, 10) || 1;
  const limit = parseInt(limitQuery, 10) || 20;
  
  // Hard cap limit at 100 to prevent massive DB queries
  const safeLimit = Math.min(limit, 100);
  
  const skip = (page - 1) * safeLimit;
  const totalPages = Math.ceil(totalDocs / safeLimit);
  
  const meta = {
    page,
    limit: safeLimit,
    totalDocs,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return { skip, limit: safeLimit, meta };
};

module.exports = buildPagination;
