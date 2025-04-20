// ✅ 쿠폰-강좌 연결 시스템 (< > 버튼 기반 + localStorage 연동)

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

let selectedLectureId = null;
let leftGridApi = null;
let rightGridApi = null;
let leftGridInstance = null;
let rightGridInstance = null;
let leftRowData = [];

const linkedCoupons = JSON.parse(localStorage.getItem("linkedCoupons") || '{}');

document.addEventListener("DOMContentLoaded", () => {
  setupLectureDropdown();
  setupCouponGrid();
  setupMoveButtons();
});

function setupLectureDropdown() {
  const select = document.getElementById("lectureSelect");
  select.style.height = "42px";
  select.style.padding = "0.5rem";
  select.style.border = "1px solid #ccc";
  select.style.marginBottom = "0.5rem";
  select.style.borderRadius = "0.375rem";

  mockLectures.forEach(lec => {
    const opt = document.createElement("option");
    opt.value = lec.id;
    opt.textContent = lec.name;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    selectedLectureId = select.value;
    const data = linkedCoupons[selectedLectureId] || [];
    setupLectureCouponGrid(data);
  });
}

function setupCouponGrid() {
  const coupons = JSON.parse(localStorage.getItem("issuedCoupons") || "[]");
  leftRowData = coupons;

  const columnDefs = [
    {
      headerName: "#",
      width: 50,
      suppressSizeToFit: true,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      valueGetter: 'node.rowIndex + 1',
      cellClass: 'ag-text-right'
    },
    { headerName: "쿠폰명", field: "name" },
    { headerName: "유형", field: "discountType" },
    { headerName: "값", field: "discountValue" }
  ];
  

  const gridOptions = {
    columnDefs,
    rowData: coupons,
    rowSelection: 'multiple',
    defaultColDef: { flex: 1, resizable: true, sortable: true, filter: true },
    onGridReady: (params) => {
      leftGridApi = params.api;
    }
  };

  if (leftGridInstance) leftGridInstance.destroy();
  leftGridInstance = agGrid.createGrid(document.getElementById("grid-left"), gridOptions);
}

function setupLectureCouponGrid(data) {
  const columnDefs = [
    {
      headerName: "#",
      width: 50,
      suppressSizeToFit: true,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      valueGetter: 'node.rowIndex + 1',
      cellClass: 'ag-text-right'
    },
    { headerName: "쿠폰명", field: "name" },
    { headerName: "유형", field: "discountType" },
    { headerName: "값", field: "discountValue" }
  ];
  
  

  const gridOptions = {
    columnDefs,
    rowData: data,
    rowSelection: 'multiple',
    defaultColDef: { flex: 1, resizable: true, sortable: true, filter: true },
    onGridReady: (params) => {
      rightGridApi = params.api;
    }
  };

  if (rightGridInstance) rightGridInstance.destroy();
  rightGridInstance = agGrid.createGrid(document.getElementById("grid-right"), gridOptions);
}

function setupMoveButtons() {
  document.getElementById("btn-move-right").addEventListener("click", () => {
    if (!selectedLectureId) return alert("강좌를 선택하세요.");
    const selected = leftGridApi.getSelectedRows();
    if (!selected.length) return;

    // 왼쪽에서 제거, 오른쪽에 추가
    leftRowData = leftRowData.filter(row => !selected.some(sel => sel.id === row.id));
    const rightData = linkedCoupons[selectedLectureId] || [];
    const merged = mergeUniqueRows(rightData, selected);

    linkedCoupons[selectedLectureId] = merged;
    localStorage.setItem("linkedCoupons", JSON.stringify(linkedCoupons));

    setupCouponGrid();
    setupLectureCouponGrid(merged);
  });

  document.getElementById("btn-move-left").addEventListener("click", () => {
    if (!selectedLectureId) return;
    const selected = rightGridApi.getSelectedRows();
    if (!selected.length) return;

    const remaining = (linkedCoupons[selectedLectureId] || []).filter(row => !selected.some(sel => sel.id === row.id));
    leftRowData = mergeUniqueRows(leftRowData, selected);

    linkedCoupons[selectedLectureId] = remaining;
    localStorage.setItem("linkedCoupons", JSON.stringify(linkedCoupons));

    setupCouponGrid();
    setupLectureCouponGrid(remaining);
  });
}

function mergeUniqueRows(target, added) {
  const map = new Map();
  [...target, ...added].forEach(row => {
    if (row && typeof row === 'object' && 'id' in row) {
      map.set(row.id, row);
    }
  });
  return Array.from(map.values());
}

breadcrumb.textContent = "쿠폰적용"