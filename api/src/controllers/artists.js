const { query } = require("../database/config");
const { ROLES } = require("../constants/roles");
const { sendError, sendSuccess, sendCsv } = require("../helpers/response");
const { parseCsv, toCsvRow, rowsToObjects } = require("../helpers/csv");
const { validateCreateArtist } = require("../validators/body.validator");

function formatDateForCsv(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

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

async function getArtist(req, res) {
  const artistId = req.params.id;

  try {
    const result = await query(
      `SELECT id, user_id, name, dob, gender, address, first_release_year,
              no_of_albums_released, created_at, updated_at
       FROM "artist"
       WHERE id = $1`,
      [artistId],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "Artist not found");
    }

    sendSuccess(res, result.rows[0], "Artist fetched");
  } catch (err) {
    console.error("getArtist err:", err.message);
    sendError(res, 500, "Failed to fetch artist");
  }
}

async function updateArtist(req, res) {
  const artistId = req.params.id;
  const data = req.body;

  try {
    const existing = await query('SELECT id FROM "artist" WHERE id = $1', [
      artistId,
    ]);

    if (existing.rowCount === 0) {
      return sendError(res, 404, "Artist not found");
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    values.push(artistId);

    const result = await query(
      `UPDATE "artist"
       SET ${fields.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, user_id, name, dob, gender, address, first_release_year,
                 no_of_albums_released, created_at, updated_at`,
      values,
    );

    sendSuccess(res, result.rows[0], "Artist updated");
  } catch (err) {
    console.error("updateArtist err:", err.message);
    sendError(res, 500, "Failed to update artist");
  }
}

async function deleteArtist(req, res) {
  const artistId = req.params.id;

  try {
    const result = await query(
      'DELETE FROM "artist" WHERE id = $1 RETURNING id, name',
      [artistId],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "Artist not found");
    }

    sendSuccess(res, result.rows[0], "Artist deleted");
  } catch (err) {
    console.error("deleteArtist err:", err.message);
    sendError(res, 500, "Failed to delete artist");
  }
}

async function getMyArtist(req, res) {
  try {
    const result = await query(
      `SELECT id, user_id, name, dob, gender, address, first_release_year,
              no_of_albums_released, created_at, updated_at
       FROM "artist"
       WHERE user_id = $1`,
      [req.user.id],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "Artist profile not found");
    }

    sendSuccess(res, result.rows[0], "Artist profile fetched");
  } catch (err) {
    console.error("getMyArtist err:", err.message);
    sendError(res, 500, "Failed to fetch artist profile");
  }
}

async function verifyArtistOwner(artistId, userId, res) {
  const artistResult = await query(
    'SELECT id, user_id FROM "artist" WHERE id = $1',
    [artistId],
  );

  if (artistResult.rowCount === 0) {
    sendError(res, 404, "Artist not found");
    return null;
  }

  if (artistResult.rows[0].user_id !== userId) {
    sendError(res, 403, "No Permission");
    return null;
  }

  return artistResult.rows[0];
}

async function createArtistMusic(req, res) {
  const artistId = req.params.id;
  const { title, album_name, genre } = req.body;

  try {
    const artist = await verifyArtistOwner(artistId, req.user.id, res);
    if (!artist) return;

    const result = await query(
      `INSERT INTO "music" (artist_id, title, album_name, genre)
       VALUES ($1, $2, $3, $4)
       RETURNING id, artist_id, title, album_name, genre, created_at, updated_at`,
      [artistId, title, album_name, genre],
    );

    sendSuccess(res, result.rows[0], "Song created", 201);
  } catch (err) {
    console.error("createArtistMusic err:", err.message);
    sendError(res, 500, "Failed to create song");
  }
}

async function listArtistMusic(req, res) {
  const artistId = req.params.id;
  const { page, limit, offset } = req.pagination;

  try {
    const artistResult = await query(
      'SELECT id, name, user_id FROM "artist" WHERE id = $1',
      [artistId],
    );

    if (artistResult.rowCount === 0) {
      return sendError(res, 404, "Artist not found");
    }

    const artist = artistResult.rows[0];

    if (req.user.role === ROLES.ARTIST && artist.user_id !== req.user.id) {
      return sendError(res, 403, "No Permission");
    }

    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM "music" WHERE artist_id = $1',
      [artistId],
    );
    const total = countResult.rows[0].total;

    const result = await query(
      `SELECT id, artist_id, title, album_name, genre, created_at, updated_at
       FROM "music"
       WHERE artist_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [artistId, limit, offset],
    );

    sendSuccess(
      res,
      {
        artist: { id: artist.id, name: artist.name },
        songs: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      },
      "Songs list fetched",
    );
  } catch (err) {
    console.error("listArtistMusic err:", err.message);
    sendError(res, 500, "Failed to fetch songs");
  }
}

async function updateArtistMusic(req, res) {
  const { id: artistId, musicId } = req.params;
  const { title, album_name, genre } = req.body;

  try {
    const artist = await verifyArtistOwner(artistId, req.user.id, res);
    if (!artist) return;

    const result = await query(
      `UPDATE "music"
       SET title = $1, album_name = $2, genre = $3
       WHERE id = $4 AND artist_id = $5
       RETURNING id, artist_id, title, album_name, genre, created_at, updated_at`,
      [title, album_name, genre, musicId, artistId],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "Song not found");
    }

    sendSuccess(res, result.rows[0], "Song updated");
  } catch (err) {
    console.error("updateArtistMusic err:", err.message);
    sendError(res, 500, "Failed to update song");
  }
}

async function deleteArtistMusic(req, res) {
  const { id: artistId, musicId } = req.params;

  try {
    const artist = await verifyArtistOwner(artistId, req.user.id, res);
    if (!artist) return;

    const result = await query(
      'DELETE FROM "music" WHERE id = $1 AND artist_id = $2 RETURNING id, title',
      [musicId, artistId],
    );

    if (result.rowCount === 0) {
      return sendError(res, 404, "Song not found");
    }

    sendSuccess(res, result.rows[0], "Song deleted");
  } catch (err) {
    console.error("deleteArtistMusic err:", err.message);
    sendError(res, 500, "Failed to delete song");
  }
}

const ARTIST_CSV_HEADERS = [
  "id",
  "user_id",
  "user_email",
  "name",
  "dob",
  "gender",
  "address",
  "first_release_year",
  "no_of_albums_released",
];

async function exportArtistsCsv(req, res) {
  try {
    const result = await query(
      `SELECT a.id, a.user_id, u.email AS user_email, a.name, a.dob, a.gender,
              a.address, a.first_release_year, a.no_of_albums_released
       FROM "artist" a
       JOIN "user" u ON u.id = a.user_id
       ORDER BY a.created_at DESC`,
    );

    const lines = [toCsvRow(ARTIST_CSV_HEADERS)];

    for (const artist of result.rows) {
      lines.push(
        toCsvRow([
          artist.id,
          artist.user_id,
          artist.user_email,
          artist.name,
          formatDateForCsv(artist.dob),
          artist.gender,
          artist.address,
          artist.first_release_year ?? "",
          artist.no_of_albums_released ?? 0,
        ]),
      );
    }

    sendCsv(res, "artists.csv", lines.join("\n"));
  } catch (err) {
    console.error("exportArtistsCsv err:", err.message);
    sendError(res, 500, "Failed to export artists");
  }
}

async function resolveImportUserId(row) {
  if (row.user_id) {
    return Number(row.user_id);
  }

  if (!row.user_email) {
    return null;
  }

  const result = await query(
    `SELECT u.id
     FROM "user" u
     LEFT JOIN "artist" a ON a.user_id = u.id
     WHERE u.email = $1 AND u.role = $2 AND a.id IS NULL`,
    [row.user_email.trim().toLowerCase(), ROLES.ARTIST],
  );

  return result.rowCount > 0 ? result.rows[0].id : null;
}

async function importArtistsCsv(req, res) {
  const csvText = req.rawBody?.trim();

  if (!csvText) {
    return sendError(res, 400, "CSV file is required");
  }

  try {
    const rows = rowsToObjects(parseCsv(csvText));

    if (!rows.length) {
      return sendError(res, 400, "CSV must include a header row and data rows");
    }

    const created = [];
    const errors = [];

    for (const row of rows) {
      const rowNumber = row._row;

      try {
        const userId = await resolveImportUserId(row);

        if (!userId) {
          errors.push({
            row: rowNumber,
            message: "user_id or a valid unlinked user_email is required",
          });
          continue;
        }

        const validation = validateCreateArtist({
          user_id: userId,
          name: row.name,
          dob: row.dob,
          gender: row.gender,
          address: row.address,
          first_release_year:
            row.first_release_year === "" ? null : row.first_release_year,
          no_of_albums_released:
            row.no_of_albums_released === "" ? 0 : row.no_of_albums_released,
        });

        if (validation.error) {
          errors.push({ row: rowNumber, message: validation.error });
          continue;
        }

        const userResult = await query(
          `SELECT u.id
           FROM "user" u
           LEFT JOIN "artist" a ON a.user_id = u.id
           WHERE u.id = $1 AND u.role = $2 AND a.id IS NULL`,
          [validation.user_id, ROLES.ARTIST],
        );

        if (userResult.rowCount === 0) {
          errors.push({
            row: rowNumber,
            message: "Selected user is not an unlinked artist account",
          });
          continue;
        }

        const insertResult = await query(
          `INSERT INTO "artist"
            (user_id, name, dob, gender, address, first_release_year, no_of_albums_released)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, name`,
          [
            validation.user_id,
            validation.name,
            validation.dob,
            validation.gender,
            validation.address,
            validation.first_release_year,
            validation.no_of_albums_released ?? 0,
          ],
        );

        created.push(insertResult.rows[0]);
      } catch (err) {
        errors.push({
          row: rowNumber,
          message: err.message || "Failed to import row",
        });
      }
    }

    sendSuccess(
      res,
      {
        created: created.length,
        failed: errors.length,
        errors,
      },
      "Artists import completed",
    );
  } catch (err) {
    console.error("importArtistsCsv err:", err.message);
    sendError(res, 500, "Failed to import artists");
  }
}

module.exports = {
  listArtists,
  listUnlinkedArtistUsers,
  createArtist,
  getArtist,
  updateArtist,
  deleteArtist,
  getMyArtist,
  createArtistMusic,
  listArtistMusic,
  updateArtistMusic,
  deleteArtistMusic,
  exportArtistsCsv,
  importArtistsCsv,
};
