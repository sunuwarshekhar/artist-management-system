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

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const createUserBtn = document.getElementById("create-user-btn");
const usersPaginationEl = document.getElementById("users-pagination");
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

let formMode = "create";
let editingUserId = null;
let deletingUserId = null;
let currentPage = 1;
let pagination = null;

const usersPagination = paginationElement(usersPaginationEl, (page) =>
  loadUsers(page),
);

createUserBtn.disabled = !canManageUsers;

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    tabButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    tabPanels.forEach((panel) =>
      panel.classList.toggle("active", panel.id === `${tab}-panel`),
    );
    createUserBtn.classList.toggle("hidden", tab !== "users");

    if (tab === "users") {
      loadUsers(currentPage);
    } else if (tab === "artists") {
      loadArtists();
    }
  });
});

function formatRole(role) {
  return role.replace(/_/g, " ");
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
  if (!deleteUserModal.classList.contains("hidden"))
    closeModal("delete-user-modal");
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
                class="btn-icon btn-edit"
                data-user-id="${u.id}"
                title="Edit"
                ${editDisabled ? "disabled" : ""}
              ><i class="fa fa-pencil" aria-hidden="true"></i></button>
              <button
                type="button"
                class="btn-icon btn-icon-danger btn-delete"
                data-user-id="${u.id}"
                data-user-name="${escapeHtml(fullName)}"
                title="${isSelf ? "Cannot delete your own account" : "Delete"}"
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

createUserBtn.addEventListener("click", openCreateModal);

document.getElementById("users-table-body").addEventListener("click", (e) => {
  const editBtn = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

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
    gender: document.getElementById("user-gender").value || null,
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

async function loadArtists() {}

loadUsers(currentPage);
