const ROOT = document.currentScript.dataset.root || "";
const ROUND_HEADER = document.currentScript.hasAttribute("data-round-header");
const IMG = ROOT + "assets/images/";
const PAGE = ROOT + "pages/";

const HEART = `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>`;

function won(n) {
  return n.toLocaleString() + "원";
}

// header
function renderHeader() {
  const el = document.getElementById("header");
  if (!el) return;
  el.innerHTML = `
    <header class="header">
      <div class="container header-inner">
        <a href="${ROOT}index.html" class="logo">
          <img src="${IMG}logo.svg" alt="슝책마켓" />
        </a>

        <form class="search-bar" action="${PAGE}search.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input type="text" name="q" aria-label="전공책 검색" placeholder="어떤 전공책을 찾으세요?" />
        </form>

        <nav class="nav">
          <a href="${PAGE}chat.html" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            채팅하기
          </a>
          <span class="nav-divider"></span>
          <a href="${PAGE}sell.html" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M12 11v6M9 14h6" />
            </svg>
            판매하기
          </a>
          <span class="nav-divider"></span>
          <a href="${PAGE}mypage.html" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            마이
          </a>
        </nav>
      </div>
    </header>`;

  if (ROUND_HEADER) {
    const slots = el.querySelectorAll(".search-bar svg, .nav-item svg");
    ["search", "chat", "sell", "my"].forEach((name, index) => {
      const icon = document.createElement("img");
      icon.src = IMG + "round03/" + name + ".svg";
      icon.alt = "";
      slots[index].replaceWith(icon);
    });
  }
}

// footer
function renderFooter() {
  const el = document.getElementById("footer");
  if (!el) return;
  el.innerHTML = `
    <footer class="footer">
      <div class="container footer-inner">
        <img src="${IMG}logo.svg" alt="슝책마켓" class="footer-logo" />
        <p class="footer-text">숭실대학교 웹프로그래밍 팀 프로젝트 26조</p>
        ${ROUND_HEADER ? "" : `<p class="footer-copy">© 2026 Team 26. All rights reserved.</p>`}
      </div>
    </footer>`;
}

// 상품 작성 폼의 입력을 HTML 텍스트와 속성에 안전하게 삽입합니다.
function escapeHTML(value) {
  const escapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (character) => escapes[character]);
}

// 책 카드
function cardHTML(b) {
  const liked = isFavorite(b.id);
  return `
    <article class="book-card ${b.status}">
      <a href="${PAGE}detail.html?id=${encodeURIComponent(b.id)}" class="book-link">
        <div class="book-thumb">
          <img src="${escapeHTML(productImages(b, IMG)[0])}" alt="${escapeHTML(b.title)}" />
        </div>
        <span class="badge ${b.status}">${STATUS[b.status]}</span>
        <h3 class="book-title">${escapeHTML(b.title)}</h3>
        <p class="book-price">${won(b.price)}</p>
        <p class="book-meta">${escapeHTML(b.dept)} · ${escapeHTML(productTime(b))}</p>
        <p class="book-meta">${escapeHTML(b.place)}</p>
      </a>
      <button type="button" class="like-btn${liked ? " liked" : ""}" data-product-id="${escapeHTML(b.id)}" aria-label="찜하기" aria-pressed="${liked}">${HEART}</button>
    </article>`;
}

// 책 목록 렌더링
function initBookList() {
  const grid = document.querySelector(".book-grid");
  if (!grid) return;

  const chips = document.querySelectorAll(".chip");
  const includeDone = document.getElementById("includeDone");
  const sortSelect = document.getElementById("sortSelect");
  const emptyMsg = document.querySelector(".empty-msg");

  let college = "전체";

  function render() {
    const list = getProducts().filter(
      (b) =>
        (college === "전체" || b.college === college) &&
        (includeDone.checked || b.status !== "done")
    );

    if (sortSelect.value === "low") list.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "high") list.sort((a, b) => b.price - a.price);

    grid.innerHTML = list.map(cardHTML).join("");
    emptyMsg.hidden = list.length > 0;
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      college = chip.dataset.college;
      render();
    });
  });

  includeDone.addEventListener("change", render);
  sortSelect.addEventListener("change", render);
  window.addEventListener("pageshow", render);
  render();
}

// 학과 더보기
function initMoreButton() {
  const moreBtn = document.getElementById("moreBtn");
  if (!moreBtn) return;

  const extraChips = document.querySelectorAll(".chip.extra");
  let opened = false;

  moreBtn.addEventListener("click", () => {
    opened = !opened;

    extraChips.forEach((chip) => {
      chip.hidden = !opened;
    });

    moreBtn.classList.toggle("open", opened);
    moreBtn.firstChild.textContent = opened ? "접기 " : "학과 더보기 ";

    // 접을 때 숨겨진 칩이 선택돼 있으면 전체로 되돌리기
    const active = document.querySelector(".chip.extra.active");
    if (!opened && active) {
      document.querySelector('.chip[data-college="전체"]').click();
    }
  });
}

// 찜 버튼
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".like-btn");
  if (!btn) return;
  try {
    const liked = toggleFavorite(btn.dataset.productId);
    btn.classList.toggle("liked", liked);
    btn.setAttribute("aria-pressed", String(liked));
  } catch {
    console.warn("관심 상품을 저장하지 못했습니다.");
  }
});

// 실행
renderHeader();
renderFooter();
initBookList();
initMoreButton();