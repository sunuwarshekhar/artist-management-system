const { ROLES } = require("../constants/roles");
const {
  EMAIL_REGEX,
  GENDERS,
  MIN_PASSWORD_LENGTH,
} = require("../constants/constants");

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

  if (!last_name?.trim()) {
    return { error: "last name is required" };
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

  if (phone && phone.length > 10) {
    return { error: "phone must not exceed 10 characters" };
  }

  if (gender && !GENDERS.includes(gender)) {
    return { error: "gender must be m, f, or o" };
  }

  if (dob && Number.isNaN(Date.parse(dob))) {
    return { error: "dob must be a valid date" };
  }

  if (address && address.length > 255) {
    return { error: "address must not exceed 255 characters" };
  }

  return {
    data: {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      phone: phone || null,
      dob: dob || null,
      gender: gender || null,
      address: address || null,
    },
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
    data.first_name = first_name.trim();
  }

  if (last_name !== undefined) {
    if (!last_name?.trim()) {
      return { error: "last name cannot be empty" };
    }
    data.last_name = last_name.trim();
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
    if (phone && phone.length > 10) {
      return { error: "phone number must not exceed 10 characters" };
    }
    data.phone = phone || null;
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
    if (address && address.length > 255) {
      return { error: "address must not exceed 255 characters" };
    }
    data.address = address || null;
  }

  return { data };
}

module.exports = { validateCreateUser, validateUpdateUser };
