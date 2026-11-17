// 공통 상품 데이터와 브라우저 저장
const STATUS = { selling: "판매중", reserved: "예약중", done: "거래완료" };

const books = [
  { id: 1, title: "HTML5 웹 프로그래밍·자바 세트", price: 18000, dept: "AI소프트웨어학부", college: "AI대학", time: "5분 전", place: "정보과학관 직거래", status: "selling", img: "book_01.webp" },
  { id: 2, title: "운영체제 · 아주 쉬운 세 가지 이야기", price: 22000, dept: "컴퓨터학부", college: "IT대학", time: "18분 전", place: "중앙도서관 직거래", status: "selling", img: "book_02.webp" },
  { id: 3, title: "개발자를 위한 머신러닝&딥러닝", price: 15000, dept: "AI소프트웨어학부", college: "AI대학", time: "32분 전", place: "정보과학관 직거래", status: "reserved", img: "book_03.webp" },
  { id: 4, title: "4차 산업혁명 시대의 이산수학", price: 12000, dept: "수학과", college: "자연과학대학", time: "1시간 전", place: "베어드홀 직거래", status: "selling", img: "book_04.webp" },
  { id: 5, title: "그림으로 배우는 데이터베이스", price: 20000, dept: "컴퓨터학부", college: "IT대학", time: "2시간 전", place: "정보과학관 직거래", status: "selling", img: "book_05.webp" },
  { id: 6, title: "핵심 미분적분학 9판", price: 14000, dept: "수학과", college: "자연과학대학", time: "3시간 전", place: "베어드홀 직거래", status: "done", img: "book_06.webp" },
  { id: 7, title: "컴퓨터·개발 전공서적 일괄", price: 19000, dept: "컴퓨터학부", college: "IT대학", time: "38분 전", place: "중앙도서관 직거래", status: "selling", img: "book_07.webp" },
  { id: 8, title: "처음 시작하는 파이썬 2판", price: 13000, dept: "AI소프트웨어학부", college: "AI대학", time: "5분 전", place: "정보과학관 직거래", status: "selling", img: "book_08.webp" },
];


const PRODUCT_STORAGE_KEY = "shungbook.products";
const FAVORITE_STORAGE_KEY = "shungbook.favorites";

const sampleDetails = [
  {
    detailTitle: "HTML5 웹 프로그래밍 입문\n자바가 보이는 그림책 · 2권 세트",
    condition: "필기 조금 · 찢김 없음",
    edition: "4판 · 개정증보판",
    subject: "웹프로그래밍",
    place: "정보과학관 1층 로비",
    seller: "책읽는숭실인",
    description: "HTML5 웹 프로그래밍 입문과 자바가 보이는 그림책을 함께 판매합니다.\n책 구성과 표지는 사진을 확인해 주세요.\n거래 장소와 시간은 채팅으로 조율합니다."
  }
];

function readStoredArray(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error("저장 데이터 형식이 올바르지 않습니다.");
  return records;
}

function getProducts() {
  let saved = [];
  try {
    saved = readStoredArray(PRODUCT_STORAGE_KEY);
  } catch (error) {
    console.warn("저장한 판매글을 불러오지 못했습니다.", error);
  }
  const samples = books.map((book, index) => ({ ...book, ...sampleDetails[index] }));
  let changes = [];
  try { changes = readStoredArray("shungbook.productChanges"); } catch (error) { console.warn(error); }
  return [...saved.slice().reverse(), ...samples].map((book) => {
    const change = changes.find((item) => String(item.id) === String(book.id));
    const demo = String(book.id) === "5" ? { status: "reserved" } : {};
    return { ...book, ...demo, ...change };
  }).filter((book) => !book.deleted);
}

function getProduct(id) {
  return getProducts().find((book) => String(book.id) === String(id));
}

function saveProduct(fields) {
  const products = readStoredArray(PRODUCT_STORAGE_KEY);
  const product = {
    ...fields,
    id: `local-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
    createdAt: new Date().toISOString(),
    status: "selling",
    seller: "내 판매글"
  };
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify([...products, product]));
  return product;
}

function productImages(book, imageRoot) {
  const photos = Array.isArray(book.photos)
    ? book.photos.filter((photo) => typeof photo === "string" && photo.startsWith("data:image/jpeg;base64,"))
    : [];
  if (photos.length) return photos;
  return book.img ? [`${imageRoot}books/${encodeURIComponent(book.img)}`] : [];
}

function productTime(book) {
  if (!book.createdAt) return book.time;
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(book.createdAt)) / 60000));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / 1440)}일 전`;
}

function isFavorite(id) {
  try {
    return readStoredArray(FAVORITE_STORAGE_KEY).includes(String(id));
  } catch {
    return false;
  }
}

function toggleFavorite(id) {
  const favorites = readStoredArray(FAVORITE_STORAGE_KEY);
  const key = String(id);
  const liked = !favorites.includes(key);
  localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(liked
    ? [...favorites, key]
    : favorites.filter((favorite) => favorite !== key)));
  return liked;
}


// 서버 없는 데모: 샘플 1·5·6과 이 브라우저에서 작성한 글이 내 판매글입니다.
function isMyProduct(book) {
  return Boolean(book) && (["1", "5", "6"].includes(String(book.id)) || String(book.id).startsWith("local-"));
}
function getMyProducts() { return getProducts().filter(isMyProduct); }
function updateProduct(id, fields) {
  const book = getProduct(id);
  if (!isMyProduct(book)) throw new Error("수정할 수 없는 판매글입니다.");
  const allowed = ["title", "price", "college", "dept", "condition", "edition", "subject", "place", "description", "photos", "status", "deleted"];
  const patch = Object.fromEntries(Object.entries(fields).filter(([key]) => allowed.includes(key)));
  if (patch.status && !Object.hasOwn(STATUS, patch.status)) throw new Error("올바르지 않은 거래 상태입니다.");
  if (patch.title !== undefined) patch.detailTitle = patch.title;
  // 한 키에 한 번 쓰므로 저장 용량 오류가 나면 기존 데이터가 유지됩니다.
  const changes = readStoredArray("shungbook.productChanges");
  const previous = changes.find((item) => String(item.id) === String(id)) || {};
  const next = { ...previous, ...patch, id: book.id };
  localStorage.setItem("shungbook.productChanges", JSON.stringify([...changes.filter((item) => String(item.id) !== String(id)), next]));
  return { ...book, ...next };
}
function deleteProduct(id) { return updateProduct(id, { deleted: true }); }
function getProfile() {
  const fallback = { nickname: "슝슝이1", college: "AI대학", dept: "AI소프트웨어학부" };
  try {
    const profile = JSON.parse(localStorage.getItem("shungbook.profile"));
    return Object.fromEntries(Object.entries(fallback).map(([key, value]) => [key, typeof profile?.[key] === "string" ? profile[key] : value]));
  } catch { return fallback; }
}
function productTimestamp(book) {
  if (book.createdAt) return Date.parse(book.createdAt) || 0;
  const match = (book.time || "").match(/(\d+)(분|시간|일)/);
  const minutes = match ? Number(match[1]) * ({ "분": 1, "시간": 60, "일": 1440 }[match[2]]) : 0;
  // 예시 글은 고정 기준 시각을 사용하여 새 글보다 뒤에 배치합니다.
  return Date.UTC(2026, 9, 23, 12) - minutes * 60000;
}
