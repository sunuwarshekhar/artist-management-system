if (!auth.isLoggedIn()) {
  window.location.href = "index.html";
}

const user = auth.getUser();
const userNameEl = document.getElementById("user-name");
if (userNameEl && user) {
  userNameEl.textContent = `Hi ${user.first_name}`;
}

document.getElementById("logout-btn")?.addEventListener("click", () => {
  auth.logout();
});

const canManageUsers = user?.role === ROLES.SUPER_ADMIN;
const canViewArtists =
  user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ARTIST_MANAGER;
const canManageArtists = user?.role === ROLES.ARTIST_MANAGER;
const canCreateArtists = canManageArtists;

const artistsTabBtn = document.querySelector('[data-tab="artists"]');

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const createUserBtn = document.getElementById("create-user-btn");
const createArtistBtn = document.getElementById("create-artist-btn");
const usersPaginationEl = document.getElementById("users-pagination");
const artistsPaginationEl = document.getElementById("artists-pagination");
const userFormModal = document.getElementById("user-form-modal");
const userForm = document.getElementById("user-form");
const userFormTitle = document.getElementById("user-form-title");
const userFormError = document.getElementById("user-form-error");
const userFormSubmit = document.getElementById("user-form-submit");
const passwordField = document.getElementById("password-field");
const deleteUserModal = document.getElementById("delete-user-modal");
const deleteUserMessage = document.getElementById("delete-user-message");
const deleteUserError = document.getElementById("delete-user-error");
const deleteUserConfirm = document.getElementById("delete-user-confirm");
const userDetailModal = document.getElementById("user-detail-modal");
const userDetailTitle = document.getElementById("user-detail-title");
const userDetailContent = document.getElementById("user-detail-content");
const userDetailError = document.getElementById("user-detail-error");
const artistFormModal = document.getElementById("artist-form-modal");
const artistForm = document.getElementById("artist-form");
const artistFormTitle = document.getElementById("artist-form-title");
const artistFormError = document.getElementById("artist-form-error");
const artistFormSubmit = document.getElementById("artist-form-submit");
const artistUserField = document.getElementById("artist-user-field");
const artistUserIdInput = document.getElementById("artist-user-id");
const artistUserSearchInput = document.getElementById("artist-user-search");
const artistUserOptionsEl = document.getElementById("artist-user-options");
const deleteArtistModal = document.getElementById("delete-artist-modal");
const deleteArtistMessage = document.getElementById("delete-artist-message");
const deleteArtistError = document.getElementById("delete-artist-error");
const deleteArtistConfirm = document.getElementById("delete-artist-confirm");

let formMode = "create";
let artistFormMode = "create";
let editingArtistId = null;
let deletingArtistId = null;
let editingUserId = null;
let deletingUserId = null;
let currentPage = 1;
let artistsCurrentPage = 1;
let pagination = null;

const usersPagination = paginationElement(usersPaginationEl, (page) =>
  loadUsers(page),
);
const artistsPagination = paginationElement(artistsPaginationEl, (page) =>
  loadArtists(page),
);

createUserBtn.disabled = !canManageUsers;
createArtistBtn.disabled = !canCreateArtists;

if (!canViewArtists) {
  artistsTabBtn?.classList.add("hidden");
}

document.getElementById("user-phone")?.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    if (tab === "artists" && !canViewArtists) return;

    tabButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    tabPanels.forEach((panel) =>
      panel.classList.toggle("active", panel.id === `${tab}-panel`),
    );
    createUserBtn.classList.toggle("hidden", tab !== "users");
    createArtistBtn.classList.toggle(
      "hidden",
      tab !== "artists" || !canCreateArtists,
    );

    if (tab === "users") {
      loadUsers(currentPage);
    } else if (tab === "artists") {
      loadArtists(artistsCurrentPage);
    }
  });
});

function formatRole(role) {
  return role.replace(/_/g, " ");
}

function formatGender(gender) {
  const labels = { m: "Male", f: "Female", o: "Other" };
  return labels[gender] || null;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function renderUserDetail(u) {
  const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  userDetailTitle.textContent = fullName || "User Details";

  const fields = [
    { label: "First Name", value: u.first_name },
    { label: "Last Name", value: u.last_name },
    { label: "Email", value: u.email },
    { label: "Role", value: formatRole(u.role) },
    { label: "Phone", value: u.phone },
    { label: "Date of Birth", value: formatDate(u.dob) },
    { label: "Gender", value: formatGender(u.gender) },
    { label: "Address", value: u.address },
    { label: "Created At", value: formatDateTime(u.created_at) },
    { label: "Last Updated", value: formatDateTime(u.updated_at) },
  ];

  userDetailContent.innerHTML = fields
    .map(
      ({ label, value }) => `
        <div class="detail-item">
          <span class="detail-label">${escapeHtml(label)}</span>
          <span class="detail-value">${escapeHtml(value) || "-"}</span>
        </div>
      `,
    )
    .join("");
}

function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
}

document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", () => closeModal(el.dataset.closeModal));
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!userFormModal.classList.contains("hidden"))
    closeModal("user-form-modal");
  if (!artistFormModal.classList.contains("hidden"))
    closeModal("artist-form-modal");
  if (!deleteArtistModal.classList.contains("hidden"))
    closeModal("delete-artist-modal");
  if (!deleteUserModal.classList.contains("hidden"))
    closeModal("delete-user-modal");
  if (!userDetailModal.classList.contains("hidden"))
    closeModal("user-detail-modal");
});

function renderUsersTable(users) {
  const tbody = document.getElementById("users-table-body");

  if (!users.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="table-empty">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map((u) => {
      const isSelf = u.id === user?.id;
      const disabled = !canManageUsers || isSelf;
      const deleteDisabled = disabled;
      const editDisabled = !canManageUsers;
      const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();

      return `
        <tr>
          <td>${renderTruncated(fullName, DISPLAY_NAME_MAX)}</td>
          <td>${renderTruncated(u.email, DISPLAY_EMAIL_MAX)}</td>
          <td>${escapeHtml(formatRole(u.role))}</td>
          <td>${escapeHtml(u.phone) || "-"}</td>
          <td class="col-actions-cell">
            <div class="table-actions">
              <button
                type="button"
                class="btn-icon btn-view"
                data-user-id="${u.id}"
                title="View details"
              ><i class="fa fa-eye" aria-hidden="true"></i></button>
              <button
                type="button"
                class="btn-icon btn-edit"
                data-user-id="${u.id}"
                title="${editDisabled ? "No permission" : "Edit"}"
                ${editDisabled ? "disabled" : ""}
              ><i class="fa fa-pencil" aria-hidden="true"></i></button>
              <button
                type="button"
                class="btn-icon btn-icon-danger btn-delete"
                data-user-id="${u.id}"
                data-user-name="${escapeHtml(fullName)}"
                title="${isSelf ? "Cannot delete your own account" : deleteDisabled ? "No permission" : "Delete"}"
                ${deleteDisabled ? "disabled" : ""}
              ><i class="fa fa-trash" aria-hidden="true"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadUsers(page = 1) {
  const tbody = document.getElementById("users-table-body");
  const errorEl = document.getElementById("users-error");
  errorEl.textContent = "";

  if (!canManageUsers) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="table-empty">No permission to view users.</td></tr>';
    usersPagination.hide();
    return;
  }

  currentPage = page;
  tbody.innerHTML =
    '<tr><td colspan="5" class="table-empty">Loading users...</td></tr>';

  try {
    const res = await apiRequest(
      "GET",
      `/api/users?page=${page}&limit=${PAGE_LIMIT}`,
    );
    pagination = res.data.pagination;
    renderUsersTable(res.data.users);
    usersPagination.update(pagination);
  } catch (error) {
    errorEl.textContent = error.message;
    tbody.innerHTML =
      '<tr><td colspan="5" class="table-empty">Failed to load users.</td></tr>';
    usersPagination.hide();
  }
}

function openCreateModal() {
  if (!canManageUsers) return;

  formMode = "create";
  editingUserId = null;
  userFormTitle.textContent = "Create User";
  userFormSubmit.textContent = "Create";
  passwordField.classList.remove("hidden");
  document.getElementById("user-password").required = true;
  userForm.reset();
  userFormError.textContent = "";
  openModal("user-form-modal");
}

async function openEditModal(userId) {
  if (!canManageUsers) return;

  formMode = "edit";
  editingUserId = userId;
  userFormTitle.textContent = "Edit User";
  userFormSubmit.textContent = "Save";
  passwordField.classList.add("hidden");
  document.getElementById("user-password").required = false;
  userForm.reset();
  userFormError.textContent = "";
  openModal("user-form-modal");

  try {
    const res = await apiRequest("GET", `/api/users/${userId}`);
    const u = res.data;

    document.getElementById("user-first-name").value = u.first_name || "";
    document.getElementById("user-last-name").value = u.last_name || "";
    document.getElementById("user-email").value = u.email || "";
    document.getElementById("user-role").value = u.role || "";
    document.getElementById("user-phone").value = u.phone || "";
    document.getElementById("user-dob").value = u.dob ? u.dob.slice(0, 10) : "";
    document.getElementById("user-gender").value = u.gender || "";
    document.getElementById("user-address").value = u.address || "";
  } catch (error) {
    closeModal("user-form-modal");
    document.getElementById("users-error").textContent = error.message;
  }
}

function openDeleteModal(userId, userName) {
  if (!canManageUsers || userId === user?.id) return;

  deletingUserId = userId;
  deleteUserMessage.textContent = `Are you sure you want to delete ${userName}? This action cannot be undone.`;
  deleteUserError.textContent = "";
  openModal("delete-user-modal");
}

async function openViewModal(userId) {
  if (!canManageUsers) return;

  userDetailError.textContent = "";
  userDetailTitle.textContent = "User Details";
  userDetailContent.innerHTML =
    '<p class="table-empty">Loading user details...</p>';
  openModal("user-detail-modal");

  try {
    const res = await apiRequest("GET", `/api/users/${userId}`);
    renderUserDetail(res.data);
  } catch (error) {
    userDetailContent.innerHTML = "";
    userDetailError.textContent = error.message;
  }
}

createUserBtn.addEventListener("click", openCreateModal);

document.getElementById("users-table-body").addEventListener("click", (e) => {
  const viewBtn = e.target.closest(".btn-view");
  const editBtn = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

  if (viewBtn) {
    openViewModal(Number(viewBtn.dataset.userId));
  }

  if (editBtn && !editBtn.disabled) {
    openEditModal(Number(editBtn.dataset.userId));
  }

  if (deleteBtn && !deleteBtn.disabled) {
    openDeleteModal(
      Number(deleteBtn.dataset.userId),
      deleteBtn.dataset.userName,
    );
  }
});

function getFormData() {
  const data = {
    first_name: document.getElementById("user-first-name").value.trim(),
    last_name: document.getElementById("user-last-name").value.trim(),
    email: document.getElementById("user-email").value.trim(),
    role: document.getElementById("user-role").value,
    phone: document.getElementById("user-phone").value.trim() || null,
    dob: document.getElementById("user-dob").value || null,
    gender: document.getElementById("user-gender").value,
    address: document.getElementById("user-address").value.trim() || null,
  };

  if (formMode === "create") {
    data.password = document.getElementById("user-password").value;
  }

  return data;
}

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canManageUsers) return;

  userFormError.textContent = "";
  userFormSubmit.disabled = true;

  try {
    const body = getFormData();

    if (formMode === "create") {
      await apiRequest("POST", "/api/users", body);
    } else {
      await apiRequest("PUT", `/api/users/${editingUserId}`, body);
    }

    closeModal("user-form-modal");
    loadUsers(currentPage);
  } catch (error) {
    userFormError.textContent = error.message;
  } finally {
    userFormSubmit.disabled = false;
  }
});

deleteUserConfirm.addEventListener("click", async () => {
  if (!canManageUsers || !deletingUserId) return;

  deleteUserError.textContent = "";
  deleteUserConfirm.disabled = true;

  try {
    await apiRequest("DELETE", `/api/users/${deletingUserId}`);
    closeModal("delete-user-modal");
    loadUsers(usersPagination.getPageAfterDelete());
  } catch (error) {
    deleteUserError.textContent = error.message;
  } finally {
    deleteUserConfirm.disabled = false;
    deletingUserId = null;
  }
});

async function loadArtists(page = 1) {
  const tbody = document.getElementById("artists-table-body");
  const errorEl = document.getElementById("artists-error");
  errorEl.textContent = "";

  if (!canViewArtists) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="table-empty">No permission to view artists.</td></tr>';
    artistsPagination.hide();
    return;
  }

  artistsCurrentPage = page;
  tbody.innerHTML =
    '<tr><td colspan="4" class="table-empty">Loading artists...</td></tr>';

  try {
    const res = await apiRequest(
      "GET",
      `/api/artists?page=${page}&limit=${PAGE_LIMIT}`,
    );
    renderArtistsTable(res.data.artists);
    artistsPagination.update(res.data.pagination);
  } catch (error) {
    errorEl.textContent = error.message;
    tbody.innerHTML =
      '<tr><td colspan="4" class="table-empty">Failed to load artists.</td></tr>';
    artistsPagination.hide();
  }
}

function renderArtistsTable(artists) {
  const tbody = document.getElementById("artists-table-body");

  if (!artists.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="table-empty">No artists found.</td></tr>';
    return;
  }

  tbody.innerHTML = artists
    .map((a) => {
      const noPermission = !canManageArtists;

      return `
        <tr>
          <td>${renderTruncated(a.name, DISPLAY_NAME_MAX)}</td>
          <td>${escapeHtml(a.no_of_albums_released ?? 0)}</td>
          <td>${escapeHtml(a.first_release_year) || "-"}</td>
          <td class="col-actions-cell">
            <div class="table-actions">
              <button
                type="button"
                class="btn-icon btn-edit"
                data-artist-id="${a.id}"
                title="${noPermission ? "No permission" : "Edit"}"
                ${noPermission ? "disabled" : ""}
              ><i class="fa fa-pencil" aria-hidden="true"></i></button>
              <button
                type="button"
                class="btn-icon btn-icon-danger btn-delete"
                data-artist-id="${a.id}"
                data-artist-name="${escapeHtml(a.name)}"
                title="${noPermission ? "No permission" : "Delete"}"
                ${noPermission ? "disabled" : ""}
              ><i class="fa fa-trash" aria-hidden="true"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function openCreateArtistModal() {
  if (!canCreateArtists) return;

  artistFormMode = "create";
  editingArtistId = null;
  artistFormTitle.textContent = "Create Artist";
  artistFormSubmit.textContent = "Create";
  artistUserField.classList.remove("hidden");
  artistUserSearchInput.required = true;
  artistForm.reset();
  resetArtistUserPicker();
  document.getElementById("artist-albums").value = "0";
  artistFormError.textContent = "";
  openModal("artist-form-modal");
  loadUnlinkedArtistUsers("");
}

async function openEditArtistModal(artistId) {
  if (!canManageArtists) return;

  artistFormMode = "edit";
  editingArtistId = artistId;
  artistFormTitle.textContent = "Edit Artist";
  artistFormSubmit.textContent = "Save";
  artistUserField.classList.add("hidden");
  artistUserSearchInput.required = false;
  artistForm.reset();
  resetArtistUserPicker();
  artistFormError.textContent = "";
  openModal("artist-form-modal");

  try {
    const res = await apiRequest("GET", `/api/artists/${artistId}`);
    const a = res.data;

    document.getElementById("artist-name").value = a.name || "";
    document.getElementById("artist-dob").value = a.dob
      ? a.dob.slice(0, 10)
      : "";
    document.getElementById("artist-gender").value = a.gender || "";
    document.getElementById("artist-address").value = a.address || "";
    document.getElementById("artist-first-release-year").value =
      a.first_release_year ?? "";
    document.getElementById("artist-albums").value =
      a.no_of_albums_released ?? 0;
  } catch (error) {
    closeModal("artist-form-modal");
    document.getElementById("artists-error").textContent = error.message;
  }
}

function openDeleteArtistModal(artistId, artistName) {
  if (!canManageArtists) return;

  deletingArtistId = artistId;
  deleteArtistMessage.textContent = `Are you sure you want to delete ${artistName}? This action cannot be undone.`;
  deleteArtistError.textContent = "";
  openModal("delete-artist-modal");
}

function resetArtistUserPicker() {
  artistUserIdInput.value = "";
  artistUserSearchInput.value = "";
  artistUserOptionsEl.innerHTML = "";
  artistUserOptionsEl.classList.add("hidden");
}

function formatUserLabel(u) {
  const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return fullName || u.email;
}

function renderUnlinkedUserOptions(users) {
  if (!users.length) {
    artistUserOptionsEl.innerHTML =
      '<li class="combobox-option-empty">No unlinked artist users found.</li>';
    artistUserOptionsEl.classList.remove("hidden");
    return;
  }

  artistUserOptionsEl.innerHTML = users
    .map((u) => {
      const fullName =
        `${escapeHtml(u.first_name ?? "")} ${escapeHtml(u.last_name ?? "")}`.trim();
      return `
        <li class="combobox-option" role="option" data-user-id="${u.id}">
          <strong>${fullName || escapeHtml(u.email)}</strong>
          <span>${escapeHtml(u.email)}</span>
        </li>
      `;
    })
    .join("");
  artistUserOptionsEl.classList.remove("hidden");
}

let unlinkedUsersTimer = null;
let unlinkedArtistUsers = [];

async function loadUnlinkedArtistUsers(search) {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiRequest("GET", `/api/artists/unlinked-users${query}`);
    unlinkedArtistUsers = res.data.users;
    renderUnlinkedUserOptions(unlinkedArtistUsers);
  } catch (error) {
    unlinkedArtistUsers = [];
    artistUserOptionsEl.innerHTML = `<li class="combobox-option-empty">${escapeHtml(error.message)}</li>`;
    artistUserOptionsEl.classList.remove("hidden");
  }
}

function selectUnlinkedArtistUser(userId) {
  const user = unlinkedArtistUsers.find((u) => u.id === userId);
  if (!user) return;

  artistUserIdInput.value = String(user.id);
  artistUserSearchInput.value = formatUserLabel(user);

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  if (fullName) {
    document.getElementById("artist-name").value = fullName;
  }
  document.getElementById("artist-dob").value = user.dob
    ? user.dob.slice(0, 10)
    : "";
  document.getElementById("artist-gender").value = user.gender || "";
  document.getElementById("artist-address").value = user.address || "";

  artistUserOptionsEl.classList.add("hidden");
}

artistUserSearchInput?.addEventListener("input", (e) => {
  artistUserIdInput.value = "";
  clearTimeout(unlinkedUsersTimer);
  const search = e.target.value.trim();
  unlinkedUsersTimer = setTimeout(() => loadUnlinkedArtistUsers(search), 400);
});

artistUserSearchInput?.addEventListener("focus", () => {
  if (!artistUserOptionsEl.children.length) {
    loadUnlinkedArtistUsers(artistUserSearchInput.value.trim());
  } else {
    artistUserOptionsEl.classList.remove("hidden");
  }
});

artistUserOptionsEl?.addEventListener("click", (e) => {
  const option = e.target.closest(".combobox-option");
  if (option?.dataset.userId) {
    selectUnlinkedArtistUser(Number(option.dataset.userId));
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#artist-user-combobox")) {
    artistUserOptionsEl?.classList.add("hidden");
  }
});

function getArtistFormData() {
  const firstReleaseYear = document
    .getElementById("artist-first-release-year")
    .value.trim();
  const albums = document.getElementById("artist-albums").value.trim();

  const data = {
    name: document.getElementById("artist-name").value.trim(),
    dob: document.getElementById("artist-dob").value,
    gender: document.getElementById("artist-gender").value,
    address: document.getElementById("artist-address").value.trim(),
    first_release_year: firstReleaseYear ? Number(firstReleaseYear) : null,
    no_of_albums_released: albums ? Number(albums) : 0,
  };

  if (artistFormMode === "create") {
    data.user_id = Number(artistUserIdInput.value);
  }

  return data;
}

createArtistBtn.addEventListener("click", openCreateArtistModal);

document.getElementById("artists-table-body").addEventListener("click", (e) => {
  const editBtn = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

  if (editBtn?.dataset.artistId) {
    openEditArtistModal(Number(editBtn.dataset.artistId));
  }

  if (deleteBtn?.dataset.artistId) {
    openDeleteArtistModal(
      Number(deleteBtn.dataset.artistId),
      deleteBtn.dataset.artistName,
    );
  }
});

artistForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canManageArtists) return;

  if (artistFormMode === "create" && !artistUserIdInput.value) {
    artistFormError.textContent = "Please select an artist user";
    return;
  }

  artistFormError.textContent = "";
  artistFormSubmit.disabled = true;

  try {
    const body = getArtistFormData();

    if (artistFormMode === "create") {
      await apiRequest("POST", "/api/artists", body);
    } else {
      await apiRequest("PUT", `/api/artists/${editingArtistId}`, body);
    }

    closeModal("artist-form-modal");
    loadArtists(artistsCurrentPage);
  } catch (error) {
    artistFormError.textContent = error.message;
  } finally {
    artistFormSubmit.disabled = false;
  }
});

deleteArtistConfirm.addEventListener("click", async () => {
  if (!canManageArtists || !deletingArtistId) return;

  deleteArtistError.textContent = "";
  deleteArtistConfirm.disabled = true;

  try {
    await apiRequest("DELETE", `/api/artists/${deletingArtistId}`);
    closeModal("delete-artist-modal");
    loadArtists(artistsPagination.getPageAfterDelete());
  } catch (error) {
    deleteArtistError.textContent = error.message;
  } finally {
    deleteArtistConfirm.disabled = false;
    deletingArtistId = null;
  }
});

loadUsers(currentPage);
