const { sendError } = require("../helpers/response");
const {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} = require("../constants/constants");

function validateQuery(schemaFn, key) {
  return (req, res, next) => {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const query = Object.fromEntries(searchParams.entries());
    const result = schemaFn(query);
    if (result.error) {
      return sendError(res, 400, result.error);
    }
    if (key) {
      req[key] = result;
    } else {
      req.query = result;
    }
    next();
  };
}

function validatePagination(query) {
  const page = Number(query.page) || DEFAULT_PAGE;
  const limit = Number(query.limit) || DEFAULT_LIMIT;

  if (!Number.isInteger(page) || page < 1) {
    return { error: "page must be a positive integer and greater than 0" };
  }

  if (!Number.isInteger(limit) || limit < 1) {
    return { error: "limit must be a positive integer and greater than 0" };
  }

  if (limit > MAX_LIMIT) {
    return { error: `limit must not exceed ${MAX_LIMIT}` };
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

function validateUnlinkedUsersSearch(query) {
  const search = query.search?.trim() || "";
  return { search };
}

module.exports = {
  validateQuery,
  validatePagination,
  validateUnlinkedUsersSearch,
};
