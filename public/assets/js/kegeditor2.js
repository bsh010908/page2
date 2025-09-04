let leftGridApi = null;
let rightGridApi = null;

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Drag 스타일 정의
  const style = document.createElement("style");
  style.textContent = `
    .ag-row-drag { cursor: grab; }
    .ag-row-dragging { cursor: grabbing !important; }
    .dragging-row-highlight { background-color: #e0f7fa !important; }
  `;
  document.head.appendChild(style);

  // ✅ localStorage 에 저장된 데이터 확인
  const savedLeftData = localStorage.getItem("leftGridData");
  const savedRightData = localStorage.getItem("rightGridData");

  let initialLeftData;
  let initialRightData;

  if (savedLeftData && savedRightData) {
    initialLeftData = JSON.parse(savedLeftData);
    initialRightData = JSON.parse(savedRightData);
  } else {
    // ✅ dummyjson API에서 데이터 가져오기
    const response = await fetch("https://dummyjson.com/posts");
    const result = await response.json();

    // ✅ posts → grid 데이터로 매핑
    initialLeftData = result.posts.slice(0, 10).map(post => ({
      groupcode: "P" + post.id,
      groupname: post.title,
      enabletype: post.id % 2 === 0 ? "Y" : "N",
      regsitecode: post.userId % 2 === 0 ? "MAIN" : "SUB"
    }));
    initialRightData = [];
  }

  setupMasterGrid(initialLeftData);
  setupDetailGrid(initialRightData);

  // ✅ breadcrumb 텍스트 고정
  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) breadcrumb.textContent = "KEG-Editor";
});

/* ---------------- Grid Setup ---------------- */
function setupMasterGrid(data) {
  const columnDefs = [
    { rowDrag: true, checkboxSelection: true, headerCheckboxSelection: true, width: 60 },
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
    rowDragManaged: true,
    animateRows: true,
    onGridReady: params => {
      leftGridApi = params.api;
      registerDropZones();
    }
  };

  const gridDiv = document.getElementById("grid-left");
  gridDiv.innerHTML = "";
  agGrid.createGrid(gridDiv, gridOptions);
}

function setupDetailGrid(data) {
  const columnDefs = [
    { rowDrag: true, checkboxSelection: true, headerCheckboxSelection: true, width: 60 },
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
    rowDragManaged: true,
    animateRows: true,
    onGridReady: params => {
      rightGridApi = params.api;
      registerDropZones();
    }
  };

  const gridDiv = document.getElementById("grid-right");
  gridDiv.innerHTML = "";
  agGrid.createGrid(gridDiv, gridOptions);
}

/* ---------------- Drag & Drop ---------------- */
function registerDropZones() {
  if (leftGridApi && rightGridApi) {
    const toRightZone = rightGridApi.getRowDropZoneParams({
      onDragStop: event => {
        const dragged = event.node.data;
        let selected = leftGridApi.getSelectedRows();
        if (!(Array.isArray(selected) && selected.length > 0)) selected = [dragged];
        moveRows(selected, "left");
      }
    });
    leftGridApi.addRowDropZone(toRightZone);

    const toLeftZone = leftGridApi.getRowDropZoneParams({
      onDragStop: event => {
        const dragged = event.node.data;
        let selected = rightGridApi.getSelectedRows();
        if (!(Array.isArray(selected) && selected.length > 0)) selected = [dragged];
        moveRows(selected, "right");
      }
    });
    rightGridApi.addRowDropZone(toLeftZone);
  }
}

function moveRows(draggedRows, from) {
  const sourceApi = from === "left" ? leftGridApi : rightGridApi;
  const targetApi = from === "left" ? rightGridApi : leftGridApi;

  const sourceData = getCurrentRowData(sourceApi);
  const targetData = getCurrentRowData(targetApi);

  const filteredSource = removeSelectedFromSource(sourceData, draggedRows);
  const mergedTarget = mergeUniqueRows(targetData, draggedRows);

  if (from === "left") {
    setupMasterGrid(filteredSource);
    setupDetailGrid(mergedTarget);
  } else {
    setupMasterGrid(mergedTarget);
    setupDetailGrid(filteredSource);
  }

  const newLeftData = from === "left" ? filteredSource : mergedTarget;
  const newRightData = from === "left" ? mergedTarget : filteredSource;

  localStorage.setItem("leftGridData", JSON.stringify(newLeftData));
  localStorage.setItem("rightGridData", JSON.stringify(newRightData));
}

/* ---------------- Utilities ---------------- */
function getCurrentRowData(api) {
  const rowData = [];
  api.forEachNode(node => rowData.push(node.data));
  return rowData;
}

function removeSelectedFromSource(sourceData, selected) {
  if (!Array.isArray(selected)) return sourceData;
  const selectedKeys = new Set(selected.map(row => row.groupcode));
  return sourceData.filter(row => !selectedKeys.has(row.groupcode));
}

function mergeUniqueRows(target, added) {
  const map = new Map();
  [...added, ...target].forEach(row => {
    if (row && typeof row === "object" && "groupcode" in row) {
      map.set(row.groupcode, row);
    }
  });
  return Array.from(map.values());
}
