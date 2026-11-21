'use strict';

const STORAGE_KEY = 'job_tracker_items_v1';
const STATUS_LIST = ['応募前', '応募済み', '選考中', '面接実施', '内定', '見送り・不採用'];

let editingId = null;

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

function getUrgencyInfo(nextDateStr) {
  if (!nextDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(nextDateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: Math.abs(diffDays) + '日超過', className: 'urgency-overdue' };
  } else if (diffDays === 0) {
    return { text: '本日予定', className: 'urgency-today' };
  } else if (diffDays <= 3) {
    return { text: 'あと' + diffDays + '日', className: 'urgency-soon' };
  } else {
    return { text: 'あと' + diffDays + '日', className: 'urgency-future' };
  }
}

function renderSummary(items) {
  const summaryContainer = document.getElementById('summaryContainer');
  if (!summaryContainer) return;

  summaryContainer.textContent = '';

  STATUS_LIST.forEach(status => {
    const count = items.filter(i => i.status === status).length;
    const box = document.createElement('div');
    box.className = 'summary-box';
    box.title = status + 'の案件をフィルター表示';

    box.addEventListener('click', () => {
      const filterSelect = document.getElementById('filterSelect');
      if (filterSelect) {
        filterSelect.value = status;
        render();
      }
    });

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
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  if (!listContainer || !filterSelect) return;

  const filterValue = filterSelect.value;
  const searchQuery = (searchInput ? searchInput.value.trim().toLowerCase() : '');
  const sortValue = sortSelect ? sortSelect.value : 'dateDesc';

  const items = loadItems();
  renderSummary(items);

  listContainer.textContent = '';

  let filtered = items.filter(item => {
    if (filterValue !== 'all' && item.status !== filterValue) {
      return false;
    }
    if (searchQuery) {
      const comp = (item.company || '').toLowerCase();
      const role = (item.role || '').toLowerCase();
      const note = (item.note || '').toLowerCase();
      const nextAction = (item.nextAction || '').toLowerCase();
      if (!comp.includes(searchQuery) && !role.includes(searchQuery) &&
          !note.includes(searchQuery) && !nextAction.includes(searchQuery)) {
        return false;
      }
    }
    return true;
  });

  // ソート処理
  filtered.sort((a, b) => {
    if (sortValue === 'nextDateAsc') {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.localeCompare(b.nextDate);
    } else if (sortValue === 'dateAsc') {
      const idA = a.id || '';
      const idB = b.id || '';
      return idA.localeCompare(idB);
    } else {
      // dateDesc (デフォルト: 最新作成順)
      const idA = a.id || '';
      const idB = b.id || '';
      return idB.localeCompare(idA);
    }
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-msg';
    empty.textContent = (items.length === 0) 
      ? '登録された応募先はまだありません。上のフォームから登録してください。'
      : '条件に一致する応募先が見つかりませんでした。';
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

    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'badge-container';

    const badge = document.createElement('span');
    badge.className = 'badge badge-' + item.status;
    badge.textContent = item.status;
    badgeContainer.appendChild(badge);

    if (item.nextDate) {
      const urgency = getUrgencyInfo(item.nextDate);
      if (urgency) {
        const urgBadge = document.createElement('span');
        urgBadge.className = 'badge-urgency ' + urgency.className;
        urgBadge.textContent = urgency.text;
        badgeContainer.appendChild(urgBadge);
      }
    }

    header.appendChild(badgeContainer);
    card.appendChild(header);

    // 次回アクション情報
    if (item.nextDate || item.nextAction) {
      const actionBox = document.createElement('div');
      actionBox.className = 'action-box';

      if (item.nextDate) {
        const dateLine = document.createElement('div');
        dateLine.className = 'action-date-line';
        dateLine.textContent = '次回予定日: ' + item.nextDate;
        actionBox.appendChild(dateLine);
      }
      if (item.nextAction) {
        const actDetail = document.createElement('div');
        actDetail.className = 'action-detail';
        actDetail.textContent = item.nextAction;
        actionBox.appendChild(actDetail);
      }
      card.appendChild(actionBox);
    }

    // メモ
    if (item.note) {
      const note = document.createElement('div');
      note.className = 'item-note';
      note.textContent = item.note;
      card.appendChild(note);
    }

    const footer = document.createElement('div');
    footer.className = 'item-footer';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = '登録日: ' + (item.date || '不明');
    footer.appendChild(dateSpan);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => {
      startEdit(item.id);
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'action-btn delete-btn';
    delBtn.textContent = '削除';
    delBtn.addEventListener('click', () => {
      deleteItem(item.id);
    });
    actions.appendChild(delBtn);

    footer.appendChild(actions);
    card.appendChild(footer);

    listContainer.appendChild(card);
  });
}

function handleSaveItem() {
  const companyInput = document.getElementById('companyInput');
  const roleInput = document.getElementById('roleInput');
  const statusInput = document.getElementById('statusInput');
  const nextDateInput = document.getElementById('nextDateInput');
  const nextActionInput = document.getElementById('nextActionInput');
  const noteInput = document.getElementById('noteInput');

  if (!companyInput || !statusInput) return;

  const company = companyInput.value.trim();
  if (!company) {
    alert('企業名を入力してください。');
    companyInput.focus();
    return;
  }

  const items = loadItems();
  const role = roleInput ? roleInput.value.trim() : '';
  const status = statusInput.value;
  const nextDate = nextDateInput ? nextDateInput.value : '';
  const nextAction = nextActionInput ? nextActionInput.value.trim() : '';
  const note = noteInput ? noteInput.value.trim() : '';

  if (editingId) {
    const index = items.findIndex(i => i.id === editingId);
    if (index !== -1) {
      items[index].company = company;
      items[index].role = role;
      items[index].status = status;
      items[index].nextDate = nextDate;
      items[index].nextAction = nextAction;
      items[index].note = note;
    }
    saveItems(items);
    cancelEdit();
  } else {
    const newItem = {
      id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      company: company,
      role: role,
      status: status,
      nextDate: nextDate,
      nextAction: nextAction,
      note: note,
      date: new Date().toLocaleDateString('ja-JP')
    };

    items.unshift(newItem);
    saveItems(items);
    resetFormFields();
  }

  render();
}

function resetFormFields() {
  const companyInput = document.getElementById('companyInput');
  const roleInput = document.getElementById('roleInput');
  const statusInput = document.getElementById('statusInput');
  const nextDateInput = document.getElementById('nextDateInput');
  const nextActionInput = document.getElementById('nextActionInput');
  const noteInput = document.getElementById('noteInput');

  if (companyInput) companyInput.value = '';
  if (roleInput) roleInput.value = '';
  if (statusInput) statusInput.value = '応募済み';
  if (nextDateInput) nextDateInput.value = '';
  if (nextActionInput) nextActionInput.value = '';
  if (noteInput) noteInput.value = '';
}

function startEdit(id) {
  const items = loadItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  const companyInput = document.getElementById('companyInput');
  const roleInput = document.getElementById('roleInput');
  const statusInput = document.getElementById('statusInput');
  const nextDateInput = document.getElementById('nextDateInput');
  const nextActionInput = document.getElementById('nextActionInput');
  const noteInput = document.getElementById('noteInput');
  const addButton = document.getElementById('addButton');
  const cancelEditButton = document.getElementById('cancelEditButton');
  const formTitle = document.getElementById('formTitle');

  if (!companyInput || !statusInput) return;

  companyInput.value = item.company;
  if (roleInput) roleInput.value = item.role || '';
  statusInput.value = item.status;
  if (nextDateInput) nextDateInput.value = item.nextDate || '';
  if (nextActionInput) nextActionInput.value = item.nextAction || '';
  if (noteInput) noteInput.value = item.note || '';

  editingId = id;
  if (addButton) addButton.textContent = '変更を保存する';
  if (cancelEditButton) cancelEditButton.style.display = 'inline-block';
  if (formTitle) formTitle.textContent = '応募先の編集';

  companyInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  resetFormFields();

  const addButton = document.getElementById('addButton');
  const cancelEditButton = document.getElementById('cancelEditButton');
  const formTitle = document.getElementById('formTitle');

  if (addButton) addButton.textContent = '追加する';
  if (cancelEditButton) cancelEditButton.style.display = 'none';
  if (formTitle) formTitle.textContent = '新規応募先の追加';
}

function deleteItem(id) {
  if (!confirm('この応募先を削除してもよろしいですか？')) return;
  if (editingId === id) {
    cancelEdit();
  }
  const items = loadItems();
  const updated = items.filter(i => i.id !== id);
  saveItems(updated);
  render();
}

function exportData() {
  const items = loadItems();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'job_tracker_backup.json');
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
        if (confirm('現在のデータを読み込んだデータで上書きしますか？\n※既存の未保存内容は置き換えられます。')) {
          saveItems(parsed);
          cancelEdit();
          render();
          alert('データを正常に読み込みました。');
        }
      } else {
        alert('無効なファイル形式です。配列形式のJSONを指定してください。');
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
    addButton.addEventListener('click', handleSaveItem);
  }

  const cancelEditButton = document.getElementById('cancelEditButton');
  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', cancelEdit);
  }

  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) {
    filterSelect.addEventListener('change', render);
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', render);
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
