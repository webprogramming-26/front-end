(() => {
  let status = "all";
  let pendingDelete = null;
  const rows = document.getElementById("listingRows");
  const message = document.getElementById("accountMessage");
  const profileDialog = document.getElementById("profileDialog");
  const deleteDialog = document.getElementById("deleteDialog");
  const profileForm = document.getElementById("profileForm");
  function announce(text) {
    message.textContent = text;
    message.hidden = false;
  }
  function showProfile() {
    const profile = getProfile();
    document.getElementById("profileName").textContent = profile.nickname;
    document.getElementById("profileDepartment").textContent =
      profile.college + "\n" + profile.dept;
  }
  function render() {
    const all = getMyProducts();
    const filtered = all.filter(
      (book) => status === "all" || book.status === status,
    );
    const filters = document.getElementById("listingFilters");
    filters.replaceChildren(
      ...Object.entries({ all: "전체", ...STATUS }).map(([value, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${label} ${value === "all" ? all.length : all.filter((book) => book.status === value).length}`;
        button.setAttribute("aria-pressed", String(value === status));
        button.onclick = () => {
          status = value;
          render();
          filters.querySelector(`[data-status="${value}"]`).focus();
        };
        button.dataset.status = value;
        return button;
      }),
    );
    rows.innerHTML = filtered
      .map((book) => {
        const id = escapeHTML(book.id),
          url = "detail.html?id=" + encodeURIComponent(book.id);
        return `<article class="listing-row" data-id="${id}"><div class="listing-thumb"><a href="${url}"><img src="${escapeHTML(productImages(book, IMG)[0])}" alt="${escapeHTML(book.title)}"></a><button type="button" class="like-btn${isFavorite(book.id) ? " liked" : ""}" data-product-id="${id}" aria-label="찜하기" aria-pressed="${isFavorite(book.id)}">${HEART}</button></div><div class="listing-info"><span class="listing-status ${book.status}">${STATUS[book.status]}</span><h3><a href="${url}">${escapeHTML(book.title)}</a></h3><p class="listing-price">${won(book.price)}</p><p class="muted">${escapeHTML(book.place)} · ${escapeHTML(productTime(book))}</p></div><div class="listing-controls"><select aria-label="${escapeHTML(book.title)} 거래 상태">${Object.entries(
          STATUS,
        )
          .map(
            ([key, label]) =>
              `<option value="${key}" ${key === book.status ? "selected" : ""}>${label}</option>`,
          )
          .join(
            "",
          )}</select><div class="listing-actions"><a href="sell.html?edit=${encodeURIComponent(book.id)}">수정</a><button type="button" class="text-button muted delete-listing">삭제</button></div></div></article>`;
      })
      .join("");
    document.getElementById("noListings").hidden = filtered.length > 0;
  }
  rows.addEventListener("change", (event) => {
    const row = event.target.closest(".listing-row");
    if (!row || event.target.tagName !== "SELECT") return;
    try {
      updateProduct(row.dataset.id, { status: event.target.value });
      announce("거래 상태를 변경했어요.");
    } catch {
      announce(
        "변경 내용을 저장하지 못했어요. 브라우저 저장 공간과 설정을 확인해 주세요.",
      );
    }
    render();
  });
  rows.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-listing");
    if (!button) return;
    pendingDelete = button.closest(".listing-row").dataset.id;
    document.getElementById("deleteName").textContent =
      getProduct(pendingDelete).title;
    deleteDialog.showModal();
  });
  document.getElementById("confirmDelete").onclick = () => {
    try {
      deleteProduct(pendingDelete);
      announce("판매글을 삭제했어요.");
      render();
    } catch {
      announce(
        "판매글을 삭제하지 못했어요. 브라우저 저장 설정을 확인해 주세요.",
      );
    }
    deleteDialog.close();
    document
      .getElementById("listingFilters")
      .querySelector('[aria-pressed="true"]')
      .focus();
  };
  document.getElementById("editProfile").onclick = () => {
    const profile = getProfile();
    Object.keys(profile).forEach(
      (key) => (profileForm.elements[key].value = profile[key]),
    );
    document.getElementById("profileError").hidden = true;
    profileDialog.showModal();
  };
  profileForm.onsubmit = (event) => {
    event.preventDefault();
    const profile = Object.fromEntries(
      [...new FormData(profileForm)].map(([key, value]) => [key, value.trim()]),
    );
    const error = document.getElementById("profileError");
    if (Object.values(profile).some((value) => !value)) {
      error.textContent = "공백만 입력할 수 없어요.";
      error.hidden = false;
      return;
    }
    try {
      localStorage.setItem("shungbook.profile", JSON.stringify(profile));
      showProfile();
      profileDialog.close();
      announce("프로필을 저장했어요.");
    } catch {
      error.textContent = "프로필을 저장하지 못했어요.";
      error.hidden = false;
    }
  };
  document
    .querySelectorAll("[data-close]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          document.getElementById(button.dataset.close).close()),
    );
  function info(text) {
    document.getElementById("infoText").textContent = text;
    document.getElementById("infoDialog").showModal();
  }
  document.getElementById("myChat").onclick = () =>
    info("채팅 기능은 아직 준비 중이에요.");
  document.getElementById("logout").onclick = () =>
    info(
      "현재는 로그인 없이 사용하는 데모예요. 로그아웃할 계정은 없으며, 판매글과 프로필은 이 브라우저에 보관됩니다.",
    );
  window.addEventListener("pageshow", () => {
    showProfile();
    render();
  });
  window.addEventListener("storage", () => {
    showProfile();
    render();
  });
  showProfile();
  render();
})();
