const { sendError } = require("../helpers/response");
const { ROLES, ALL_ROLES } = require("../constants/roles");
const {
  EMAIL_REGEX,
  GENDERS,
  MIN_PASSWORD_LENGTH,
} = require("../constants/constants");
const { sanitizeText, sanitizeName } = require("../helpers/sanitize");

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

  if (![ROLES.SUPER_ADMIN, ROLES.ARTIST_MANAGER].includes(role)) {
    return {
      error: "only super admin or artist manager can be created",
    };
  }

  if (phone && sanitizeText(phone)?.length > 10) {
    return { error: "phone must not exceed 10 characters" };
  }

  if (gender && !GENDERS.includes(gender)) {
    return { error: "gender must be m, f, or o" };
  }

  if (dob && Number.isNaN(Date.parse(dob))) {
    return { error: "dob must be a valid date" };
  }

  const cleanPhone = phone ? sanitizeText(phone) : null;
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
    gender: gender || null,
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
    if (![ROLES.SUPER_ADMIN, ROLES.ARTIST_MANAGER].includes(role)) {
      return {
        error: "super admin or artist manager roles are allowed",
      };
    }
    data.role = role;
  }

  if (phone !== undefined) {
    const cleanPhone = phone ? sanitizeText(phone) : null;
    if (cleanPhone && cleanPhone.length > 10) {
      return { error: "phone number must not exceed 10 characters" };
    }
    data.phone = cleanPhone;
  }

  if (gender !== undefined) {
    if (gender && !GENDERS.includes(gender)) {
      return { error: "gender must be m, f, or o" };
    }
    data.gender = gender || null;
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

  const cleanPhone = phone ? sanitizeText(phone) : null;
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
  validateRegister,
  validateLogin,
};
