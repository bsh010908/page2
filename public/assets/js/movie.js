const API_KEY = "dabb632914c69efca691e384dd571999"; // 주신 키
const grid = document.getElementById("grid");
const movieTitleInput = document.getElementById("movieTitle");
const movieGenreSelect = document.getElementById("movieGenre");
const searchBtn = document.getElementById("searchBtn");
const dataCount = document.getElementById("dataCount");

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
            url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`;
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

// 3️⃣ 카드 렌더링
function renderMovies(movies, genreId = "") {
    let filtered = genreId ? movies.filter(m => m.genre_ids.includes(Number(genreId))) : movies;

    grid.innerHTML = filtered.length
        ? filtered.map(movie => `
        <div class="movie-card">
            <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p>${movie.release_date || '개봉일 없음'}</p>
        </div>
    `).join('')
        : "<p>영화 정보를 찾을 수 없습니다.</p>";

    dataCount.textContent = `Total: ${filtered.length}`;
}

// 4️⃣ 검색 실행
async function searchMovies() {
    const query = movieTitleInput.value.trim();
    const genreId = movieGenreSelect.value;

    const movies = await fetchMovies(query);
    renderMovies(movies, genreId);
}

// 5️⃣ 초기 로딩
fetchGenres();
searchMovies();

// 6️⃣ 이벤트 바인딩
searchBtn.addEventListener("click", searchMovies);
movieTitleInput.addEventListener("input", searchMovies);
movieGenreSelect.addEventListener("change", searchMovies);
