const apiKey = 'dabb632914c69efca691e384dd571999';
const calendarContainer = document.getElementById('calendar');

const calendar = (() => {
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let moviesByDate = {}; // { "2025-09-12": ["Movie Title", ...], ... }

    const fetchMovies = async () => {
        moviesByDate = {};
        try {
            const totalPages = 3; // 상위 3페이지까지 가져오기
            for (let page = 1; page <= totalPages; page++) {
                const response = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=ko-KR&page=${page}`);
                const data = await response.json();
                if (data && data.results) {
                    data.results.forEach(movie => {
                        if (movie.release_date) {
                            const dateKey = movie.release_date;
                            if (!moviesByDate[dateKey]) moviesByDate[dateKey] = [];
                            moviesByDate[dateKey].push(movie.title);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('영화 개봉일 불러오기 실패:', error);
        }
    };

    const renderCalendar = (month, year) => {
        calendarContainer.innerHTML = '';
        calendarContainer.className = 'w-full h-full mt-4';

        const header = document.createElement('div');
        header.className = 'calendar-header flex justify-between items-center py-2 p-2 bg-gray-100';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'bg-blue-500 text-white';
        prevBtn.innerHTML = "&lt;";
        prevBtn.onclick = () => changeMonth(-1);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'bg-blue-500 text-white';
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
        ['일','월','화','수','목','금','토'].forEach(d => {
            const div = document.createElement('div');
            div.className = 'day-header';
            div.innerText = d;
            daysOfWeek.appendChild(div);
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
            dateDiv.className = 'py-6 px-4 border cursor-pointer relative';
            dateDiv.innerHTML = `<div class="text-md absolute top-2 left-2">${day}</div>`;

            const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

            if (moviesByDate[dateKey]) {
                const movieList = document.createElement('ul');
                movieList.className = 'mt-4 text-left text-sm text-gray-800';
                moviesByDate[dateKey].forEach(title => {
                    const li = document.createElement('li');
                    li.innerText = `🎬 ${title}`;
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
