function paginationElement(root, onPageChange) {
  const prevBtn = root.querySelector("[data-pagination-prev]");
  const nextBtn = root.querySelector("[data-pagination-next]");
  const infoEl = root.querySelector("[data-pagination-info]");
  let state = null;

  prevBtn.addEventListener("click", () => {
    if (state && state.page > 1) {
      onPageChange(state.page - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (state && state.page < state.totalPages) {
      onPageChange(state.page + 1);
    }
  });

  function shouldShow(pagination) {
    if (!pagination) return false;
    const total = Number(pagination.total);
    const limit = Number(pagination.limit);
    return Number.isFinite(total) && Number.isFinite(limit) && total > limit;
  }

  return {
    update(pagination) {
      state = pagination;

      if (!shouldShow(pagination)) {
        root.classList.add("hidden");
        return;
      }

      root.classList.remove("hidden");
      infoEl.textContent = `${pagination.page} / ${pagination.totalPages}`;
      prevBtn.disabled = pagination.page <= 1;
      nextBtn.disabled = pagination.page >= pagination.totalPages;
    },

    hide() {
      state = null;
      root.classList.add("hidden");
    },

    getPageAfterDelete() {
      if (!state) return 1;

      const itemsOnPage = state.total - (state.page - 1) * state.limit;
      return state.page > 1 && itemsOnPage === 1 ? state.page - 1 : state.page;
    },
  };
}
