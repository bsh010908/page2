const API_KEY = "dabb632914c69efca691e384dd571999"; // 주신 키
const grid = document.getElementById("grid");
const movieTitleInput = document.getElementById("movieTitle");
const movieGenreSelect = document.getElementById("movieGenre");
const searchBtn = document.getElementById("searchBtn");
const dataCount = document.getElementById("dataCount");

// 🟡 상세 패널 참조
const detailPanel = document.getElementById("movieDetail");

let genres = {};

// 1️⃣ 장르 정보 가져오기
async function fetchGenres() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=ko-KR`);
    const data = await res.json();
    genres = data.genres.reduce((acc, genre) => {
      acc[genre.id] = genre.name;
      return acc;
    }, {});

    // 장르 선택 옵션 추가
    data.genres.forEach(g => {
      const option = document.createElement("option");
      option.value = g.id;
      option.textContent = g.name;
      movieGenreSelect.appendChild(option);
    });
  } catch (err) {
    console.error("장르 정보를 불러올 수 없습니다.", err);
  }
}

// 2️⃣ 영화 데이터 가져오기
async function fetchMovies(query = "") {
  try {
    let url;
    if (query) {
      // 제목 검색
      url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}&include_adult=false`;
    } else {
      // 제목 없으면 현재 상영 중인 영화 가져오기
      url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=ko-KR&page=1`;
    }

    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("영화 정보를 불러올 수 없습니다.", err);
    return [];
  }
}

// 🟡 영화 상세 가져오기
async function fetchMovieDetail(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=ko-KR&append_to_response=videos,credits`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`상세 조회 실패: ${r.status}`);
  return await r.json();
}

// 🟡 패널: 스켈레톤
function openDetailSkeleton() {
  detailPanel.classList.add("open");
  detailPanel.innerHTML = `
    <div class="mdp-header">
      <div class="mdp-skel poster"></div>
      <div style="flex:1;">
        <div class="mdp-skel line w60"></div>
        <div class="mdp-skel line w40" style="margin-top:8px;"></div>
      </div>
      <button class="mdp-close" title="닫기" aria-label="닫기">✕</button>
    </div>
    <div class="mdp-skel block"></div>
  `;
}

// 🟡 패널: 렌더
function renderDetail(m) {
  const year = (m.release_date || "").slice(0,4);
  const rating = m.vote_average ? m.vote_average.toFixed(1) : null;
  const runtime = m.runtime ? `${m.runtime}분` : null;
  const poster = m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : "https://via.placeholder.com/342x513?text=No+Image";
  const chipGenres = (m.genres || []).map(g => `<span class="mdp-chip">${g.name}</span>`).join("");

  const meta = [year, rating ? `★ ${rating}` : null, runtime].filter(Boolean).join(" · ");

  const trailer = m.videos?.results?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  const trailerBtn = trailer ? `<button class="mdp-btn" data-action="play" data-key="${trailer.key}">예고편 재생</button>` : "";

  detailPanel.classList.add("open");
  detailPanel.innerHTML = `
    <div class="mdp-header">
      <img class="mdp-poster" src="${poster}" alt="${m.title}">
      <div style="flex:1;">
        <div class="mdp-title">${m.title}</div>
        <div class="mdp-meta">${meta}</div>
        <div class="mdp-chips">${chipGenres}</div>
      </div>
      <button class="mdp-close" title="닫기" aria-label="닫기">✕</button>
    </div>

    <div class="mdp-overview">${m.overview || "줄거리 정보가 없습니다."}</div>

    <div class="mdp-actions">
      ${trailerBtn}
      <a class="mdp-btn secondary" target="_blank" href="https://www.themoviedb.org/movie/${m.id}?language=ko-KR">TMDB 열기</a>
    </div>
  `;
}

// 🟡 패널: 버튼 핸들 (예고편 토글/닫기)
detailPanel.addEventListener("click", (e) => {
  const btn = e.target.closest("button, a");
  if (!btn) return;

  if (btn.classList.contains("mdp-close")) {
    detailPanel.classList.remove("open");
    detailPanel.innerHTML = "";
    return;
  }

  if (btn.dataset.action === "play") {
    const key = btn.dataset.key;
    // 이미 iframe 있으면 토글
    const hasIframe = detailPanel.querySelector("iframe");
    if (hasIframe) {
      hasIframe.remove();
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.className = "mdp-iframe";
    iframe.src = `https://www.youtube.com/embed/${key}`;
    iframe.allowFullscreen = true;
    detailPanel.appendChild(iframe);
  }
});

// 3️⃣ 카드 렌더링
function renderMovies(movies, genreId = "") {
  let filtered = genreId ? movies.filter(m => m.genre_ids.includes(Number(genreId))) : movies;

  grid.innerHTML = filtered.length
    ? filtered.map(movie => `
      <div class="movie-card" data-id="${movie.id}" tabindex="0" aria-label="${movie.title} 상세 보기">
        <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <p>${movie.release_date || '개봉일 없음'}</p>
      </div>
    `).join('')
    : "<p>영화 정보를 찾을 수 없습니다.</p>";

  dataCount.textContent = `Total: ${filtered.length}`;
}

// 🟡 카드 클릭 → 우측 패널 열기 (이벤트 위임)
grid.addEventListener("click", async (e) => {
  const card = e.target.closest(".movie-card");
  if (!card) return;
  const id = card.getAttribute("data-id");
  try {
    openDetailSkeleton();
    const detail = await fetchMovieDetail(id);
    renderDetail(detail);
  } catch (err) {
    detailPanel.classList.add("open");
    detailPanel.innerHTML = `<div style="padding:10px;">❗ 상세 정보를 불러오지 못했습니다.</div>`;
    console.error(err);
  }
});
// 키보드 접근성(Enter/Space)
grid.addEventListener("keydown", async (e) => {
  if (!["Enter"," "].includes(e.key)) return;
  const card = e.target.closest(".movie-card");
  if (!card) return;
  e.preventDefault();
  const id = card.getAttribute("data-id");
  try {
    openDetailSkeleton();
    const detail = await fetchMovieDetail(id);
    renderDetail(detail);
  } catch (err) {
    detailPanel.classList.add("open");
    detailPanel.innerHTML = `<div style="padding:10px;">❗ 상세 정보를 불러오지 못했습니다.</div>`;
    console.error(err);
  }
});

// 4️⃣ 검색 실행
async function searchMovies() {
  const query = movieTitleInput.value.trim();
  const genreId = movieGenreSelect.value;

  const movies = await fetchMovies(query);
  // 🟡 새 검색 시 패널 닫기
  detailPanel.classList.remove("open");
  detailPanel.innerHTML = "";
  renderMovies(movies, genreId);
}

// 5️⃣ 초기 로딩
fetchGenres();
searchMovies();

// 6️⃣ 이벤트 바인딩
searchBtn.addEventListener("click", searchMovies);
movieTitleInput.addEventListener("input", searchMovies);
movieGenreSelect.addEventListener("change", searchMovies);
