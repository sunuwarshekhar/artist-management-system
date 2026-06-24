(async () => {
  const user = await auth.requireAuth();
  if (!user) return;

  let artistId = auth.getArtistIdFromPage() || null;

  const canViewArtistSongs =
    user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ARTIST_MANAGER;
  const isArtistUser = user?.role === ROLES.ARTIST;
  const canManageSongs = isArtistUser;

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
  const songFormTitle = document.getElementById("song-form-title");
  const songFormError = document.getElementById("song-form-error");
  const songFormSubmit = document.getElementById("song-form-submit");
  const deleteSongModal = document.getElementById("delete-song-modal");
  const deleteSongMessage = document.getElementById("delete-song-message");
  const deleteSongError = document.getElementById("delete-song-error");
  const deleteSongConfirm = document.getElementById("delete-song-confirm");

  const songsColspan = canManageSongs ? 4 : 3;

  if (canManageSongs) {
    createSongBtn?.classList.remove("hidden");
    document.getElementById("songs-actions-col")?.classList.remove("hidden");
    document.getElementById("songs-actions-th")?.classList.remove("hidden");
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
  let songFormMode = "create";
  let editingSongId = null;
  let deletingSongId = null;

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
    if (!songFormModal.classList.contains("hidden"))
      closeModal("song-form-modal");
    if (!deleteSongModal.classList.contains("hidden"))
      closeModal("delete-song-modal");
  });

  function openCreateSongModal() {
    if (!canManageSongs) return;

    songFormMode = "create";
    editingSongId = null;
    songFormTitle.textContent = "Create Song";
    songFormSubmit.textContent = "Create";
    songForm.reset();
    songFormError.textContent = "";
    openModal("song-form-modal");
  }

  function openEditSongModal(song) {
    if (!canManageSongs) return;

    songFormMode = "edit";
    editingSongId = song.id;
    songFormTitle.textContent = "Edit Song";
    songFormSubmit.textContent = "Save";
    songForm.reset();
    songFormError.textContent = "";
    document.getElementById("song-title").value = song.title || "";
    document.getElementById("song-album").value = song.album_name || "";
    document.getElementById("song-genre").value = song.genre || "";
    openModal("song-form-modal");
  }

  function openDeleteSongModal(songId, songTitle) {
    if (!canManageSongs) return;

    deletingSongId = songId;
    deleteSongMessage.textContent = `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`;
    deleteSongError.textContent = "";
    openModal("delete-song-modal");
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
    if (!canManageSongs) return;

    songFormError.textContent = "";
    songFormSubmit.disabled = true;

    try {
      const resolvedArtistId = await resolveArtistId();
      if (!resolvedArtistId) {
        songFormError.textContent = "Artist profile not found.";
        return;
      }

      const body = getSongFormData();

      if (songFormMode === "create") {
        await apiRequest(
          "POST",
          `/api/artists/${resolvedArtistId}/music`,
          body,
        );
      } else {
        await apiRequest(
          "PUT",
          `/api/artists/${resolvedArtistId}/music/${editingSongId}`,
          body,
        );
      }

      closeModal("song-form-modal");
      loadSongs(songFormMode === "create" ? 1 : currentPage);
    } catch (error) {
      songFormError.textContent = error.message;
    } finally {
      songFormSubmit.disabled = false;
    }
  });

  deleteSongConfirm?.addEventListener("click", async () => {
    if (!canManageSongs || !deletingSongId) return;

    deleteSongError.textContent = "";
    deleteSongConfirm.disabled = true;

    try {
      const resolvedArtistId = await resolveArtistId();
      if (!resolvedArtistId) {
        deleteSongError.textContent = "Artist profile not found.";
        return;
      }

      await apiRequest(
        "DELETE",
        `/api/artists/${resolvedArtistId}/music/${deletingSongId}`,
      );

      closeModal("delete-song-modal");
      loadSongs(songsPagination.getPageAfterDelete());
    } catch (error) {
      deleteSongError.textContent = error.message;
    } finally {
      deleteSongConfirm.disabled = false;
      deletingSongId = null;
    }
  });

  document
    .getElementById("songs-table-body")
    ?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".btn-edit");
      const deleteBtn = e.target.closest(".btn-delete");

      if (editBtn?.dataset.songId) {
        openEditSongModal({
          id: Number(editBtn.dataset.songId),
          title: editBtn.dataset.songTitle,
          album_name: editBtn.dataset.songAlbum,
          genre: editBtn.dataset.songGenre,
        });
      }

      if (deleteBtn?.dataset.songId) {
        openDeleteSongModal(
          Number(deleteBtn.dataset.songId),
          deleteBtn.dataset.songTitle,
        );
      }
    });

  function renderSongsTable(songs) {
    const tbody = document.getElementById("songs-table-body");

    if (!songs.length) {
      tbody.innerHTML = `<tr><td colspan="${songsColspan}" class="table-empty">No songs found.</td></tr>`;
      return;
    }

    tbody.innerHTML = songs
      .map((song) => {
        const actionsCell = canManageSongs
          ? `
          <td class="col-actions-cell">
            <div class="table-actions">
              <button
                type="button"
                class="btn-icon btn-edit"
                data-song-id="${song.id}"
                data-song-title="${escapeHtml(song.title)}"
                data-song-album="${escapeHtml(song.album_name || "")}"
                data-song-genre="${escapeHtml(song.genre || "")}"
                title="Edit"
              ><i class="fa-solid fa-pencil" aria-hidden="true"></i></button>
              <button
                type="button"
                class="btn-icon btn-icon-danger btn-delete"
                data-song-id="${song.id}"
                data-song-title="${escapeHtml(song.title)}"
                title="Delete"
              ><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
            </div>
          </td>
        `
          : "";

        return `
        <tr>
          <td>${renderTruncated(song.title, DISPLAY_NAME_MAX)}</td>
          <td>${renderTruncated(song.album_name, DISPLAY_NAME_MAX) || "-"}</td>
          <td>${escapeHtml(formatGenre(song.genre)) || "-"}</td>
          ${actionsCell}
        </tr>
      `;
      })
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
      tbody.innerHTML = `<tr><td colspan="${songsColspan}" class="table-empty">No permission to view songs.</td></tr>`;
      songsPagination.hide();
      return;
    }

    currentPage = page;
    tbody.innerHTML = `<tr><td colspan="${songsColspan}" class="table-empty">Loading songs...</td></tr>`;

    try {
      const resolvedArtistId = await resolveArtistId();

      if (!resolvedArtistId) {
        errorEl.textContent = "Artist not found.";
        tbody.innerHTML = `<tr><td colspan="${songsColspan}" class="table-empty">Artist profile not found.</td></tr>`;
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
      tbody.innerHTML = `<tr><td colspan="${songsColspan}" class="table-empty">Failed to load songs.</td></tr>`;
      songsPagination.hide();
    }
  }

  loadSongs(currentPage);
})();
