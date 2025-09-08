// calendar.js
const calendar = (() => {
    const calendarContainer = document.getElementById('calendar');
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let tasks = {}; // 날짜별 영화 정보를 저장

    // TMDB API 키
    const TMDB_API_KEY = 'dabb632914c69efca691e384dd571999';
    const TMDB_API_URL = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=ko-KR&page=1`;

    // 영화 데이터 가져오기
    const fetchMovies = async () => {
        try {
            const response = await fetch(TMDB_API_URL);
            const data = await response.json();

            tasks = {}; // 초기화
            data.results.forEach(movie => {
                if (movie.release_date) {
                    const dateKey = movie.release_date; // YYYY-MM-DD
                    if (!tasks[dateKey]) tasks[dateKey] = [];
                    tasks[dateKey].push(movie.title);
                }
            });
        } catch (error) {
            console.error('영화 개봉일 불러오기 실패:', error);
        }
    };

    // 달력 렌더링
    const renderCalendar = (month, year) => {
        calendarContainer.innerHTML = '';
        calendarContainer.className = 'w-full h-full mt-4';

        const header = document.createElement('div');
        header.className = 'calendar-header flex justify-between items-center py-2 p-2 bg-gray-100';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'bg-blue-500 text-white px-2';
        prevBtn.innerHTML = "&lt;";
        prevBtn.onclick = () => changeMonth(-1);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'bg-blue-500 text-white px-2';
        nextBtn.innerHTML = "&gt;";
        nextBtn.onclick = () => changeMonth(1);

        const title = document.createElement('div');
        title.className = 'text-base text-gray-600';
        title.innerText = `${year}년 ${month + 1}월`;

        header.appendChild(prevBtn);
        header.appendChild(title);
        header.appendChild(nextBtn);

        const daysOfWeek = document.createElement('div');
        daysOfWeek.className = 'grid grid-cols-7 text-center';
        ['일', '월', '화', '수', '목', '금', '토'].forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-header';
            dayDiv.innerText = day;
            daysOfWeek.appendChild(dayDiv);
        });

        const dates = document.createElement('div');
        dates.className = 'grid grid-cols-7 text-center relative';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'py-4';
            dates.appendChild(blank);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'py-6 px-4 border relative text-left';
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateDiv.innerHTML = `<div class="text-md font-bold absolute top-2 left-2">${day}</div>`;

            if (tasks[dateKey]) {
                const movieList = document.createElement('ul');
                movieList.className = 'mt-4 text-sm text-gray-800';
                tasks[dateKey].forEach(title => {
                    const li = document.createElement('li');
                    li.innerText = title;
                    movieList.appendChild(li);
                });
                dateDiv.appendChild(movieList);
            }

            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateDiv.classList.add('bg-gray-100');
            }

            dates.appendChild(dateDiv);
        }

        calendarContainer.appendChild(header);
        calendarContainer.appendChild(daysOfWeek);
        calendarContainer.appendChild(dates);
    };

    const changeMonth = (delta) => {
        currentMonth += delta;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    };

    return {
        init: async () => {
            await fetchMovies();
            renderCalendar(currentMonth, currentYear);
        }
    };
})();

window.onload = () => {
    calendar.init();
};
