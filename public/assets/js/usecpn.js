
// 🔹 LocalStorage에서 쿠폰 발행 데이터 불러오기
const issuedCoupons = JSON.parse(localStorage.getItem("issuedCoupons") || "[]");

const mockUsageData = issuedCoupons.map((coupon, i) => {
  const originalPrice = Math.floor((Math.random() * 40 + 10)) * 1000;

  const couponDiscount = coupon.discountType === "amount"
    ? coupon.discountValue
    : Math.floor(originalPrice * (coupon.discountValue / 100) / 1000) * 1000;

  const finalPrice = originalPrice - couponDiscount;

  return {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    usedBy: ["홍길동", "김민지", "이영희", "박준형", "최지우"][i % 5],
    usedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
    site: ["강남캠퍼스", "신촌캠퍼스", "부산지점", "대전지점"][i % 4],
    originalPrice,
    couponDiscount,
    finalPrice
  };
});



document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  const gridWrapper = document.createElement("div");
  gridWrapper.className = "w-full";

  const buttonRow = document.createElement("div");
  buttonRow.className = "flex justify-end mb-2 mt-2";
  const newBtn = document.createElement("button");
  newBtn.textContent = "시뮬레이션";
  newBtn.onclick = function () {
    openSimulationModal();
  };


  newBtn.className = "bg-blue-500 text-white px-4 rounded leading-relaxed";
  newBtn.style.paddingTop = "0.2rem";
  newBtn.style.paddingBottom = "1.2rem";


  buttonRow.appendChild(newBtn);

  const gridDiv = document.getElementById("myGrid");
  gridDiv.className = "ag-theme-alpine";
  gridDiv.style.height = "700px";
  gridDiv.style.width = "100%";

  gridWrapper.appendChild(buttonRow);
  gridWrapper.appendChild(gridDiv);
  content.appendChild(gridWrapper);
  const columnDefs = [
    { headerName: "ID", field: "id" },
    { headerName: "Code", field: "code" },
    { headerName: "쿠폰명", field: "name" ,      pinned: 'left',},
    { headerName: "유형", field: "discountType" },
    { headerName: "할인값", field: "discountValue" },
    { headerName: "사용자", field: "usedBy" },
    { headerName: "사용일시", field: "usedAt", filter: 'agDateColumnFilter' },
    { headerName: "사용 지점", field: "site" },
    { headerName: "원가", field: "originalPrice", valueFormatter: currencyFormatter },
    { headerName: "쿠폰할인", field: "couponDiscount", valueFormatter: currencyFormatter },
    { headerName: "최종 결제금액", field: "finalPrice", valueFormatter: currencyFormatter }
  ];


  const gridOptions = {
    columnDefs: columnDefs,
    rowData: mockUsageData,
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true
    },
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    animateRows: true
  };

  new agGrid.createGrid(gridDiv, gridOptions);

  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) breadcrumb.textContent = "쿠폰 사용 내역";
});

function openSimulationModal() {
  const coupons = JSON.parse(localStorage.getItem("issuedCoupons") || "[]");

  const modal = document.createElement("div");
  modal.className = "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50";

  const content = document.createElement("div");
  content.className = "bg-white p-6 rounded shadow-md w-96 relative";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold";
  closeBtn.onclick = () => modal.remove();

  const title = document.createElement("h2");
  title.textContent = "쿠폰 적용 시뮬레이션";
  title.className = "text-xl font-bold mb-4";

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.placeholder = "원가 (₩)";
  priceInput.className = "w-full border p-2 mb-2 rounded";

  const couponSelect = document.createElement("select");
  couponSelect.className = "w-full border p-2 mb-4 rounded";
  couponSelect.style.height = "42px";
  couponSelect.style.padding = "0.5rem";
  couponSelect.style.border = "1px solid #ccc";
  couponSelect.style.marginBottom = "0.5rem";
  couponSelect.style.borderRadius = "0.375rem";

  coupons.forEach(coupon => {
    const opt = document.createElement("option");
    opt.value = coupon.id;
    opt.textContent = `${coupon.name} (${coupon.discountType === 'amount' ? '₩' + coupon.discountValue : coupon.discountValue + '%'})`;
    couponSelect.appendChild(opt);
  });

  const resultBox = document.createElement("div");
  resultBox.className = "mt-4 bg-gray-100 p-4 rounded hidden"; // 초기 숨김

  const calculateBtn = document.createElement("button");
  calculateBtn.textContent = "계산하기";
  calculateBtn.className = "w-full bg-green-500 text-white py-2 rounded mt-2";
  calculateBtn.style.paddingTop = "0.2rem";
  calculateBtn.style.paddingBottom = "1.2rem";
  calculateBtn.onclick = () => {
    const originalPrice = parseInt(priceInput.value);
    if (isNaN(originalPrice) || originalPrice <= 0) {
      alert("올바른 원가를 입력해주세요.");
      return;
    }

    const selectedCoupon = coupons.find(c => c.id === couponSelect.value);
    if (!selectedCoupon) return;

    let discount = 0;
    if (selectedCoupon.discountType === "amount") {
      discount = selectedCoupon.discountValue;
    } else {
      discount = Math.floor(originalPrice * (selectedCoupon.discountValue / 100) / 1000) * 1000;
    }

    const finalPrice = originalPrice - discount;

    resultBox.innerHTML = `
      <h3 class="font-bold mb-2">📋 견적서</h3>
      <p><strong>쿠폰명:</strong> ${selectedCoupon.name}</p>
      <p><strong>원가:</strong> ₩${originalPrice.toLocaleString()}</p>
      <p><strong>할인금액:</strong> ₩${discount.toLocaleString()}</p>
      <p><strong>최종 결제금액:</strong> ₩${finalPrice.toLocaleString()}</p>
    `;
    resultBox.classList.remove("hidden");
  };

  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(priceInput);
  content.appendChild(couponSelect);
  content.appendChild(calculateBtn);
  content.appendChild(resultBox);
  modal.appendChild(content);
  document.body.appendChild(modal);
}


function currencyFormatter(params) {
  return '₩' + params.value.toLocaleString();
}


breadcrumb.textContent = "쿠폰사용"