let leftGridApi = null;
let rightGridApi = null;

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ JSONPlaceholder에서 데이터 가져오기
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts = await response.json();

  // ✅ posts → grid용 데이터 변환
  const mockGroupList = posts.slice(0, 10).map(post => ({
    groupcode: "P" + post.id,        // post.id → 그룹코드
    groupname: post.title,           // post.title → 그룹명
    enabletype: post.id % 2 === 0 ? "Y" : "N", // 짝수면 Y, 홀수면 N
    regsitecode: post.userId % 2 === 0 ? "MAIN" : "SUB" // userId 기준으로 MAIN/SUB 분리
  }));

  setupMasterGrid(mockGroupList);
  setupDetailGrid([]);
  breadcrumb.textContent = "KEG-Editor"; // ✅ 기존 breadcrumb 유지
});

function setupMasterGrid(data) {
  const columnDefs = [
    { checkboxSelection: true, headerCheckboxSelection: true, width: 40 },
    { headerName: "그룹코드", field: "groupcode" },
    { headerName: "그룹명", field: "groupname" },
    { headerName: "사용여부", field: "enabletype" },
    { headerName: "등록사이트", field: "regsitecode" }
  ];

  const gridOptions = {
    columnDefs,
    rowData: data,
    rowSelection: "multiple",
    defaultColDef: {
      flex: 1,
      resizable: true,
      sortable: true,
      filter: true
    },
    onGridReady: params => {
      leftGridApi = params.api;
    }
  };

  const gridDiv = document.getElementById("grid-left");
  gridDiv.innerHTML = "";
  agGrid.createGrid(gridDiv, gridOptions);
}

function setupDetailGrid(data) {
  const columnDefs = [
    { checkboxSelection: true, headerCheckboxSelection: true, width: 40 },
    { headerName: "그룹코드", field: "groupcode" },
    { headerName: "그룹명", field: "groupname" },
    { headerName: "사용여부", field: "enabletype" },
    { headerName: "등록사이트", field: "regsitecode" }
  ];

  const gridOptions = {
    columnDefs,
    rowData: data,
    rowSelection: "multiple",
    defaultColDef: {
      flex: 1,
      resizable: true,
      sortable: true,
      filter: true
    },
    onGridReady: params => {
      rightGridApi = params.api;
    }
  };

  const gridDiv = document.getElementById("grid-right");
  gridDiv.innerHTML = "";
  agGrid.createGrid(gridDiv, gridOptions);
}

function getCurrentRowData(api) {
  const rowData = [];
  api.forEachNode(node => rowData.push(node.data));
  return rowData;
}

function removeSelectedFromSource(sourceData, selected) {
  const selectedKeys = new Set(selected.map(row => row.groupcode));
  return sourceData.filter(row => !selectedKeys.has(row.groupcode));
}

function mergeUniqueRows(target, added) {
  const map = new Map();
  [...target, ...added].forEach(row => {
    map.set(row.groupcode, row);
  });
  return Array.from(map.values());
}

// 👉 왼쪽 → 오른쪽
document.getElementById("btn-move-right").addEventListener("click", () => {
  const selected = leftGridApi.getSelectedRows();
  if (selected.length === 0) return;

  const leftData = getCurrentRowData(leftGridApi);
  const rightData = getCurrentRowData(rightGridApi);

  const newLeft = removeSelectedFromSource(leftData, selected);
  const newRight = mergeUniqueRows(rightData, selected);

  setupMasterGrid(newLeft);
  setupDetailGrid(newRight);
});

// 👉 오른쪽 → 왼쪽
document.getElementById("btn-move-left").addEventListener("click", () => {
  const selected = rightGridApi.getSelectedRows();
  if (selected.length === 0) return;

  const leftData = getCurrentRowData(leftGridApi);
  const rightData = getCurrentRowData(rightGridApi);

  const newRight = removeSelectedFromSource(rightData, selected);
  const newLeft = mergeUniqueRows(leftData, selected);

  setupMasterGrid(newLeft);
  setupDetailGrid(newRight);
});
