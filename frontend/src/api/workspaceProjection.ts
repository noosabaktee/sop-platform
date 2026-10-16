import { api } from "./client";
import { showFormModal } from "./modalHelper";

type Row = { id: string; [key: string]: unknown };
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
  if (node) node.textContent = String(value ?? "—");
};
const safe = (value: unknown) =>
  String(value ?? "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (x) => x.toUpperCase());
const date = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: String(value).includes("T") ? "2-digit" : undefined,
        minute: String(value).includes("T") ? "2-digit" : undefined,
      })
    : "—";
const label = (row: HTMLTableRowElement, value: unknown) => {
  const target = row.cells[0]?.querySelector("label");
  if (target?.lastChild) target.lastChild.textContent = String(value ?? "—");
  else text(row.cells[0], value);
};

const tableSkeletonMap = new WeakMap<HTMLTableElement, HTMLTableRowElement>();

function fill(
  panel: HTMLElement | null,
  data: Row[],
  update: (row: HTMLTableRowElement, item: Row) => void,
) {
  const table = panel?.querySelector<HTMLTableElement>("table.sop-table");
  const tbody = table?.tBodies[0];
  if (!table || !tbody) return;

  let skeleton = tableSkeletonMap.get(table);
  if (!skeleton) {
    const template = tbody.querySelector<HTMLTableRowElement>("tr");
    if (template) {
      skeleton = template.cloneNode(true) as HTMLTableRowElement;
      skeleton.removeAttribute("data-template-row");
      tableSkeletonMap.set(table, skeleton);
    }
  }
  if (!skeleton) return;

  tbody.replaceChildren();

  if (!data || !data.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = table.tHead?.rows[0]?.cells.length || 7;
    cell.style.textAlign = "center";
    cell.style.padding = "24px";
    cell.style.color = "var(--text-muted, #64748b)";
    cell.textContent = "Tidak ada data untuk pengguna ini.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const item of data) {
    const row = skeleton.cloneNode(true) as HTMLTableRowElement;
    row.dataset.recordId = String(item.id ?? "");
    update(row, item);
    tbody.appendChild(row);
  }
}

interface WorkspaceBannerInfo {
  icon: string;
  badge: string;
  tone: "blue" | "green" | "amber" | "slate";
  title: string;
  desc: string;
  flow: string;
}

const WORKSPACE_BANNERS: Record<string, WorkspaceBannerInfo> = {
  "my-workspace": {
    icon: "lucide:check-circle-2",
    badge: "Tugas Aktif",
    tone: "blue",
    title: "Rangkuman Tugas & Tindak Lanjut Personal",
    desc: "Tabel ini merangkum seluruh tugas operasional yang dialokasikan kepada Anda dari Modul Projects serta catatan tindak lanjut personal.",
    flow: "Centang kotak pada baris untuk menandai tugas selesai. Klik tombol '+ Task' di kanan atas untuk menambah tugas personal baru. Perubahan rincian proyek atau jadwal resmi dikelola melalui Modul Projects.",
  },
  dashboard: {
    icon: "lucide:folder-kanban",
    badge: "Data Terintegrasi",
    tone: "blue",
    title: "Daftar Proyek di Bawah Kelolaan Anda",
    desc: "Tabel ini menampilkan proyek aktif yang Anda kelola dan terhubung langsung dengan database Modul Projects.",
    flow: "Pembaruan progres, tahapan kerja, anggaran, dan alokasi tim dilakukan terpusat di Modul Projects. Halaman ini berfungsi sebagai pemantauan terpadu.",
  },
  "crm-sales": {
    icon: "lucide:stamp",
    badge: "Otorisasi Transaksi",
    tone: "amber",
    title: "Antrean Otorisasi Dokumen Komersial & Pengadaan",
    desc: "Tabel ini memuat pengajuan penawaran harga, pesanan, dan dokumen pengadaan yang menunggu persetujuan (approval) Anda.",
    flow: "Persetujuan resmi (Approve/Reject) dilakukan melalui alur verifikasi resmi pada masing-masing dokumen transaksi terkait untuk menjaga kepatuhan dan keabsahan pembukuan.",
  },
  "business-development": {
    icon: "lucide:shield-check",
    badge: "Jejak Audit Resmi",
    tone: "slate",
    title: "Log Aktivitas & Riwayat Transaksi (Audit Trail)",
    desc: "Tabel ini mencatat seluruh jejak audit aktivitas sistem dan perubahan data penting Anda secara otomatis.",
    flow: "Demi kepatuhan standar akuntansi dan integritas audit perusahaan, seluruh log aktivitas terekam permanen dan tidak dapat diubah atau dihapus.",
  },
  quotation: {
    icon: "lucide:calendar",
    badge: "Jadwal Kerja",
    tone: "green",
    title: "Kalender Agenda & Pertemuan Bisnis",
    desc: "Tabel ini menyajikan agenda pertemuan, rapat koordinasi proyek, dan tindak lanjut klien yang telah dijadwalkan.",
    flow: "Gunakan tombol '+ Event' di kanan atas untuk mendaftarkan jadwal pertemuan baru. Agenda akan otomatis tersinkronisasi dengan kalender aktivitas sistem.",
  },
  sales: {
    icon: "lucide:file-text",
    badge: "Arsip Dokumen",
    tone: "blue",
    title: "Daftar Arsip & Berkas Transaksi Resmi",
    desc: "Tabel ini menyajikan arsip berkas digital, dokumen tagihan, dan lampiran kontrak resmi yang tertaut ke akun Anda.",
    flow: "Dokumen dihasilkan otomatis saat transaksi resmi diterbitkan (Invoice, Surat Jalan, dll.) atau diunggah melalui formulir lampiran pada modul transaksi terkait.",
  },
  projects: {
    icon: "lucide:bell",
    badge: "Pemberitahuan Sistem",
    tone: "blue",
    title: "Notifikasi & Pengingat Transaksi Terkini",
    desc: "Tabel ini memuat pemberitahuan penting terkait status pekerjaan, tenggat waktu proyek, dan pembaruan persetujuan.",
    flow: "Notifikasi terkirim otomatis oleh sistem. Klik ikon rincian pada baris notifikasi untuk menandai bahwa pesan telah dibaca.",
  },
  purchase: {
    icon: "lucide:mail",
    badge: "Arsip Korespondensi",
    tone: "slate",
    title: "Riwayat Pengiriman Email Dokumen Resmi",
    desc: "Tabel ini mencatat riwayat korespondensi email resmi yang dikirimkan sistem ke mitra, vendor, atau pelanggan.",
    flow: "Email dikirimkan secara otomatis oleh sistem saat dokumen transaksi diterbitkan atau dikonfirmasi dari modul transaksi terkait.",
  },
  inventory: {
    icon: "lucide:user-check",
    badge: "Keamanan Akun",
    tone: "green",
    title: "Profil Pengguna & Wewenang Akses",
    desc: "Tabel ini menampilkan ringkasan hak akses pengguna, peran operasional, dan parameter keamanan akun Anda.",
    flow: "Pengaturan profil dan hak akses diatur secara terpusat oleh Administrator Sistem demi keamanan wewenang dan kepatuhan transaksi perusahaan.",
  },
};

function injectWorkspaceBanner(
  panel: HTMLElement | null,
  info: WorkspaceBannerInfo,
) {
  if (!panel) return;
  let banner = panel.querySelector<HTMLElement>(".sop-context-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = `sop-context-banner tone-${info.tone}`;
    const card = panel.querySelector(".card");
    if (card) {
      panel.insertBefore(banner, card);
    } else {
      panel.prepend(banner);
    }
  } else {
    banner.className = `sop-context-banner tone-${info.tone}`;
  }

  banner.innerHTML = `
    <div class="sop-context-icon" aria-hidden="true">
      <iconify-icon noobserver icon="${info.icon}"></iconify-icon>
    </div>
    <div class="sop-context-body">
      <div class="sop-context-head">
        <h3 class="sop-context-title">${info.title}</h3>
        <span class="sop-context-badge">${info.badge}</span>
      </div>
      <p class="sop-context-desc">${info.desc}</p>
      <div class="sop-context-flow">
        <strong>Alur resmi:</strong> ${info.flow}
      </div>
    </div>
  `;
}

/** Replaces all nine My Workspace fixture tables with user-scoped SQL projections. */
export async function refreshNativeWorkspace() {
  const page = document.querySelector<HTMLElement>(
    '[data-route="/my-workspace"]',
  );
  if (!page) return;
  const { data: response } = await api.get("/api/v1/workspace");
  const state = response.data as Workspace;
  const panel = (id: string) =>
    page.querySelector<HTMLElement>(`.ws-panel[data-panel="${id}"]`);

  // Render context banner for each tab panel
  for (const [panelId, info] of Object.entries(WORKSPACE_BANNERS)) {
    injectWorkspaceBanner(panel(panelId), info);
  }

  fill(panel("my-workspace"), state.tasks, (row, item) => {
    label(row, item.title);
    text(row.cells[1], "Projects");
    text(row.cells[2]?.querySelector(".chip"), "Medium");
    text(row.cells[3]?.querySelector(".chip"), safe(item.status));
    text(row.cells[4], date(item.due_at));
    text(row.cells[5], item.project);
    row.dataset.status = String(item.status);
    row.dataset.priority = "Medium";
    const isDone = item.status === "done" || item.status === "completed";
    row
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((x) => {
        x.checked = isDone;
      });
  });

  fill(panel("dashboard"), state.projects, (row, item) => {
    label(row, `${item.code} ${item.name}`);
    text(row.cells[1], item.customer);
    text(row.cells[2]?.querySelector(".chip"), safe(item.status));
    text(row.cells[3], `${item.progress ?? 0}%`);
    text(row.cells[4], "Saya");
    text(row.cells[5], date(item.due_at));
    row.dataset.status = String(item.status);
  });

  fill(panel("crm-sales"), state.approvals, (row, item) => {
    label(row, item.number || item.subject_type);
    text(row.cells[1], safe(item.subject_type));
    text(
      row.cells[2],
      item.total ? `Rp ${Number(item.total).toLocaleString("id-ID")}` : "—",
    );
    text(row.cells[3], item.requester);
    text(row.cells[4], date(item.created_at));
    text(row.cells[5]?.querySelector(".chip"), "Pending");
    row.dataset.status = "Pending";
  });

  fill(panel("business-development"), state.activities, (row, item) => {
    label(row, safe(item.action));
    text(row.cells[1], safe(item.entity_type));
    text(row.cells[2], item.entity_id);
    text(row.cells[3], date(item.created_at));
    text(row.cells[4]?.querySelector(".chip"), "Tercatat");
    row.dataset.status = "Done";
  });

  fill(panel("quotation"), state.calendar, (row, item) => {
    label(row, item.title);
    text(row.cells[1], item.kind);
    text(row.cells[2], item.context);
    text(row.cells[3], date(item.starts_at));
    text(row.cells[4]?.querySelector(".chip"), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel("sales"), state.documents, (row, item) => {
    label(row, item.title);
    text(row.cells[1], safe(item.category));
    text(row.cells[2], item.folder);
    text(row.cells[3], `v${item.version}`);
    text(row.cells[4], date(item.updated_at));
    text(row.cells[5]?.querySelector(".chip"), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel("projects"), state.notifications, (row, item) => {
    const detail = (
      item.data && typeof item.data === "object" ? item.data : {}
    ) as Record<string, unknown>;
    label(row, detail.message || detail.title || safe(item.type));
    text(row.cells[1], "In-app");
    text(row.cells[2], safe(item.type));
    text(row.cells[3], date(item.created_at));
    text(
      row.cells[4]?.querySelector(".chip"),
      item.read_at ? "Read" : "Unread",
    );
    row.dataset.status = item.read_at ? "Read" : "Unread";
  });

  fill(panel("purchase"), state.emails, (row, item) => {
    label(row, item.subject || "(Tanpa subjek)");
    text(row.cells[1], item.recipient);
    text(row.cells[2], "Outbox");
    text(row.cells[3], date(item.sent_at || item.created_at));
    text(row.cells[4]?.querySelector(".chip"), safe(item.status));
    row.dataset.status = String(item.status);
  });

  fill(panel("inventory"), state.profile, (row, item) => {
    label(row, item.field);
    text(row.cells[1], item.value);
    text(row.cells[2], item.visibility);
    text(row.cells[3], date(new Date().toISOString()));
    row.dataset.status = "";
  });

  // 1. My Tasks KPIs
  const myTasksPanel = panel("my-workspace");
  if (myTasksPanel) {
    const kpiValues = myTasksPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const openTasks = state.tasks.filter((t) => !["done", "completed"].includes(String(t.status))).length;
    const overdue = state.tasks.filter((t) => t.due_at && new Date(String(t.due_at)) < new Date()).length;
    const done = state.tasks.filter((t) => ["done", "completed"].includes(String(t.status))).length;
    if (kpiValues[0]) kpiValues[0].textContent = String(openTasks);
    if (kpiValues[1]) kpiValues[1].textContent = String(overdue);
    if (kpiValues[2]) kpiValues[2].textContent = String(done);
  }

  // 2. Dashboard Projects KPIs
  const dashPanel = panel("dashboard");
  if (dashPanel) {
    const kpiValues = dashPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const active = state.projects.filter((p) => !["done", "completed", "cancelled"].includes(String(p.status))).length;
    const onTrack = state.projects.filter((p) => ["in_progress", "active", "on_track"].includes(String(p.status))).length;
    const atRisk = state.projects.filter((p) => ["at_risk", "risk"].includes(String(p.status))).length;
    if (kpiValues[0]) kpiValues[0].textContent = String(active);
    if (kpiValues[1]) kpiValues[1].textContent = String(onTrack);
    if (kpiValues[2]) kpiValues[2].textContent = String(atRisk);
  }

  // 3. CRM & Sales Approvals KPIs
  const crmPanel = panel("crm-sales");
  if (crmPanel) {
    const kpiValues = crmPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const pending = state.approvals.filter((a) => String(a.status) === "pending").length;
    const approved = state.approvals.filter((a) => String(a.status) === "approved").length;
    const total = state.approvals.length;
    if (kpiValues[0]) kpiValues[0].textContent = String(pending);
    if (kpiValues[1]) kpiValues[1].textContent = String(approved);
    if (kpiValues[2]) kpiValues[2].textContent = String(total);
  }

  // 4. Activities KPIs
  const actPanel = panel("business-development");
  if (actPanel) {
    const kpiValues = actPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const today = state.activities.filter(
      (a) => a.created_at && new Date(String(a.created_at)).toDateString() === new Date().toDateString(),
    ).length;
    const total = state.activities.length;
    const uniqueEntities = new Set(state.activities.map((a) => a.entity_type)).size;
    if (kpiValues[0]) kpiValues[0].textContent = String(today);
    if (kpiValues[1]) kpiValues[1].textContent = String(total);
    if (kpiValues[2]) kpiValues[2].textContent = String(uniqueEntities);
  }

  // 5. Calendar KPIs
  const calPanel = panel("quotation");
  if (calPanel) {
    const kpiValues = calPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const today = state.calendar.filter(
      (c) => c.starts_at && new Date(String(c.starts_at)).toDateString() === new Date().toDateString(),
    ).length;
    const total = state.calendar.length;
    if (kpiValues[0]) kpiValues[0].textContent = String(today);
    if (kpiValues[1]) kpiValues[1].textContent = String(total);
    if (kpiValues[2]) kpiValues[2].textContent = String(total);
  }

  // 6. Documents KPIs
  const docPanel = panel("sales");
  if (docPanel) {
    const kpiValues = docPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const active = state.documents.filter((d) => String(d.status) === "active").length;
    const review = state.documents.filter((d) => ["review", "draft"].includes(String(d.status))).length;
    const total = state.documents.length;
    if (kpiValues[0]) kpiValues[0].textContent = String(active);
    if (kpiValues[1]) kpiValues[1].textContent = String(review);
    if (kpiValues[2]) kpiValues[2].textContent = String(total);
  }

  // 7. Notifications KPIs
  const notifPanel = panel("projects");
  if (notifPanel) {
    const kpiValues = notifPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const unread = state.notifications.filter((n) => !n.read_at).length;
    const total = state.notifications.length;
    const read = state.notifications.filter((n) => Boolean(n.read_at)).length;
    if (kpiValues[0]) kpiValues[0].textContent = String(unread);
    if (kpiValues[1]) kpiValues[1].textContent = String(total);
    if (kpiValues[2]) kpiValues[2].textContent = String(read);
  }

  // 8. Email KPIs
  const emailPanel = panel("purchase");
  if (emailPanel) {
    const kpiValues = emailPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    const sent = state.emails.filter((e) => String(e.status) === "sent").length;
    const total = state.emails.length;
    const queued = state.emails.filter((e) => ["queued", "pending", "draft"].includes(String(e.status))).length;
    if (kpiValues[0]) kpiValues[0].textContent = String(sent);
    if (kpiValues[1]) kpiValues[1].textContent = String(total);
    if (kpiValues[2]) kpiValues[2].textContent = String(queued);
  }

  // 9. Profile KPIs
  const profPanel = panel("inventory");
  if (profPanel) {
    const kpiValues = profPanel.querySelectorAll<HTMLElement>(".kpi-row .kpi .kpi__value");
    if (kpiValues[0]) kpiValues[0].textContent = state.profile.length ? "100%" : "0%";
    if (kpiValues[1]) kpiValues[1].textContent = `${state.profile.length} parameter`;
    if (kpiValues[2]) kpiValues[2].textContent = "Aktif";
  }
}

/** Checkbox toggles an assigned task; notification detail marks it read; create buttons add real records. */
export async function handleNativeWorkspaceAction(
  event: Event,
): Promise<boolean> {
  const target = event.target as HTMLElement;
  const page = target.closest<HTMLElement>('[data-route="/my-workspace"]');
  if (!page) return false;

  // 1. Intercept "Task" or "Event" create button inside workspace
  const createBtn = target.closest<HTMLElement>('[data-action="sop:create"]');
  if (createBtn) {
    const panel = createBtn.closest<HTMLElement>(".ws-panel[data-panel]");
    const panelId = panel?.dataset.panel;

    if (panelId === "my-workspace") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const defaultDue = new Date(Date.now() + 3 * 86400000)
        .toISOString()
        .slice(0, 10);
      const formValues = await showFormModal<{
        title: string;
        due_date: string;
      }>({
        title: "Tambah Tugas Personal (Workspace)",
        icon: "lucide:check-circle-2",
        submitText: "Simpan Tugas",
        fields: [
          {
            name: "title",
            label: "Judul Tugas / Follow-Up",
            type: "text",
            required: true,
            placeholder: "Contoh: Follow up penawaran klien PT Cahaya Abadi",
          },
          {
            name: "due_date",
            label: "Tenggat Waktu (Due Date)",
            type: "date",
            required: true,
            value: defaultDue,
          },
        ],
      });

      if (!formValues) return true;
      try {
        await api.post("/api/v1/workspace/tasks", {
          title: formValues.title.trim(),
          due_at: formValues.due_date,
        });
        await refreshNativeWorkspace();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        window.alert(
          "Gagal menambah tugas: " + (e.response?.data?.message || String(err)),
        );
      }
      return true;
    }

    if (panelId === "quotation") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const defaultTime = new Date()
        .toISOString()
        .slice(0, 16)
        .replace("T", " ");
      const formValues = await showFormModal<{
        title: string;
        starts_at: string;
        location: string;
      }>({
        title: "Tambah Agenda / Pertemuan Baru",
        icon: "lucide:calendar-plus",
        submitText: "Simpan Agenda",
        fields: [
          {
            name: "title",
            label: "Judul Pertemuan / Agenda",
            type: "text",
            required: true,
            placeholder: "Contoh: Rapat Koordinasi Progress Implementasi",
          },
          {
            name: "starts_at",
            label: "Waktu Pelaksanaan (YYYY-MM-DD HH:mm)",
            type: "text",
            required: true,
            value: defaultTime,
            placeholder: "2026-10-20 14:00",
            halfWidth: true,
          },
          {
            name: "location",
            label: "Lokasi / Tautan Rapat",
            type: "text",
            value: "Ruang Rapat Utama / Google Meet",
            placeholder: "Contoh: Ruang Rapat 2 / Zoom",
            halfWidth: true,
          },
        ],
      });

      if (!formValues) return true;
      try {
        await api.post("/api/v1/workspace/calendar", {
          title: formValues.title.trim(),
          starts_at: formValues.starts_at.trim(),
          location: formValues.location.trim() || null,
        });
        await refreshNativeWorkspace();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        window.alert(
          "Gagal menambah agenda: " +
            (e.response?.data?.message || String(err)),
        );
      }
      return true;
    }
  }

  const row = target.closest<HTMLTableRowElement>("tr[data-record-id]");
  const panel = target.closest<HTMLElement>(".ws-panel[data-panel]");
  if (!row || !panel) return false;

  // 2. Toggle Task completion status
  if (
    panel.dataset.panel === "my-workspace" &&
    target.matches('input[data-action="table:select"]')
  ) {
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
  if (
    panel.dataset.panel === "projects" &&
    target.closest('[data-action="table:detail"]')
  ) {
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
