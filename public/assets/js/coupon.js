// ✅ 쿠폰 대시보드 전용 모드 (HTML 구성에 맞게 차트만 표시)

const mockLectures = [
  { id: 'L01', name: '프론트엔드 개발 입문' },
  { id: 'L02', name: '백엔드 실전 프로젝트' },
  { id: 'L03', name: 'UI/UX 디자인 마스터' },
  { id: 'L04', name: 'React로 웹 만들기' },
  { id: 'L05', name: 'Node.js API 서버' },
  { id: 'L06', name: 'SQL 고급 질의' },
  { id: 'L07', name: 'AWS 클라우드 실습' },
  { id: 'L08', name: '데이터베이스 설계' },
  { id: 'L09', name: '모바일 앱 개발' },
  { id: 'L10', name: '머신러닝 입문' }
];

const linkedCoupons = JSON.parse(localStorage.getItem("linkedCoupons") || '{}');
const lectureStats = {};
const issueCounts = {};
const useCounts = {};

document.addEventListener("DOMContentLoaded", () => {
  updateLectureStats();
  renderAllCharts();
});

function updateLectureStats() {
  Object.keys(linkedCoupons).forEach(lecId => {
    const list = linkedCoupons[lecId] || [];
    let totalOriginal = 0, totalDiscount = 0, totalFinal = 0;

    list.forEach(coupon => {
      const original = coupon.originalPrice || 0;
      const discount = coupon.discountType === 'amount'
        ? coupon.discountValue
        : Math.floor(original * (coupon.discountValue / 100));
      const final = original - discount;

      totalOriginal += original;
      totalDiscount += discount;
      totalFinal += final;
    });

    lectureStats[lecId] = { totalOriginal, totalDiscount, totalFinal };
    issueCounts[lecId] = list.length;
    useCounts[lecId] = Math.floor(list.length * 0.7); // 예시: 70% 사용 처리
  });
}

function getLectureName(id) {
  const lec = mockLectures.find(l => l.id === id);
  return lec ? lec.name : id;
}

function renderAllCharts() {
  const categories = Object.keys(lectureStats).map(getLectureName);
  const original = Object.values(lectureStats).map(v => v.totalOriginal);
  const discount = Object.values(lectureStats).map(v => v.totalDiscount);
  const final = Object.values(lectureStats).map(v => v.totalFinal);

  const issued = Object.keys(issueCounts).map(key => issueCounts[key]);
  const used = Object.keys(useCounts).map(key => useCounts[key]);

  const barOptions = {
    chart: { type: 'bar', height: 300, stacked: true },
    series: [
      { name: '원가합계', data: original },
      { name: '할인합계', data: discount },
      { name: '실구매합계', data: final }
    ],
    xaxis: { categories }
  };

  const pieOptions = {
    chart: { type: 'pie', height: 300 },
    series: used,
    labels: categories
  };

  const lineOptions = {
    chart: { type: 'line', height: 300 },
    series: [
      { name: '발행건수', data: issued },
      { name: '사용건수', data: used }
    ],
    xaxis: { categories }
  };

  const chart1 = document.querySelector("#chart-bar");
  const chart2 = document.querySelector("#chart-pie");
  const chart3 = document.querySelector("#chart-line");

  if (chart1 && window.ApexCharts) new ApexCharts(chart1, barOptions).render();
  if (chart2 && window.ApexCharts) new ApexCharts(chart2, pieOptions).render();
  if (chart3 && window.ApexCharts) new ApexCharts(chart3, lineOptions).render();
}

breadcrumb.textContent = "쿠폰 Dashboard"