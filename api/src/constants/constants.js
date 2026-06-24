//pagination
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

//user details validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const GENDERS = ["m", "f", "o"];
const MIN_PASSWORD_LENGTH = 8;
const PHONE_MAX_LENGTH = 10;
const MUSIC_GENRES = ["rnb", "country", "classic", "rock", "jazz"];

// csv max file size
const MAX_CSV_MB = 2;
const MAX_CSV_BYTES = MAX_CSV_MB * 1024 * 1024;

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  EMAIL_REGEX,
  GENDERS,
  MIN_PASSWORD_LENGTH,
  PHONE_MAX_LENGTH,
  MUSIC_GENRES,
  MAX_CSV_MB,
  MAX_CSV_BYTES,
};
