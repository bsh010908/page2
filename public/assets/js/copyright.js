document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  const gridDiv = document.getElementById("myGrid");
  gridDiv.className = "ag-theme-alpine";
  gridDiv.style.height = "700px";
  gridDiv.style.width = "100%";

  // 버튼 생성 및 우측 정렬
  const buttonRow = document.createElement("div");
  buttonRow.className = "flex justify-end mb-2 mt-2";

  const newBtn = document.createElement("button");
  newBtn.textContent = "신규 생성";
  newBtn.className = "bg-green-600 text-white px-4 py-1 rounded";
  newBtn.onclick = function () {
    openPermissionModal();
  };
  buttonRow.appendChild(newBtn);
  content.insertBefore(buttonRow, gridDiv);

  const columnDefs = [
    { headerName: "ID", field: "permission_id", hide: true },
    { headerName: "Member ID", field: "member_id" },
    { headerName: "Member Name", field: "member_name" },
    { headerName: "Menu Page ID", field: "menu_page_id" },
    { headerName: "Page Name", field: "page_name" },
    { headerName: "조회", field: "can_search", editable: true },
    { headerName: "추가(신규)", field: "can_add", editable: true },
    { headerName: "삭제", field: "can_delete", editable: true },
    { headerName: "검색초기화", field: "can_reset_search", editable: true },
    { headerName: "저장", field: "can_save", editable: true },
    { headerName: "뷰", field: "can_view", editable: true },
    {
      headerName: "관리리",
      field: "edit",
      pinned: "right",
      width: 80,
      cellRenderer: function (params) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";

        const btn = document.createElement("button");
        btn.textContent = "저장";
        btn.className = "bg-blue-500 text-white px-2 rounded";
        btn.style.paddingTop = "0px";
        btn.style.paddingBottom = "40px";

        btn.onclick = function () {
          savePermission(params.data);
        };

        wrapper.appendChild(btn);
        return wrapper;
      }
    }
  ];

  fetch('/api/member-permissions')
    .then(response => response.json())
    .then(data => {
      const gridOptions = {
        columnDefs: columnDefs,
        rowData: data,
        defaultColDef: { resizable: true, sortable: true, filter: true },
        pagination: true,
        paginationPageSize: 20,
        animateRows: true
      };
      new agGrid.createGrid(gridDiv, gridOptions);
    })
    .catch(err => {
      console.error('권한 목록 불러오기 실패:', err);
    });
});

function savePermission(data) {
  const id = data.permission_id;

  const body = {
    can_search: data.can_search,
    can_add: data.can_add,
    can_delete: data.can_delete,
    can_reset_search: data.can_reset_search,
    can_save: data.can_save,
    can_view: data.can_view
  };

  fetch(`/api/member-permissions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(result => {
      showToast('select-delete', 'success', lang);
    })
    .catch(err => {
      console.error("수정 실패:", err);
      alert("저장 실패");
    });
}

function openPermissionModal() {
  const modal = document.createElement("div");
  modal.className = "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50";

  const content = document.createElement("div");
  content.className = "bg-white p-6 rounded shadow-md w-96 relative";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold";
  closeBtn.onclick = () => modal.remove();

  const fields = ["member_id", "menu_page_id", "can_search", "can_add", "can_delete", "can_reset_search", "can_save", "can_view"];
  const inputs = {};

  fields.forEach(field => {
    const input = document.createElement("input");
    input.placeholder = field;
    input.className = "w-full border p-2 mb-2";
    input.value = (["can_search", "can_add", "can_delete", "can_reset_search", "can_save", "can_view"].includes(field) ? "0" : "");
    inputs[field] = input;
    content.appendChild(input);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "등록";
  saveBtn.className = "bg-green-500 text-white px-4 py-2 w-full rounded";
  saveBtn.onclick = function () {
    const newPermission = {};
    fields.forEach(field => newPermission[field] = inputs[field].value.trim());

    fetch('/api/member-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPermission)
    })
      .then(res => res.json())
      .then(result => {
        alert("등록 완료");
        location.reload();
      })
      .catch(err => {
        console.error("등록 실패:", err);
        alert("등록 실패");
      });

    modal.remove();
  };

  content.appendChild(closeBtn);
  content.appendChild(saveBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

// 페이지 제목 설정
breadcrumb.textContent = "컨트롤러권한관리";
