// 검색 상태를 URL에 보존하여 새로고침·뒤로가기를 지원합니다.
(() => {
  const form = document.getElementById("filterForm");
  const college = form.elements.college;
  const dept = form.elements.dept;
  const sort = document.getElementById("searchSort");
  const error = document.getElementById("filterError");
  const params = new URLSearchParams(location.search);
  let query = params.get("q") || "";
  let currentPage = Math.max(1, Number(params.get("page")) || 1);
  let applied;
  const pageSize = 6;
  const colleges = [
    "AI대학",
    "IT대학",
    "인문대학",
    "경영대학",
    "자연과학대학",
    "공과대학",
    "법과대학",
    "사회과학대학",
    "경제통상대학",
    "자유전공학부",
    "교양",
  ];
  [...new Set([...colleges, ...getProducts().map((book) => book.college)])]
    .filter(Boolean)
    .forEach((name) => college.add(new Option(name, name)));
  function departments(selected = "") {
    const names = [
      ...new Set(
        getProducts()
          .filter((book) => !college.value || book.college === college.value)
          .map((book) => book.dept),
      ),
    ].filter(Boolean);
    dept.replaceChildren(
      new Option("전체 학과", ""),
      ...names.map((name) => new Option(name, name)),
    );
    dept.value = names.includes(selected) ? selected : "";
  }
  function readForm() {
    return {
      college: college.value,
      dept: dept.value,
      min: form.elements.min.value,
      max: form.elements.max.value,
      statuses: [...form.querySelectorAll('[name="status"]:checked')].map(
        (input) => input.value,
      ),
    };
  }
  function restore() {
    const state = new URLSearchParams(location.search);
    query = state.get("q") || "";
    college.value = state.get("college") || "";
    departments(state.get("dept") || "");
    form.elements.min.value = state.get("min") || "";
    form.elements.max.value = state.get("max") || "";
    form
      .querySelectorAll('[name="status"]')
      .forEach(
        (input) =>
          (input.checked =
            !state.has("status") ||
            state.get("status").split(",").includes(input.value)),
      );
    sort.value = ["low", "high"].includes(state.get("sort"))
      ? state.get("sort")
      : "latest";
    currentPage = Math.max(1, Math.floor(Number(state.get("page")) || 1));
    applied = readForm();
    document.querySelector(".search-bar input").value = query;
  }
  function writeURL(push = true) {
    const state = new URLSearchParams();
    if (query) state.set("q", query);
    for (const key of ["college", "dept", "min", "max"])
      if (applied[key]) state.set(key, applied[key]);
    if (applied.statuses.length !== 3)
      state.set("status", applied.statuses.join(","));
    if (sort.value !== "latest") state.set("sort", sort.value);
    if (currentPage > 1) state.set("page", currentPage);
    const url = location.pathname + (state.size ? "?" + state : "");
    history[push ? "pushState" : "replaceState"](null, "", url);
  }
  function render() {
    const normalized = query.trim().toLocaleLowerCase();
    const list = getProducts().filter(
      (book) =>
        (!normalized ||
          [
            book.title,
            book.dept,
            book.college,
            book.subject,
            book.description,
          ].some((value) =>
            String(value || "")
              .toLocaleLowerCase()
              .includes(normalized),
          )) &&
        (!applied.college || book.college === applied.college) &&
        (!applied.dept || book.dept === applied.dept) &&
        applied.statuses.includes(book.status) &&
        book.price >= Number(applied.min || 0) &&
        (applied.max === "" || book.price <= Number(applied.max)),
    );
    list.sort(
      sort.value === "low"
        ? (a, b) => a.price - b.price
        : sort.value === "high"
          ? (a, b) => b.price - a.price
          : (a, b) => productTimestamp(b) - productTimestamp(a),
    );
    const pageCount = Math.ceil(list.length / pageSize);
    currentPage = Math.min(currentPage, pageCount || 1);
    document.getElementById("resultsTitle").textContent = query
      ? `“${query}” 검색 결과`
      : applied.college || "전체 전공책";
    document.getElementById("resultCount").textContent =
      `검색 결과 ${list.length}개`;
    document.getElementById("searchGrid").innerHTML = list
      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
      .map(cardHTML)
      .join("");
    document.getElementById("noResults").hidden = list.length > 0;
    const tags = [
      applied.college,
      applied.dept,
      applied.statuses.includes("done") ? "거래완료 포함" : "거래완료 제외",
      applied.min || applied.max
        ? `${won(Number(applied.min || 0))} ~ ${applied.max ? won(Number(applied.max)) : "제한 없음"}`
        : "",
    ].filter(Boolean);
    document.getElementById("activeFilters").replaceChildren(
      ...tags.map((text) => {
        const tag = document.createElement("span");
        tag.className = "filter-tag";
        tag.textContent = text;
        return tag;
      }),
    );
    const pagination = document.getElementById("pagination");
    pagination.replaceChildren();
    if (pageCount > 1) {
      const pages = [
        {
          label: "‹",
          number: currentPage - 1,
          disabled: currentPage === 1,
          aria: "이전 페이지",
        },
      ];
      for (
        let number = Math.max(1, currentPage - 2);
        number <= Math.min(pageCount, currentPage + 2);
        number++
      )
        pages.push({ label: String(number), number, aria: `${number}페이지` });
      pages.push({
        label: "›",
        number: currentPage + 1,
        disabled: currentPage === pageCount,
        aria: "다음 페이지",
      });
      pages.forEach(({ label, number, disabled, aria }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = Boolean(disabled);
        button.setAttribute("aria-label", aria);
        if (number === currentPage) button.setAttribute("aria-current", "page");
        button.onclick = () => {
          currentPage = number;
          render();
          writeURL();
          document
            .getElementById("resultsTitle")
            .scrollIntoView({ block: "start" });
        };
        pagination.append(button);
      });
    }
  }
  college.addEventListener("change", () => departments());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    error.hidden = true;
    const next = readForm();
    if (next.max !== "" && Number(next.min || 0) > Number(next.max)) {
      error.textContent = "최고 가격은 최저 가격 이상으로 입력해 주세요.";
      error.hidden = false;
      return;
    }
    applied = next;
    currentPage = 1;
    render();
    writeURL();
  });
  function reset(clearQuery = false) {
    form.reset();
    departments();
    error.hidden = true;
    if (clearQuery) query = "";
    applied = readForm();
    currentPage = 1;
    sort.value = "latest";
    document.querySelector(".search-bar input").value = query;
    render();
    writeURL();
  }
  document.getElementById("resetFilters").onclick = () => reset();
  document.getElementById("clearSearch").onclick = () => reset(true);
  sort.onchange = () => {
    currentPage = 1;
    render();
    writeURL();
  };
  document.querySelector(".search-bar").addEventListener("submit", (event) => {
    event.preventDefault();
    query = event.currentTarget.elements.q.value.trim();
    currentPage = 1;
    render();
    writeURL();
  });
  window.addEventListener("popstate", () => {
    restore();
    render();
  });
  window.addEventListener("pageshow", () => {
    render();
  });
  window.addEventListener("storage", () => render());
  restore();
  render();
})();
