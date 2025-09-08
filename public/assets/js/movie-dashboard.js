// assets/js/movie-dashboard.js
const API_KEY = 'dabb632914c69efca691e384dd571999'; // TMDB API 키
const API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

async function loadMovies() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const movies = data.results;
        const workarea = document.getElementById('workarea');
        workarea.innerHTML = ''; // 기존 내용 제거

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'p-4 shadow-lg rounded-lg bg-white flex flex-col justify-between';
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <h5 class="text-lg font-semibold">${movie.title}</h5>
                    <i class="bx bx-film text-red-500 text-3xl"></i>
                </div>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="mt-2 rounded">
                <div class="flex items-center mt-4">
                    <h4 class="text-2xl font-bold me-2">${movie.vote_average}</h4>
                    <p class="text-green-500 text-sm font-medium">(${movie.vote_count} votes)</p>
                </div>
            `;
            workarea.appendChild(card);
        });
    } catch (error) {
        console.error('영화 정보 불러오기 실패', error);
    }
}

// 페이지 로드 시 영화 데이터 불러오기
document.addEventListener('DOMContentLoaded', loadMovies);
