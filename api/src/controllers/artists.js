const { query } = require("../database/config");
const { ROLES } = require("../constants/roles");
const { sendError, sendSuccess } = require("../helpers/response");

async function listArtists(req, res) {
  const { page, limit, offset } = req.pagination;

  try {
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM "artist"',
    );
    const total = countResult.rows[0].total;

    const result = await query(
      `SELECT id, user_id, name, dob, gender, address, first_release_year,
              no_of_albums_released, created_at, updated_at
       FROM "artist"
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    sendSuccess(
      res,
      {
        artists: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      },
      "Artists list fetched",
    );
  } catch (err) {
    console.error("listArtists err:", err.message);
    sendError(res, 500, "Failed to fetch artists");
  }
}

async function listUnlinkedArtistUsers(req, res) {
  const { search } = req.unlinkedSearch;

  try {
    const params = [ROLES.ARTIST];
    let searchClause = "";

    if (search) {
      params.push(`%${search}%`);
      const searchParam = `$${params.length}`;
      searchClause = `AND (
        u.first_name ILIKE ${searchParam}
        OR u.last_name ILIKE ${searchParam}
        OR u.email ILIKE ${searchParam}
        OR CONCAT(u.first_name, ' ', u.last_name) ILIKE ${searchParam}
      )`;
    }

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.dob, u.gender, u.address
       FROM "user" u
       LEFT JOIN "artist" a ON a.user_id = u.id
       WHERE u.role = $1 AND a.id IS NULL
       ${searchClause}
       ORDER BY u.first_name ASC, u.last_name ASC
       LIMIT 50`,
      params,
    );

    sendSuccess(res, { users: result.rows }, "Unlinked artist users fetched");
  } catch (err) {
    console.error("listUnlinkedArtistUsers err:", err.message);
    sendError(res, 500, "Failed to fetch unlinked artist users");
  }
}

async function createArtist(req, res) {
  const {
    user_id,
    name,
    dob,
    gender,
    address,
    first_release_year,
    no_of_albums_released,
  } = req.body;

  try {
    const userResult = await query(
      `SELECT u.id
       FROM "user" u
       LEFT JOIN "artist" a ON a.user_id = u.id
       WHERE u.id = $1 AND u.role = $2 AND a.id IS NULL`,
      [user_id, ROLES.ARTIST],
    );

    if (userResult.rowCount === 0) {
      return sendError(
        res,
        400,
        "Selected user is not an unlinked artist account",
      );
    }

    const result = await query(
      `INSERT INTO "artist"
        (user_id, name, dob, gender, address, first_release_year, no_of_albums_released)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, name, dob, gender, address, first_release_year,
                 no_of_albums_released, created_at`,
      [
        user_id,
        name,
        dob,
        gender,
        address,
        first_release_year,
        no_of_albums_released ?? 0,
      ],
    );

    sendSuccess(res, result.rows[0], "Artist created", 201);
  } catch (err) {
    console.error("createArtist err:", err.message);
    sendError(res, 500, "Failed to create artist");
  }
}

module.exports = { listArtists, listUnlinkedArtistUsers, createArtist };
