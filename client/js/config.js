const API_URL = "http://localhost:5000";
const PAGE_LIMIT = 10;

const MAX_CSV_MB = 2;
const MAX_CSV_BYTES = MAX_CSV_MB * 1024 * 1024;

const DISPLAY_NAME_MAX = 36;
const DISPLAY_EMAIL_MAX = 40;

const ROLES = {
  SUPER_ADMIN: "super_admin",
  ARTIST_MANAGER: "artist_manager",
  ARTIST: "artist",
};
