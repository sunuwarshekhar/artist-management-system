(async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  if (user.role !== ROLES.ARTIST) {
    window.location.href = "dashboard.html";
    return;
  }

  if (user.artist_id) {
    window.location.href = auth.getSongsPageUrl(user.artist_id);
    return;
  }

  const userNameEl = document.getElementById("user-name");
  if (userNameEl) {
    userNameEl.textContent = `Hi ${user.first_name}`;
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    auth.logout();
  });
})();
