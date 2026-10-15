import {api} from './client';
import {showFormModal} from './modalHelper';

type Row = {id: string; [key: string]: unknown};
type Workspace = {
  tasks: Row[];
  projects: Row[];
  approvals: Row[];
  activities: Row[];
  calendar: Row[];
  documents: Row[];
  notifications: Row[];
  emails: Row[];
  profile: Row[];
  summary?: {
    open_tasks: number;
    managed_projects: number;
    pending_approvals: number;
    unread_notifications: number;
  };
};

const text = (node: Element | null | undefined, value: unknown) => {
  if (node) node.textContent = String(value ?? '—');
};
const safe = (value: unknown) =>
  String(value ?? '—')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, x => x.toUpperCase());
const date = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: String(value).includes('T') ? '2-digit' : undefined,
        minute: String(value).includes('T') ? '2-digit' : undefined,
      })
    : '—';
const label = (row: HTMLTableRowElement, value: unknown) => {
  const target = row.cells[0]?.querySelector('label');
  if (target?.lastChild) target.lastChild.textContent = String(value ?? '—');
  else text(row.cells[0], value);
};

function fill(panel: HTMLElement | null, data: Row[], update: (row: HTMLTableRowElement, item: Row) => void) {
  const table = panel?.querySelector<HTMLTableElement>('table.sop-table');
  const tbody = table?.tBodies[0];
  const template = tbody?.querySelector<HTMLTableRowElement>('tr');
  if (!table || !tbody || !template) return;

  const skeleton = template.cloneNode(true) as HTMLTableRowElement;
  tbody.replaceChildren();

  if (!data.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = table.tHead?.rows[0]?.cells.length || 7;
    cell.textContent = 'Tidak ada data untuk pengguna ini.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const item of data) {
    const row = skeleton.cloneNode(true) as HTMLTableRowElement;
    row.dataset.recordId = String(item.id ?? '');
    update(row, item);
    tbody.appendChild(row);
  }
}

/** Replaces all nine My Workspace fixture tables with user-scoped SQL projections. */
export async function refreshNativeWorkspace() {
  const page = document.querySelector<HTMLElement>('[data-route="/my-workspace"]');
  if (!page) return;
  const {data: response} = await api.get('/api/v1/workspace');
  const state = response.data as Workspace;
  const panel = (id: string) => page.querySelector<HTMLElement>(`.ws-panel[data-panel="${id}"]`);

  fill(panel('my-workspace'), state.tasks, (row, item) => {
    label(row, item.title);
    text(row.cells[1], 'Projects');
    text(row.cells[2]?.querySelector('.chip'), 'Medium');
    text(row.cells[3]?.querySelector('.chip'), safe(item.status));
    text(row.cells[4], date(item.due_at));
    text(row.cells[5], item.project);
    row.dataset.status = String(item.status);
    row.dataset.priority = 'Medium';
    const isDone = item.status === 'done' || item.status === 'completed';
    row.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(x => {
      x.checked = isDone;
    });
  });

  fill(panel('dashboard'), state.projects, (row, item) => {
    label(row, `${item.code} ${item.name}`);
    text(row.cells[1], item.customer);
    text(row.cells[2]?.querySelector('.chip'), safe(item.status));
    text(row.cells[3], `${item.progress ?? 0}%`);
    text(row.cells[4], 'Saya');
    text(row.cells[5], date(item.due_at));
    row.dataset.status = String(item.status);
  });

  fill(panel('crm-sales'), state.approvals, (row, item) => {
    label(row, item.number || item.subject_type);
    text(row.cells[1], safe(item.subject_type));
    text(row.cells[2], item.total ? `Rp ${Number(item.total).toLocaleString('id-ID')}` : '—');
    text(row.cells[3], item.requester);
    text(row.cells[4], date(item.created_at));
    text(row.cells[5]?.querySelector('.chip'), 'Pending');
    row.dataset.status = 'Pending';
  });

  fill(panel('business-development'), state.activities, (row, item) => {
    label(row, safe(item.action));
    text(row.cells[1], safe(item.entity_type));
    text(row.cells[2], item.entity_id);
    text(row.cells[3], date(item.created_at));
    text(row.cells[4]?.querySelector('.chip'), 'Tercatat');
    row.dataset.status = 'Done';
  });

  fill(panel('quotation'), state.calendar, (row, item) => {
    label(row, item.title);
    text(row.cells[1], item.kind);
    text(row.cells[2], item.context);
    text(row.cells[3], date(item.starts_at));
    text(row.cells[4]?.querySelector('.chip'), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel('sales'), state.documents, (row, item) => {
    label(row, item.title);
    text(row.cells[1], safe(item.category));
    text(row.cells[2], item.folder);
    text(row.cells[3], `v${item.version}`);
    text(row.cells[4], date(item.updated_at));
    text(row.cells[5]?.querySelector('.chip'), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel('projects'), state.notifications, (row, item) => {
    const detail = (item.data && typeof item.data === 'object' ? item.data : {}) as Record<string, unknown>;
    label(row, detail.message || detail.title || safe(item.type));
    text(row.cells[1], 'In-app');
    text(row.cells[2], safe(item.type));
    text(row.cells[3], date(item.created_at));
    text(row.cells[4]?.querySelector('.chip'), item.read_at ? 'Read' : 'Unread');
    row.dataset.status = item.read_at ? 'Read' : 'Unread';
  });

  fill(panel('purchase'), state.emails, (row, item) => {
    label(row, item.subject || '(Tanpa subjek)');
    text(row.cells[1], item.recipient);
    text(row.cells[2], 'Outbox');
    text(row.cells[3], date(item.sent_at || item.created_at));
    text(row.cells[4]?.querySelector('.chip'), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel('inventory'), state.profile, (row, item) => {
    label(row, item.field);
    text(row.cells[1], item.value);
    text(row.cells[2], item.visibility);
    text(row.cells[3], date(new Date().toISOString()));
    row.dataset.status = '';
  });

  // Update KPI in My Tasks tab
  if (state.summary) {
    const kpiValues = page.querySelectorAll<HTMLElement>('#ws-panel-my-workspace .kpi-row .kpi .kpi__value');
    if (kpiValues[0]) kpiValues[0].textContent = String(state.summary.open_tasks);
    if (kpiValues[1]) kpiValues[1].textContent = String(state.summary.pending_approvals);
    if (kpiValues[2]) kpiValues[2].textContent = String(state.summary.unread_notifications);
  }
}

/** Checkbox toggles an assigned task; notification detail marks it read; create buttons add real records. */
export async function handleNativeWorkspaceAction(event: Event): Promise<boolean> {
  const target = event.target as HTMLElement;
  const page = target.closest<HTMLElement>('[data-route="/my-workspace"]');
  if (!page) return false;

  // 1. Intercept "Task" or "Event" create button inside workspace
  const createBtn = target.closest<HTMLElement>('[data-action="sop:create"]');
  if (createBtn) {
    const panel = createBtn.closest<HTMLElement>('.ws-panel[data-panel]');
    const panelId = panel?.dataset.panel;

    if (panelId === 'my-workspace') {
      event.preventDefault();
      event.stopImmediatePropagation();

      const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      const formValues = await showFormModal<{title: string; due_date: string}>({
        title: 'Tambah Tugas Personal (Workspace)',
        icon: 'lucide:check-circle-2',
        submitText: 'Simpan Tugas',
        fields: [
          {
            name: 'title',
            label: 'Judul Tugas / Follow-Up',
            type: 'text',
            required: true,
            placeholder: 'Contoh: Follow up penawaran klien PT Cahaya Abadi',
          },
          {
            name: 'due_date',
            label: 'Tenggat Waktu (Due Date)',
            type: 'date',
            required: true,
            value: defaultDue,
          },
        ],
      });

      if (!formValues) return true;
      try {
        await api.post('/api/v1/workspace/tasks', {title: formValues.title.trim(), due_at: formValues.due_date});
        await refreshNativeWorkspace();
      } catch (err: unknown) {
        const e = err as {response?: {data?: {message?: string}}};
        window.alert('Gagal menambah tugas: ' + (e.response?.data?.message || String(err)));
      }
      return true;
    }

    if (panelId === 'quotation') {
      event.preventDefault();
      event.stopImmediatePropagation();

      const defaultTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const formValues = await showFormModal<{title: string; starts_at: string; location: string}>({
        title: 'Tambah Agenda / Pertemuan Baru',
        icon: 'lucide:calendar-plus',
        submitText: 'Simpan Agenda',
        fields: [
          {
            name: 'title',
            label: 'Judul Pertemuan / Agenda',
            type: 'text',
            required: true,
            placeholder: 'Contoh: Rapat Koordinasi Progress Implementasi',
          },
          {
            name: 'starts_at',
            label: 'Waktu Pelaksanaan (YYYY-MM-DD HH:mm)',
            type: 'text',
            required: true,
            value: defaultTime,
            placeholder: '2026-10-20 14:00',
            halfWidth: true,
          },
          {
            name: 'location',
            label: 'Lokasi / Tautan Rapat',
            type: 'text',
            value: 'Ruang Rapat Utama / Google Meet',
            placeholder: 'Contoh: Ruang Rapat 2 / Zoom',
            halfWidth: true,
          },
        ],
      });

      if (!formValues) return true;
      try {
        await api.post('/api/v1/workspace/calendar', {
          title: formValues.title.trim(),
          starts_at: formValues.starts_at.trim(),
          location: formValues.location.trim() || null,
        });
        await refreshNativeWorkspace();
      } catch (err: unknown) {
        const e = err as {response?: {data?: {message?: string}}};
        window.alert('Gagal menambah agenda: ' + (e.response?.data?.message || String(err)));
      }
      return true;
    }
  }

  const row = target.closest<HTMLTableRowElement>('tr[data-record-id]');
  const panel = target.closest<HTMLElement>('.ws-panel[data-panel]');
  if (!row || !panel) return false;

  // 2. Toggle Task completion status
  if (panel.dataset.panel === 'my-workspace' && target.matches('input[data-action="table:select"]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const taskId = row.dataset.recordId;
    if (taskId) {
      await api.put(`/api/v1/workspace/tasks/${taskId}/toggle`);
      await refreshNativeWorkspace();
    }
    return true;
  }

  // 3. Mark notification as read
  if (panel.dataset.panel === 'projects' && target.closest('[data-action="table:detail"]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const notifId = row.dataset.recordId;
    if (notifId) {
      await api.post(`/api/v1/workspace/notifications/${notifId}/read`);
      await refreshNativeWorkspace();
    }
    return true;
  }

  return false;
}
