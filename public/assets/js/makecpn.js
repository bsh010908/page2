document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  // 버튼과 그리드를 담을 컨테이너 생성
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "flex flex-col w-full";

  // 버튼 영역: flex-end로 정렬
  const buttonRow = document.createElement("div");
  buttonRow.className = "flex justify-end mb-2 mt-2";

  const newBtn = document.createElement("button");
  newBtn.textContent = "신규 발행";
  newBtn.onclick = function () { openCouponModal(); };

  newBtn.className = "bg-blue-500 text-white px-4 rounded leading-relaxed";
  newBtn.style.paddingTop = "0.2rem";
  newBtn.style.paddingBottom = "1.2rem";


  buttonRow.appendChild(newBtn);

  // 그리드 영역
  const gridDiv = document.getElementById("myGrid");
  gridDiv.className = "ag-theme-alpine";
  gridDiv.style.height = "700px";
  gridDiv.style.width = "100%";

  // 요소 재구성
  gridWrapper.appendChild(buttonRow);
  gridWrapper.appendChild(gridDiv);
  content.appendChild(gridWrapper);
  const columnDefs = [
    { headerName: "ID", field: "id" },
    { headerName: "Code", field: "code" },
    { headerName: "Name", field: "name" },
    { headerName: "Type", field: "discountType" },
    { headerName: "Value", field: "discountValue" },
    { headerName: "발급일", field: "issuedAt", filter: 'agDateColumnFilter' },
    { headerName: "발행건수", field: "issueCount" },
    { headerName: "사용건수", field: "useCount" },
    {
      headerName: "수정",
      field: "edit",
      pinned: 'right',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      cellRenderer: function (params) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
    
        const btn = document.createElement("button");
        btn.textContent = "수정";
        btn.className = "text-white bg-blue-500 px-2 rounded disabled:opacity-50";
        btn.style.paddingTop = "0px";
        btn.style.paddingBottom = "40px";
    
        const isDisabled = params.data.issueCount > 0;
        btn.disabled = isDisabled;
    
        if (!isDisabled) {
          btn.onclick = function () {
            openCouponModal(params.data);
          };
        }else{
          btn.classList.add('cursor-not-allowed');
        }
    
        wrapper.appendChild(btn);
        return wrapper;
      }
    },
    {
      headerName: "삭제",
      field: "delete",
      pinned: 'right',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      cellRenderer: function (params) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
    
        const btn = document.createElement("button");
        btn.textContent = "삭제";
        btn.className = "text-white bg-red-500 px-2 rounded disabled:opacity-50";
        btn.style.paddingTop = "0px";
        btn.style.paddingBottom = "40px";
    
        const isDisabled = params.data.issueCount > 0;
        btn.disabled = isDisabled;
    
        if (!isDisabled) {
          btn.onclick = function () {
            deleteCoupon(params.data.id);
          };
        }else{
          btn.classList.add('cursor-not-allowed');
        }
    
        wrapper.appendChild(btn);
        return wrapper;
      }
    }
    

  ];




  // 랜덤 카운트 부여
  const rowData = (JSON.parse(localStorage.getItem("issuedCoupons") || "[]")).map(item => {
    return {
      ...item,
      issueCount: item.issueCount ?? Math.floor(Math.random() * 5), // 0~4 랜덤
      useCount: item.useCount ?? Math.floor(Math.random() * 3)      // 0~2 랜덤
    };
  });


  const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: { resizable: true, sortable: true, filter: true },
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    animateRows: true
  };

  new agGrid.createGrid(gridDiv, gridOptions);
});


function openCouponModal(existingCoupon = null) {
  const modal = document.createElement("div");
  modal.id = "couponModal";
  modal.className = "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50";

  const content = document.createElement("div");
  content.className = "bg-white p-8 rounded shadow-md w-96 relative";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "absolute top-1 right-1 text-gray-500 hover:text-red-600 text-2xl font-bold";
  closeBtn.onclick = function () { modal.remove(); };

  const id = existingCoupon?.id || 'CPN' + Date.now();
  const code = existingCoupon?.code || 'CODE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const nameInput = document.createElement("input");
  nameInput.placeholder = "쿠폰명";
  nameInput.className = "w-full border p-2 mb-2";
  nameInput.value = existingCoupon?.name || "";

  const valueInput = document.createElement("input");
  valueInput.type = "number";
  valueInput.placeholder = "할인 금액/비율";
  valueInput.className = "w-full border p-2 mb-2";
  valueInput.value = existingCoupon?.discountValue || "";

  const typeSelect = document.createElement("select");
  typeSelect.className = "w-full border p-2 mb-2";

  typeSelect.style.height = "42px";
  typeSelect.style.padding = "0.5rem";
  typeSelect.style.border = "1px solid #ccc";
  typeSelect.style.marginBottom = "0.5rem";
  typeSelect.style.borderRadius = "0.375rem";


  const amountOption = new Option("금액", "amount");
  const percentOption = new Option("퍼센트", "percent");
  typeSelect.add(amountOption);
  typeSelect.add(percentOption);
  typeSelect.value = existingCoupon?.discountType || "amount";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = existingCoupon ? "수정 저장" : "발행";
  saveBtn.className = "mt-2 bg-green-500 text-white px-4 rounded w-full";
  saveBtn.style.paddingTop = "0.2rem";
  saveBtn.style.paddingBottom = "1.2rem";

  saveBtn.onclick = function () {
    const name = nameInput.value.trim();
    const value = parseInt(valueInput.value);
    const type = typeSelect.value;
    if (!name || isNaN(value)) {
      showToast('required-input', 'error', lang);
      return;
    }
    const newCoupon = {
      id: id,
      code: code,
      name: name,
      discountType: type,
      discountValue: value,
      issuedAt: existingCoupon?.issuedAt || new Date().toISOString()
    };
    updateOrAddCoupon(newCoupon, existingCoupon);
    modal.remove();
    showToast(existingCoupon ? 'update-success' : 'well-done', 'success', lang);
    location.reload();
  };

  content.appendChild(closeBtn);
  content.appendChild(nameInput);
  content.appendChild(valueInput);
  content.appendChild(typeSelect);
  content.appendChild(saveBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function updateOrAddCoupon(coupon, existing = null) {
  let stored = JSON.parse(localStorage.getItem('issuedCoupons') || '[]');
  if (existing) {
    stored = stored.map(item => item.id === coupon.id ? coupon : item);
  } else {
    stored.push(coupon);
  }
  localStorage.setItem('issuedCoupons', JSON.stringify(stored));

  fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  })
    .then(res => res.json())
    .then(data => console.log('서버 응답:', data))
    .catch(err => console.error('에러:', err));
}

function deleteCoupon(id) {
  let stored = JSON.parse(localStorage.getItem('issuedCoupons') || '[]');
  stored = stored.filter(item => item.id !== id);
  localStorage.setItem('issuedCoupons', JSON.stringify(stored));
  showToast('select-delete', 'success', lang);
  location.reload();
}

breadcrumb.textContent = "쿠폰발행"