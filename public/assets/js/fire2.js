document.addEventListener('DOMContentLoaded', () => {
    loadInspectionHistory();
  
    document.getElementById('download-report').addEventListener('click', () => {
      generateReport();
    });
  });
  
  let inspectionGrid = null;

  // 점검 이력 불러오기
  async function loadInspectionHistory() {

    const mockData = [
        {
          "date": "2024-04-25",
          "inspector": "홍길동",
          "building": "강남타워",
          "address": "서울 강남구 테헤란로",
          "summary": "소화기 2개 미비, 감지기 정상"
        },
        {
          "date": "2024-03-20",
          "inspector": "김영희",
          "building": "부산빌딩",
          "address": "부산 해운대구",
          "summary": "비상조명 1개 고장"
        }
      ];

    try {

      // TUI Grid 초기화 또는 갱신
  if (inspectionGrid) {
    inspectionGrid.resetData(mockData);
  } else {
    inspectionGrid = new tui.Grid({
      el: document.getElementById('inspection-grid'),
      data: mockData,
      columns: [
        { header: '점검일자', name: 'date' },
        { header: '점검자', name: 'inspector' },
        { header: '건물명', name: 'building' },
        { header: '주소', name: 'address' },
        { header: '결과 요약', name: 'summary' }
      ],
      scrollX: false,
      scrollY: true,
      bodyHeight: 300
    });
  }

    } catch (err) {
      console.error('점검 이력 불러오기 실패:', err);
    }
  }
  
  function generateReport() {
    const gridData = inspectionGrid.getData();
    const tableHTML = gridData.map(row => `
      <tr>
        <td>${row.date}</td>
        <td>${row.inspector}</td>
        <td>${row.building}</td>
        <td>${row.address}</td>
        <td>${row.summary}</td>
      </tr>
    `).join('');
  
    const reportHTML = `
      <html>
        <head>
          <title>점검 보고서</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
  
            body {
              font-family: sans-serif;
            }
  
            h2 {
              text-align: center;
              margin-bottom: 20px;
            }
  
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }
  
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
  
            thead {
              display: table-header-group;
            }
  
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          <h2>점검 이력 보고서</h2>
          <table>
            <thead>
              <tr>
                <th>점검일자</th>
                <th>점검자</th>
                <th>건물명</th>
                <th>주소</th>
                <th>결과 요약</th>
              </tr>
            </thead>
            <tbody>
              ${tableHTML}
            </tbody>
          </table>
        </body>
      </html>
    `;
  
    // 현재 페이지 백업
    const originalBody = document.body.innerHTML;
  
    // 보고서 내용으로 화면 교체
    document.body.innerHTML = reportHTML;
  
    window.print();
  
    // 인쇄 후 원래 화면 복원
    setTimeout(() => {
      document.body.innerHTML = originalBody;
      location.reload(); // TUI Grid를 포함한 모듈 다시 로드
    }, 500);
  }
  
  breadcrumb.textContent = "점검이력PDF";