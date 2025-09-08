const apiKey = "dabb632914c69efca691e384dd571999";
const movieSelect = document.getElementById("movie-select");
const logContainer = document.getElementById("log-container");
const graphBox = document.getElementById("graph-box");
let movieChart;

// 기본 영화 ID (귀멸의 칼날)
const defaultMovieId = 635302;

// 인기 영화 목록
async function fetchMovies() {
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ko-KR&page=1`);
    const data = await res.json();
    data.results.forEach(movie => {
        const option = document.createElement("option");
        option.value = movie.id;
        option.textContent = movie.title;
        movieSelect.appendChild(option);
    });

    // 초기 선택 영화
    movieSelect.value = defaultMovieId;
    const defaultMovieData = await fetchMovieDetails(defaultMovieId);
    renderChart(defaultMovieData);
    renderMovieCard(defaultMovieData);
}

// 선택한 영화 데이터
async function fetchMovieDetails(movieId) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=ko-KR`);
    const data = await res.json();
    return data;
}

// 차트 그리기
function renderChart(movieData) {
    const ctx = document.getElementById("movieChart").getContext("2d");

    if (movieChart) movieChart.destroy();

    graphBox.style.backgroundImage = `url(https://image.tmdb.org/t/p/w500${movieData.poster_path})`;

    movieChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['평점', '인기', '예산(M$)', '수익(M$)'],
            datasets: [{
                label: movieData.title,
                data: [
                    movieData.vote_average,
                    movieData.popularity,
                    movieData.budget / 1000000,
                    movieData.revenue / 1000000
                ],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 박스 크기에 맞춤
            plugins: {
                legend: { display: false },
                title: { display: true, text: `${movieData.title} 데이터` }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// 영화 정보 카드
function renderMovieCard(movieData) {
    const existingCard = document.querySelector(".movie-card");
    if (existingCard) existingCard.remove();

    const card = document.createElement("div");
    card.classList.add("movie-card");

    const img = document.createElement("img");
    img.src = `https://image.tmdb.org/t/p/w300${movieData.poster_path}`;
    img.alt = movieData.title;

    const info = document.createElement("div");
    info.classList.add("movie-info");

    const title = document.createElement("h3");
    title.textContent = movieData.title;

    const release = document.createElement("p");
    release.textContent = `개봉일: ${movieData.release_date}`;

    const genre = document.createElement("p");
    genre.textContent = `장르: ${movieData.genres.map(g => g.name).join(', ')}`;

    info.append(title, release, genre);
    card.append(img, info);
    logContainer.appendChild(card);
}

// 드롭다운 이벤트
movieSelect.addEventListener("change", async () => {
    const movieId = movieSelect.value;
    if (!movieId) return;
    const movieData = await fetchMovieDetails(movieId);
    renderChart(movieData);
    renderMovieCard(movieData);
});

// 초기화
fetchMovies();
