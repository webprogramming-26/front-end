function renderProductDetail() {
  const id = new URLSearchParams(location.search).get("id");
  const book = getProduct(id);

  if (!book) {
    document.getElementById("missingProduct").hidden = false;
    return;
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  const title = book.detailTitle || book.title;
  document.title = book.title + " - 슝책마켓";
  setText("productTitle", title);
  setText("productPrice", won(book.price));
  setText("productMeta", [book.dept, productTime(book)].filter(Boolean).join(" · "));
  setText("productCondition", book.condition || "미입력");
  setText("productEdition", book.edition || "미입력");
  setText("productSubject", book.subject || "미입력");
  setText("productPlace", book.place);
  setText("productSeller", book.seller || "판매자");
  setText("sellerDepartment", book.dept);
  setText("productDescription", book.description || "판매자가 등록한 책 소개가 없습니다.");

  const badge = document.getElementById("productStatus");
  badge.textContent = STATUS[book.status];
  badge.classList.add(book.status);

  const photo = document.getElementById("productPhoto");
  photo.classList.toggle("sample-photo", Boolean(book.img));
  const thumbs = document.getElementById("photoThumbnails");
  const images = productImages(book, IMG);
  function selectPhoto(index) {
    photo.src = images[index];
    photo.alt = book.title + " 사진 " + (index + 1);
    thumbs.querySelectorAll("button").forEach((button, position) => {
      button.setAttribute("aria-pressed", String(position === index));
    });
  }
  if (images.length > 1) {
    images.forEach((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "상품 사진 " + (index + 1) + " 보기");
      const thumbnail = document.createElement("img");
      thumbnail.src = src;
      thumbnail.alt = "";
      button.append(thumbnail);
      button.addEventListener("click", () => selectPhoto(index));
      thumbs.append(button);
    });
  }
  if (images.length) selectPhoto(0);
  else photo.hidden = true;

  const favorite = document.getElementById("favoriteProduct");
  function showFavorite(liked) {
    favorite.setAttribute("aria-pressed", String(liked));
    favorite.classList.toggle("liked", liked);
    favorite.textContent = liked ? "♥ 관심" : "♡ 관심";
  }
  showFavorite(isFavorite(book.id));
  favorite.addEventListener("click", () => {
    try {
      showFavorite(toggleFavorite(book.id));
    } catch {
      setText("detailActionMessage", "관심 상품을 저장하지 못했어요.");
    }
  });

  const contact = document.getElementById("contactSeller");
  if (book.status === "done" || book.id.toString().startsWith("local-")) {
    contact.removeAttribute("href");
    contact.setAttribute("aria-disabled", "true");
    contact.classList.add("disabled");
    setText("detailActionMessage", book.status === "done"
      ? "거래가 완료된 상품이에요."
      : "내가 등록한 판매글이에요.");
  } else {
    contact.href = "chat.html?productId=" + encodeURIComponent(book.id);
  }

  const related = document.getElementById("relatedProducts");
  const template = document.getElementById("relatedProductTemplate");
  getProducts().filter((item) => item.id !== book.id).slice(0, 3).forEach((item) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.href = "detail.html?id=" + encodeURIComponent(item.id);
    card.querySelector("img").src = productImages(item, IMG)[0];
    card.querySelector("h3").textContent = item.title;
    card.querySelector(".related-price").textContent = won(item.price);
    card.querySelector(".detail-meta").textContent = item.place;
    related.append(card);
  });

  document.getElementById("productDetail").hidden = false;
}

renderProductDetail();
