
function openTab(evt, tabName) {
    const tabs = document.querySelectorAll('.tablinks');
    const contents = document.querySelectorAll('.tab-content');
    const grids = ['initialGrid', 'operationGrid', 'generalGrid', 'unitGrid'];

    // 탭 콘텐츠 전환
    contents.forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // 탭 버튼 스타일 전환
    tabs.forEach(tab => {
        tab.classList.remove('bg-white', 'text-blue-600', 'font-semibold', 'shadow-sm');
        tab.classList.add('hover:bg-white', 'hover:text-blue-600', 'hover:font-semibold');
    });

    const activeBtn = Array.from(tabs).find(btn => btn.textContent.includes(tabLabelKor(tabName)));
    if (activeBtn) {
        activeBtn.classList.add('bg-white', 'text-blue-600', 'font-semibold', 'shadow-sm');
        activeBtn.classList.remove('hover:bg-white', 'hover:text-blue-600', 'hover:font-semibold');
    }

    loadTab(tabName);

    // ✅ 그리드 보이기/숨기기 처리
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = id === (tabName + 'Grid') ? 'block' : 'none';
        }
    });

    // ✅ 그리드는 탭 전환 시 최초 1번만 생성되게 처리
    if (!document.getElementById(tabName + 'Grid').dataset.gridInit) {
        loadGrid(tabName);
        document.getElementById(tabName + 'Grid').dataset.gridInit = 'true';
    }
}


// 탭명에 맞는 한글 텍스트 (버튼 텍스트와 매칭용)
function tabLabelKor(tabKey) {
    return {
        initial: '최초점검',
        operation: '작동점검',
        general: '종합점검',
        unit: '세대점검'
    }[tabKey] || '';
}


function loadTab(tab) {
    const c = document.getElementById(tab);
    c.innerHTML = '';
    switch (tab) {
        case 'initial': renderInitial(c); break;
        case 'operation': renderOperation(c); break;
        case 'general': renderGeneral(c); break;
        case 'unit': renderUnit(c); break;
    }
}

function renderInitial(c) {
    c.innerHTML = `
      <h2 class="text-xl font-semibold">최초점검</h2>
      <label>건물명: <input type="text" class="border"></label>
      <label>주소: <input type="text" class="border"></label>
      <label>점검일자: <input type="date" class="border"></label>
      <label>점검자 구분: 
        <select class="border">
          <option>관계인</option>
          <option>소방안전관리자</option>
          <option>소방시설관리업자</option>
        </select>
      </label>
      <div class="section-title">점검인력</div>
      <table><thead><tr><th>성명</th><th>자격</th><th>자격번호</th><th>참여일</th></tr></thead><tbody>
      <tr><td><input class="border"></td><td><input class="border"></td><td><input class="border"></td><td><input type="date" class="border"></td></tr>
      </tbody></table>
      <button class="bg-blue-500 text-white px-4  rounded mt-4" onclick="alert('최초점검 저장')">저장</button>
    `;
    
}

function renderOperation(c) {
    c.innerHTML = `
      <h2 class="text-xl font-semibold">작동점검</h2>
      <label>점검 시작일: <input type="date" class="border"></label>
      <label>점검 종료일: <input type="date" class="border"></label>
      <div class="section-title">설비 작동 상태</div>
      <table><thead><tr><th>설비명</th><th>설치 위치</th><th>점검결과</th><th>비고</th></tr></thead><tbody>
      <tr><td>비상방송설비</td><td><input class="border"></td><td><select class="border"><option>○</option><option>×</option><option>/</option></select></td><td><input class="border"></td></tr>
      </tbody></table>
      <button class="bg-blue-500 text-white px-4  rounded mt-4" onclick="alert('작동점검 저장')">저장</button>
    `;
    
}

function renderGeneral(c) {
    c.innerHTML = `
      <h2 class="text-xl font-semibold">종합점검</h2>
      <label><input type="checkbox"> 최초점검 포함 여부</label>
      <label>점검기간: <input type="date" class="border"> ~ <input type="date" class="border"></label>
      <div class="section-title">점검 항목</div>
      <table><thead><tr><th>설비</th><th>점검결과</th><th>조치계획</th></tr></thead><tbody>
      <tr><td>스프링클러설비</td><td><select class="border"><option>○</option><option>×</option><option>/</option></select></td><td><textarea class="border"></textarea></td></tr>
      </tbody></table>
      <button class="bg-blue-500 text-white px-4  rounded mt-4" onclick="alert('종합점검 저장')">저장</button>
    `;
    
}

function renderUnit(c) {
    c.innerHTML = `
      <h2 class="text-xl font-semibold">세대점검</h2>
      <label>세대번호: <input type="text" class="border"></label>
      <table><thead><tr><th>점검항목</th><th>점검결과</th></tr></thead><tbody>
      <tr><td>감지기 작동</td><td><select class="border"><option>양호</option><option>불량</option><option>해당없음</option></select></td></tr>
      <tr><td>비상조명등</td><td><select class="border"><option>양호</option><option>불량</option><option>해당없음</option></select></td></tr>
      </tbody></table>
      <button class="bg-blue-500 text-white px-4  rounded mt-4" onclick="alert('세대점검 저장')">저장</button>
    `;
    
}


function loadGrid(tab) {
    const gridData = {
        initial: Array.from({ length: 20 }, (_, i) => ({
            건물명: `빌딩 ${i + 1}`,
            주소: `서울 ${['강남구', '서초구', '용산구', '마포구'][i % 4]}`,
            점검일자: `2024-01-${String(i + 1).padStart(2, '0')}`,
            점검자: ['홍길동', '김영희', '이철수', '박영수'][i % 4]
        })),
        operation: Array.from({ length: 20 }, (_, i) => ({
            설비명: ['감지기', '스프링클러', '소화기', '비상방송'][i % 4],
            설치위치: `${i + 1}층 복도`,
            점검결과: ['○', '×', '/'][i % 3],
            비고: i % 2 === 0 ? '정상' : ''
        })),
        general: Array.from({ length: 20 }, (_, i) => ({
            설비: ['스프링클러', '감지기', '비상벨'][i % 3],
            점검결과: ['○', '×', '/'][i % 3],
            조치계획: i % 2 === 0 ? '정상' : '정비 예정'
        })),
        unit: Array.from({ length: 20 }, (_, i) => ({
            세대번호: `${100 + i + 1}호`,
            감지기작동: ['양호', '불량', '해당없음'][i % 3],
            비상조명등: ['양호', '불량', '해당없음'][2 - (i % 3)]
        }))
    };
    const columnDefs = {
        initial: [
            { name: '건물명', header: '건물명' },
            { name: '주소', header: '주소' },
            { name: '점검일자', header: '점검일자' },
            { name: '점검자', header: '점검자' }
        ],
        operation: [
            { name: '설비명', header: '설비명' },
            { name: '설치위치', header: '설치위치' },
            { name: '점검결과', header: '점검결과' },
            { name: '비고', header: '비고' }
        ],
        general: [
            { name: '설비', header: '설비' },
            { name: '점검결과', header: '점검결과' },
            { name: '조치계획', header: '조치계획' }
        ],
        unit: [
            { name: '세대번호', header: '세대번호' },
            { name: '감지기작동', header: '감지기작동' },
            { name: '비상조명등', header: '비상조명등' }
        ]
    };

    // 기존 그리드 제거 (중복 생성 방지)
    const gridEl = document.getElementById(tab + 'Grid');
    if (!gridEl) return;

    // 이전 내용 제거
    gridEl.innerHTML = '';

    // 새 그리드 생성
    new tui.Grid({
        el: gridEl,
        data: gridData[tab],
        columns: columnDefs[tab],
        bodyHeight: 300,
        scrollX: false,
        scrollY: true
    });
}

window.openTab = openTab;


breadcrumb.textContent = "소방점검관리";


document.addEventListener('DOMContentLoaded', () => {
    openTab(null, 'initial');
});