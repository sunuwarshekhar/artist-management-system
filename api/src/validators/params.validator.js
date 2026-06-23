const { sendError } = require("../helpers/response");

function validateParams(schemaFn) {
  return (req, res, next) => {
    const result = schemaFn(req.params);
    if (result.error) {
      return sendError(res, 400, result.error);
    }
    req.params = result;
    next();
  };
}

function validateUserId(params) {
  const userId = parseInt(params.id, 10);
  if (Number.isNaN(userId) || userId < 1) {
    return { error: "Invalid user id" };
  }
  return { id: userId };
}

function validateArtistId(params) {
  const artistId = parseInt(params.id, 10);
  if (Number.isNaN(artistId) || artistId < 1) {
    return { error: "Invalid artist id" };
  }
  return { id: artistId };
}

function validateArtistMusicParams(params) {
  const artistResult = validateArtistId(params);
  if (artistResult.error) return artistResult;

  const musicId = parseInt(params.musicId, 10);
  if (Number.isNaN(musicId) || musicId < 1) {
    return { error: "Invalid song id" };
  }

  return { id: artistResult.id, musicId };
}

module.exports = {
  validateParams,
  validateUserId,
  validateArtistId,
  validateArtistMusicParams,
};
