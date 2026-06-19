const { DEFAULT_PAGE, DEFAULT_LIMIT } = require("../constants/constants");

function parsePagination(req) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  console.log(searchParams, "params");
  const page = Number(searchParams.get("page")) || DEFAULT_PAGE;
  const limit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;

  if (!Number.isInteger(page) || page < 1) {
    return { error: "page must be a positive integer and greater than 0" };
  }

  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { parsePagination };
