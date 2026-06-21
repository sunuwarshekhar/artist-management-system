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

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const usersContent = document.getElementById("users-content");
const usersNoPermission = document.getElementById("users-no-permission");

//permission check here for users tab
const canViewUsers = user?.role === ROLES.SUPER_ADMIN;

if (!canViewUsers) {
  usersContent.classList.add("hidden");
  usersNoPermission.classList.remove("hidden");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    tabButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    tabPanels.forEach((panel) =>
      panel.classList.toggle("active", panel.id === `${tab}-panel`),
    );

    if (tab === "users") {
      loadUsers();
    } else if (tab === "artists") {
      loadArtists();
    }
  });
});

function formatRole(role) {
  return role.replace(/_/g, " ");
}

async function loadUsers() {
  if (!canViewUsers) return;

  const tbody = document.getElementById("users-table-body");
  const errorEl = document.getElementById("users-error");
  errorEl.textContent = "";
  tbody.innerHTML =
    '<tr><td colspan="4" class="table-empty">Loading users...</td></tr>';

  try {
    const res = await apiRequest("GET", "/api/users");
    const users = res.data.users;

    if (!users.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="table-empty">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
        <tr>
          <td>${u.first_name} ${u.last_name}</td>
          <td>${u.email}</td>
          <td>${formatRole(u.role)}</td>
          <td>${u.phone || "-"}</td>
        </tr>
      `,
      )
      .join("");
  } catch (error) {
    errorEl.textContent = error.message;
    tbody.innerHTML =
      '<tr><td colspan="4" class="table-empty">Failed to load users.</td></tr>';
  }
}

async function loadArtists() {}

if (canViewUsers) {
  loadUsers();
}
