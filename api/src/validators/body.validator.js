const { sendError } = require("../helpers/response");
const { ROLES, ALL_ROLES } = require("../constants/roles");
const {
  EMAIL_REGEX,
  GENDERS,
  MIN_PASSWORD_LENGTH,
} = require("../constants/constants");
const {
  sanitizeText,
  sanitizeName,
  sanitizePhone,
} = require("../helpers/sanitize");

function validateBody(schemaFn) {
  return (req, res, next) => {
    const result = schemaFn(req.body);

    if (result.error) {
      return sendError(res, 400, result.error);
    }

    req.body = result;
    next();
  };
}

function validateCreateUser(body) {
  const {
    first_name,
    last_name,
    email,
    password,
    role,
    phone,
    dob,
    gender,
    address,
  } = body;

  if (!first_name?.trim()) {
    return { error: "first name is required" };
  }

  const cleanFirstName = sanitizeName(first_name);
  if (cleanFirstName.error) {
    return { error: `first name ${cleanFirstName.error}` };
  }

  if (!last_name?.trim()) {
    return { error: "last name is required" };
  }

  const cleanLastName = sanitizeName(last_name);
  if (cleanLastName.error) {
    return { error: `last name ${cleanLastName.error}` };
  }

  if (!email?.trim()) {
    return { error: "email is required" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { error: "email is invalid" };
  }

  if (!password) {
    return { error: "password is required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (!role) {
    return { error: "role is required" };
  }

  if (![ROLES.SUPER_ADMIN, ROLES.ARTIST_MANAGER, ROLES.ARTIST].includes(role)) {
    return {
      error: "only super admin, artist manager, or artist can be created",
    };
  }

  if (!gender) {
    return { error: "gender is required" };
  }

  if (!GENDERS.includes(gender)) {
    return { error: "gender must be m, f, or o" };
  }

  if (dob && Number.isNaN(Date.parse(dob))) {
    return { error: "dob must be a valid date" };
  }

  const cleanPhone = sanitizePhone(phone);
  if (cleanPhone?.error) {
    return { error: `phone ${cleanPhone.error}` };
  }
  const cleanAddress = address ? sanitizeText(address) : null;

  if (cleanAddress && cleanAddress.length > 255) {
    return { error: "address must not exceed 255 characters" };
  }

  return {
    first_name: cleanFirstName,
    last_name: cleanLastName,
    email: email.trim().toLowerCase(),
    password,
    role,
    phone: cleanPhone,
    dob: dob || null,
    gender: gender,
    address: cleanAddress,
  };
}

function validateUpdateUser(body) {
  const { first_name, last_name, email, role, phone, dob, gender, address } =
    body;

  const hasField =
    first_name !== undefined ||
    last_name !== undefined ||
    email !== undefined ||
    role !== undefined ||
    phone !== undefined ||
    dob !== undefined ||
    gender !== undefined ||
    address !== undefined;

  if (!hasField) {
    return { error: "minimum one field is required" };
  }

  const data = {};

  if (first_name !== undefined) {
    if (!first_name?.trim()) {
      return { error: "first name cannot be empty" };
    }
    const cleanFirstName = sanitizeName(first_name);
    if (cleanFirstName.error) {
      return { error: `first name ${cleanFirstName.error}` };
    }
    data.first_name = cleanFirstName;
  }

  if (last_name !== undefined) {
    if (!last_name?.trim()) {
      return { error: "last name cannot be empty" };
    }
    const cleanLastName = sanitizeName(last_name);
    if (cleanLastName.error) {
      return { error: `last name ${cleanLastName.error}` };
    }
    data.last_name = cleanLastName;
  }

  if (email !== undefined) {
    if (!email?.trim()) {
      return { error: "email cannot be empty" };
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return { error: "email is invalid" };
    }
    data.email = email.trim().toLowerCase();
  }

  if (role !== undefined) {
    if (!role) {
      return { error: "role is required" };
    }
    if (
      ![ROLES.SUPER_ADMIN, ROLES.ARTIST_MANAGER, ROLES.ARTIST].includes(role)
    ) {
      return {
        error: "super admin, artist manager, or artist roles are allowed",
      };
    }
    data.role = role;
  }

  if (phone !== undefined) {
    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone?.error) {
      return { error: `phone ${cleanPhone.error}` };
    }
    data.phone = cleanPhone;
  }

  if (gender !== undefined) {
    if (!gender) {
      return { error: "gender is required" };
    }
    if (!GENDERS.includes(gender)) {
      return { error: "gender must be m, f, or o" };
    }
    data.gender = gender;
  }

  if (dob !== undefined) {
    if (dob && Number.isNaN(Date.parse(dob))) {
      return { error: "dob must be a valid date" };
    }
    data.dob = dob || null;
  }

  if (address !== undefined) {
    const cleanAddress = address ? sanitizeText(address) : null;
    if (cleanAddress && cleanAddress.length > 255) {
      return { error: "address must not exceed 255 characters" };
    }
    data.address = cleanAddress;
  }

  return data;
}

function validateRegister(body) {
  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    dob,
    gender,
    address,
    role,
  } = body;

  if (!first_name?.trim()) {
    return { error: "first name is required" };
  }

  const cleanFirstName = sanitizeName(first_name);
  if (cleanFirstName.error) {
    return { error: `first name ${cleanFirstName.error}` };
  }

  if (!last_name?.trim()) {
    return { error: "last name is required" };
  }

  const cleanLastName = sanitizeName(last_name);
  if (cleanLastName.error) {
    return { error: `last name ${cleanLastName.error}` };
  }

  if (!email?.trim()) {
    return { error: "email is required" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { error: "email is invalid" };
  }

  if (!password) {
    return { error: "password is required" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  const userRole = role || ROLES.ARTIST;
  if (!ALL_ROLES.includes(userRole)) {
    return { error: "Invalid role" };
  }

  if (gender && !GENDERS.includes(gender)) {
    return { error: "gender must be m, f, or o" };
  }

  if (dob && Number.isNaN(Date.parse(dob))) {
    return { error: "dob must be a valid date" };
  }

  const cleanPhone = sanitizePhone(phone);
  if (cleanPhone?.error) {
    return { error: `phone ${cleanPhone.error}` };
  }
  const cleanAddress = address ? sanitizeText(address) : null;

  return {
    first_name: cleanFirstName,
    last_name: cleanLastName,
    email: email.trim().toLowerCase(),
    password,
    phone: cleanPhone,
    dob: dob || null,
    gender: gender || null,
    address: cleanAddress,
    role: userRole,
  };
}

function validateCreateArtist(body) {
  const {
    user_id,
    name,
    dob,
    gender,
    address,
    first_release_year,
    no_of_albums_released,
  } = body;

  if (user_id === undefined || user_id === null || user_id === "") {
    return { error: "user is required" };
  }

  const linkedUserId = Number(user_id);
  if (!Number.isInteger(linkedUserId) || linkedUserId < 1) {
    return { error: "user must be a positive integer" };
  }

  if (!name?.trim()) {
    return { error: "name is required" };
  }

  const cleanName = sanitizeName(name);
  if (cleanName.error) {
    return { error: `name ${cleanName.error}` };
  }

  if (!gender) {
    return { error: "gender is required" };
  }

  if (!GENDERS.includes(gender)) {
    return { error: "gender must be m, f, or o" };
  }

  if (!dob) {
    return { error: "dob is required" };
  }

  if (Number.isNaN(Date.parse(dob))) {
    return { error: "dob must be a valid date" };
  }

  if (!address?.trim()) {
    return { error: "address is required" };
  }

  const cleanAddress = sanitizeText(address);
  if (!cleanAddress) {
    return { error: "address is required" };
  }

  if (cleanAddress.length > 255) {
    return { error: "address must not exceed 255 characters" };
  }

  if (first_release_year !== undefined && first_release_year !== null) {
    const year = Number(first_release_year);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      return {
        error: `first release year must be between 1900 and ${currentYear}`,
      };
    }
  }

  if (no_of_albums_released !== undefined && no_of_albums_released !== null) {
    const albums = Number(no_of_albums_released);
    if (!Number.isInteger(albums) || albums < 0) {
      return {
        error: "number of albums released must be a non-negative integer",
      };
    }
  }

  return {
    user_id: linkedUserId,
    name: cleanName,
    dob: dob,
    gender: gender,
    address: cleanAddress,
    first_release_year:
      first_release_year !== undefined && first_release_year !== null
        ? Number(first_release_year)
        : null,
    no_of_albums_released:
      no_of_albums_released !== undefined && no_of_albums_released !== null
        ? Number(no_of_albums_released)
        : 0,
  };
}

function validateUpdateArtist(body) {
  const {
    name,
    dob,
    gender,
    address,
    first_release_year,
    no_of_albums_released,
  } = body;

  const hasField =
    name !== undefined ||
    dob !== undefined ||
    gender !== undefined ||
    address !== undefined ||
    first_release_year !== undefined ||
    no_of_albums_released !== undefined;

  if (!hasField) {
    return { error: "minimum one field is required" };
  }

  const data = {};

  if (name !== undefined) {
    if (!name?.trim()) {
      return { error: "name cannot be empty" };
    }
    const cleanName = sanitizeName(name);
    if (cleanName.error) {
      return { error: `name ${cleanName.error}` };
    }
    data.name = cleanName;
  }

  if (gender !== undefined) {
    if (!gender) {
      return { error: "gender is required" };
    }
    if (!GENDERS.includes(gender)) {
      return { error: "gender must be m, f, or o" };
    }
    data.gender = gender;
  }

  if (dob !== undefined) {
    if (!dob) {
      return { error: "dob is required" };
    }
    if (Number.isNaN(Date.parse(dob))) {
      return { error: "dob must be a valid date" };
    }
    data.dob = dob;
  }

  if (address !== undefined) {
    if (!address?.trim()) {
      return { error: "address is required" };
    }
    const cleanAddress = sanitizeText(address);
    if (!cleanAddress) {
      return { error: "address is required" };
    }
    if (cleanAddress.length > 255) {
      return { error: "address must not exceed 255 characters" };
    }
    data.address = cleanAddress;
  }

  if (first_release_year !== undefined) {
    if (first_release_year === null || first_release_year === "") {
      data.first_release_year = null;
    } else {
      const year = Number(first_release_year);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
        return {
          error: `first release year must be between 1900 and ${currentYear}`,
        };
      }
      data.first_release_year = year;
    }
  }

  if (no_of_albums_released !== undefined) {
    const albums = Number(no_of_albums_released);
    if (!Number.isInteger(albums) || albums < 0) {
      return {
        error: "number of albums released must be a non-negative integer",
      };
    }
    data.no_of_albums_released = albums;
  }

  return data;
}

function validateLogin(body) {
  const { email, password } = body;

  if (!email?.trim()) {
    return { error: "email is required" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { error: "email is invalid" };
  }

  if (!password) {
    return { error: "password is required" };
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
}

module.exports = {
  validateBody,
  validateCreateUser,
  validateUpdateUser,
  validateCreateArtist,
  validateUpdateArtist,
  validateRegister,
  validateLogin,
};
