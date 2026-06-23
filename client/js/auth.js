const auth = {
  save(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  logout() {
    this.clearSession();
    window.location.href = "index.html";
  },

  async requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "index.html";
      return null;
    }

    try {
      const res = await apiRequest("GET", "/api/auth/me");
      this.save(this.getToken(), res.data);
      return res.data;
    } catch {
      this.clearSession();
      window.location.href = "index.html";
      return null;
    }
  },

  getPostLoginRedirect(user) {
    if (user?.role === ROLES.ARTIST) {
      if (user.artist_id) {
        return this.getSongsPageUrl(user.artist_id);
      }
      return "profile-pending.html";
    }
    return "dashboard.html";
  },

  getSongsPageUrl(artistId) {
    return `songs.html#artist_id=${encodeURIComponent(artistId)}`;
  },

  getArtistIdFromPage() {
    const searchId = new URLSearchParams(window.location.search).get(
      "artist_id",
    );
    if (searchId) return Number(searchId);

    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;

    const hashParams = new URLSearchParams(hash);
    const hashId = hashParams.get("artist_id");
    return hashId ? Number(hashId) : null;
  },
};
