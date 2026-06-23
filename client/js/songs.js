(async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  let artistId = auth.getArtistIdFromPage() || null;

const canViewArtistSongs =
  user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ARTIST_MANAGER;
const isArtistUser = user?.role === ROLES.ARTIST;
const canCreateSongs = isArtistUser;

if (isArtistUser && !user?.artist_id) {
  window.location.href = "profile-pending.html";
}

if (isArtistUser && user?.artist_id) {
  if (artistId && artistId !== user.artist_id) {
    window.location.replace(auth.getSongsPageUrl(user.artist_id));
  }
  artistId = user.artist_id;
}

const userNameEl = document.getElementById("user-name");
if (userNameEl && user) {
  userNameEl.textContent = `Hi ${user.first_name}`;
}

document.getElementById("logout-btn")?.addEventListener("click", () => {
  auth.logout();
});

const backLink = document.getElementById("back-to-artists");
const navbarBrand = document.getElementById("navbar-brand");
const songsPageTitle = document.getElementById("songs-page-title");
const songsPaginationEl = document.getElementById("songs-pagination");
const createSongBtn = document.getElementById("create-song-btn");
const songFormModal = document.getElementById("song-form-modal");
const songForm = document.getElementById("song-form");
const songFormError = document.getElementById("song-form-error");
const songFormSubmit = document.getElementById("song-form-submit");

if (canCreateSongs) {
  createSongBtn?.classList.remove("hidden");
}

if (canViewArtistSongs) {
  backLink?.classList.remove("hidden");
  if (navbarBrand) navbarBrand.href = "dashboard.html";
} else if (isArtistUser) {
  if (navbarBrand) navbarBrand.href = "songs.html";
  backLink?.classList.add("hidden");
}

backLink?.addEventListener("click", (e) => {
  e.preventDefault();
  if (window.history.length > 1) {
    history.back();
  } else {
    window.location.href = "dashboard.html?tab=artists";
  }
});

let currentPage = 1;

const songsPagination = paginationElement(songsPaginationEl, (page) =>
  loadSongs(page),
);

function formatGenre(genre) {
  if (!genre) return null;
  return genre.charAt(0).toUpperCase() + genre.slice(1);
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
  if (!songFormModal.classList.contains("hidden")) closeModal("song-form-modal");
});

function openCreateSongModal() {
  if (!canCreateSongs) return;

  songForm.reset();
  songFormError.textContent = "";
  openModal("song-form-modal");
}

function getSongFormData() {
  return {
    title: document.getElementById("song-title").value.trim(),
    album_name: document.getElementById("song-album").value.trim(),
    genre: document.getElementById("song-genre").value,
  };
}

createSongBtn?.addEventListener("click", openCreateSongModal);

songForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canCreateSongs) return;

  songFormError.textContent = "";
  songFormSubmit.disabled = true;

  try {
    const resolvedArtistId = await resolveArtistId();
    if (!resolvedArtistId) {
      songFormError.textContent = "Artist profile not found.";
      return;
    }

    await apiRequest(
      "POST",
      `/api/artists/${resolvedArtistId}/music`,
      getSongFormData(),
    );

    closeModal("song-form-modal");
    loadSongs(1);
  } catch (error) {
    songFormError.textContent = error.message;
  } finally {
    songFormSubmit.disabled = false;
  }
});

function renderSongsTable(songs) {
  const tbody = document.getElementById("songs-table-body");

  if (!songs.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="table-empty">No songs found.</td></tr>';
    return;
  }

  tbody.innerHTML = songs
    .map(
      (song) => `
        <tr>
          <td>${renderTruncated(song.title, DISPLAY_NAME_MAX)}</td>
          <td>${renderTruncated(song.album_name, DISPLAY_NAME_MAX) || "-"}</td>
          <td>${escapeHtml(formatGenre(song.genre)) || "-"}</td>
        </tr>
      `,
    )
    .join("");
}

async function resolveArtistId() {
  if (artistId) return artistId;

  if (isArtistUser) {
    try {
      const res = await apiRequest("GET", "/api/artists/me");
      artistId = res.data.id;
      auth.save(auth.getToken(), { ...user, artist_id: artistId });
      return artistId;
    } catch {
      auth.save(auth.getToken(), { ...user, artist_id: null });
      window.location.href = "profile-pending.html";
      return null;
    }
  }

  return null;
}

async function loadSongs(page = 1) {
  const tbody = document.getElementById("songs-table-body");
  const errorEl = document.getElementById("songs-error");
  errorEl.textContent = "";

  if (!canViewArtistSongs && !isArtistUser) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="table-empty">No permission to view songs.</td></tr>';
    songsPagination.hide();
    return;
  }

  currentPage = page;
  tbody.innerHTML =
    '<tr><td colspan="3" class="table-empty">Loading songs...</td></tr>';

  try {
    const resolvedArtistId = await resolveArtistId();

    if (!resolvedArtistId) {
      errorEl.textContent = "Artist not found.";
      tbody.innerHTML =
        '<tr><td colspan="3" class="table-empty">Artist profile not found.</td></tr>';
      songsPagination.hide();
      return;
    }

    const res = await apiRequest(
      "GET",
      `/api/artists/${resolvedArtistId}/music?page=${page}&limit=${PAGE_LIMIT}`,
    );

    songsPageTitle.textContent = `Songs — ${res.data.artist.name}`;
    document.title = `Songs — ${res.data.artist.name}`;
    renderSongsTable(res.data.songs);
    songsPagination.update(res.data.pagination);
  } catch (error) {
    errorEl.textContent = error.message;
    tbody.innerHTML =
      '<tr><td colspan="3" class="table-empty">Failed to load songs.</td></tr>';
    songsPagination.hide();
  }
}

loadSongs(currentPage);
})();
