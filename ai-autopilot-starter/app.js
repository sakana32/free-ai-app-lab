'use strict';

const STORAGE_KEY = 'job_tracker_items_v1';
const STATUS_LIST = ['応募前', '応募済み', '選考中', '面接実施', '内定', '見送り・不採用'];

function loadItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
}

function renderSummary(items) {
  const summaryContainer = document.getElementById('summaryContainer');
  if (!summaryContainer) return;

  summaryContainer.textContent = '';

  STATUS_LIST.forEach(status => {
    const count = items.filter(i => i.status === status).length;
    const box = document.createElement('div');
    box.className = 'summary-box';

    const label = document.createElement('div');
    label.className = 'summary-label';
    label.textContent = status;
    box.appendChild(label);

    const num = document.createElement('div');
    num.className = 'summary-count';
    num.textContent = count + '件';
    box.appendChild(num);

    summaryContainer.appendChild(box);
  });
}

function render() {
  const listContainer = document.getElementById('listContainer');
  const filterSelect = document.getElementById('filterSelect');
  if (!listContainer || !filterSelect) return;

  const filterValue = filterSelect.value;
  const items = loadItems();

  renderSummary(items);

  listContainer.textContent = '';

  const filtered = items.filter(item => {
    if (filterValue === 'all') return true;
    return item.status === filterValue;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-msg';
    empty.textContent = '登録された応募先はありません。';
    listContainer.appendChild(empty);
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const header = document.createElement('div');
    header.className = 'item-header';

    const info = document.createElement('div');
    const comp = document.createElement('div');
    comp.className = 'item-company';
    comp.textContent = item.company;
    info.appendChild(comp);

    if (item.role) {
      const role = document.createElement('div');
      role.className = 'item-role';
      role.textContent = item.role;
      info.appendChild(role);
    }
    header.appendChild(info);

    const badge = document.createElement('span');
    badge.className = 'badge badge-' + item.status;
    badge.textContent = item.status;
    header.appendChild(badge);

    card.appendChild(header);

    if (item.note) {
      const note = document.createElement('div');
      note.className = 'item-note';
      note.textContent = item.note;
      card.appendChild(note);
    }

    const footer = document.createElement('div');
    footer.className = 'item-footer';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = '登録日: ' + item.date;
    footer.appendChild(dateSpan);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn';
    delBtn.textContent = '削除';
    delBtn.addEventListener('click', () => {
      deleteItem(item.id);
    });
    footer.appendChild(delBtn);

    card.appendChild(footer);
    listContainer.appendChild(card);
  });
}

function addItem() {
  const companyInput = document.getElementById('companyInput');
  const roleInput = document.getElementById('roleInput');
  const statusInput = document.getElementById('statusInput');
  const noteInput = document.getElementById('noteInput');

  if (!companyInput || !statusInput) return;

  const company = companyInput.value.trim();
  if (!company) {
    alert('企業名を入力してください。');
    companyInput.focus();
    return;
  }

  const items = loadItems();
  const newItem = {
    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    company: company,
    role: roleInput ? roleInput.value.trim() : '',
    status: statusInput.value,
    note: noteInput ? noteInput.value.trim() : '',
    date: new Date().toLocaleDateString('ja-JP')
  };

  items.unshift(newItem);
  saveItems(items);

  companyInput.value = '';
  if (roleInput) roleInput.value = '';
  if (noteInput) noteInput.value = '';
  statusInput.value = '応募済み';

  render();
}

function deleteItem(id) {
  if (!confirm('この応募先を削除してもよろしいですか？')) return;
  const items = loadItems();
  const updated = items.filter(i => i.id !== id);
  saveItems(updated);
  render();
}

function exportData() {
  const items = loadItems();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "job_tracker_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed)) {
        if (confirm('既存のデータに上書き、または統合しますか？ OKで上書き、キャンセルで中止します。')) {
          saveItems(parsed);
          render();
          alert('データを正常に読み込みました。');
        }
      } else {
        alert('無効なファイル形式です。');
      }
    } catch (err) {
      alert('JSONファイルの解析に失敗しました。');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const addButton = document.getElementById('addButton');
  if (addButton) {
    addButton.addEventListener('click', addItem);
  }

  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) {
    filterSelect.addEventListener('change', render);
  }

  const exportButton = document.getElementById('exportButton');
  if (exportButton) {
    exportButton.addEventListener('click', exportData);
  }

  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', importData);
  }

  render();
});
