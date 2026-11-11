const sellForm = document.getElementById("sellForm");
const photoInput = document.getElementById("bookPhotos");
const photoList = document.getElementById("photoList");
const addPhotos = document.getElementById("addPhotos");
const photoCount = document.getElementById("photoCount");
const photoError = document.getElementById("photoError");
const submitError = document.getElementById("submitError");
const publishProduct = document.getElementById("publishProduct");
const departmentSuggestions = document.getElementById("departmentSuggestions");
const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const photos = [];
let preparingPhotos = false;

function setError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function renderPhotos() {
  photoList.querySelectorAll(".photo-preview").forEach((preview) => preview.remove());
  photos.forEach((source, index) => {
    const preview = document.createElement("div");
    preview.className = "photo-preview";
    const image = document.createElement("img");
    image.src = source;
    image.alt = "등록 사진 " + (index + 1);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "photo-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "사진 " + (index + 1) + " 삭제");
    remove.addEventListener("click", () => {
      photos.splice(index, 1);
      setError(photoError, "");
      renderPhotos();
      (photoList.querySelectorAll(".photo-remove")[index] || addPhotos).focus();
    });
    preview.append(image, remove);
    photoList.append(preview);
  });
  photoCount.textContent = photos.length + " / " + MAX_PHOTOS;
  addPhotos.disabled = preparingPhotos || photos.length >= MAX_PHOTOS;
}

async function preparePhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}

addPhotos.addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", async () => {
  const selected = Array.from(photoInput.files);
  if (!selected.length) return;
  preparingPhotos = true;
  addPhotos.disabled = true;
  publishProduct.disabled = true;
  const errors = new Set();
  try {
    for (const file of selected) {
      if (photos.length >= MAX_PHOTOS) {
        errors.add("사진은 최대 5장까지 등록할 수 있어요.");
        break;
      }
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_FILE_SIZE) {
        errors.add("5MB 이하의 JPG 또는 PNG 사진을 선택해 주세요.");
        continue;
      }
      try {
        photos.push(await preparePhoto(file));
      } catch {
        errors.add("열 수 없는 사진이 있어요. 다른 파일을 선택해 주세요.");
      }
    }
  } finally {
    photoInput.value = "";
    preparingPhotos = false;
    publishProduct.disabled = false;
    renderPhotos();
    setError(photoError, [...errors].join(" "));
  }
});

sellForm.elements.college.addEventListener("change", () => {
  const college = sellForm.elements.college.value;
  const departments = new Set(getProducts().filter((book) => book.college === college).map((book) => book.dept));
  departmentSuggestions.replaceChildren(...[...departments].map((name) => new Option(name)));
  sellForm.elements.dept.value = "";
});

sellForm.addEventListener("input", (event) => {
  if (typeof event.target.setCustomValidity === "function") event.target.setCustomValidity("");
  setError(submitError, "");
});

sellForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (preparingPhotos) return;
  setError(submitError, "");
  if (!photos.length) {
    setError(photoError, "책 사진을 한 장 이상 추가해 주세요.");
    addPhotos.focus();
    return;
  }

  const fields = Object.fromEntries(new FormData(sellForm));
  for (const [key, value] of Object.entries(fields)) fields[key] = value.trim();

  for (const key of ["title", "dept", "description"]) {
    if (!fields[key]) {
      sellForm.elements[key].setCustomValidity("내용을 입력해 주세요.");
      sellForm.elements[key].reportValidity();
      return;
    }
  }

  fields.price = Number(fields.price);
  fields.photos = [...photos];
  publishProduct.disabled = true;
  let product;
  try {
    product = saveProduct(fields);
  } catch (error) {
    setError(submitError, error.name === "QuotaExceededError"
      ? "브라우저 저장 공간이 부족해요. 사진 수를 줄인 뒤 다시 시도해 주세요."
      : "판매글을 저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요.");
    publishProduct.disabled = false;
    return;
  }
  location.assign("detail.html?id=" + encodeURIComponent(product.id));
});
