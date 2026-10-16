import { api } from "./client";
import type { OperationalProjectionBridge } from "./operationalProjectionBridge";
import { refreshNativeWorkspace } from "./workspaceProjection";
import { refreshNativeKpis } from "./kpiProjection";
import {
  showFormModal,
  showSelectModal,
  showConfirmModal,
} from "./modalHelper";

/** Captures native Projects task mutations before the prototype's fixture handler. */
export class ProjectTaskNativeBridge {
  private listener = (event: Event) => {
    void this.handle(event).catch((error) =>
      this.notice(
        error?.response?.data?.message || "Aksi task gagal disimpan.",
      ),
    );
  };
  constructor(private readonly operational: OperationalProjectionBridge) {}
  install() {
    document.addEventListener("click", this.listener, true);
    document.addEventListener("change", this.listener, true);
  }
  uninstall() {
    document.removeEventListener("click", this.listener, true);
    document.removeEventListener("change", this.listener, true);
  }
  private notice(message: string) {
    const toast = document.querySelector<HTMLElement>(
      '[data-page-id="projects"] .toast',
    );
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
      setTimeout(() => (toast.hidden = true), 4500);
    } else window.alert(message);
  }
  private async refresh() {
    await this.operational.refresh();
    window.dispatchEvent(new Event("sop:domain-updated"));
    await Promise.allSettled([refreshNativeWorkspace(), refreshNativeKpis()]);
  }
  private async handle(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-prototype-page][data-route="/projects"]'))
      return;
    const panel = target.closest<HTMLElement>('[data-bd-panel="task"]');
    if (!panel) return;
    const status = target.closest<HTMLSelectElement>(
      'select[data-bd-key="status"][data-bd-id]',
    );
    if (
      status &&
      event.type === "change" &&
      status.dataset.bdId?.startsWith("db-")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const value = status.value.toLowerCase().replaceAll(" ", "_");
      const taskId = status.dataset.bdId.slice(3);

      const cell = status.closest("td") || status.parentElement;
      status.disabled = true;
      status.classList.add("sop-inline-loading");

      let badge = cell?.querySelector<HTMLElement>(".sop-cell-loading-badge, .sop-cell-success-badge");
      if (!badge && cell) {
        badge = document.createElement("span");
        badge.className = "sop-cell-loading-badge";
        badge.innerHTML = `<span class="sop-spinner-inline" aria-hidden="true"></span> Menyimpan...`;
        cell.appendChild(badge);
      }

      document.body.classList.add("sop-api-busy");
      this.notice("Menyimpan status tugas...");

      try {
        await api.patch(
          `/api/v1/operational/project-tasks/${taskId}`,
          { status: value === "to_do" ? "todo" : value },
        );
        await this.refresh();

        if (badge) {
          badge.className = "sop-cell-success-badge";
          badge.innerHTML = `<iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon> Tersimpan`;
          setTimeout(() => badge?.remove(), 2500);
        }

        this.notice(`Status tugas berhasil diperbarui ke "${status.value}".`);
      } catch (err: unknown) {
        badge?.remove();
        const e = err as { response?: { data?: { message?: string } } };
        this.notice(e.response?.data?.message || "Gagal memperbarui status tugas.");
        await this.refresh();
      } finally {
        status.disabled = false;
        status.classList.remove("sop-inline-loading");
        document.body.classList.remove("sop-api-busy");
      }
      return;
    }
    const button = target.closest<HTMLElement>("[data-bd-act]");
    if (!button || event.type !== "click") return;
    const act = button.dataset.bdAct || "";
    if (!["add", "delrow", "assign"].includes(act)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (act === "delrow") {
      const id = button.dataset.bdId || "";
      if (!id.startsWith("db-")) return;
      const confirmed = await showConfirmModal({
        title: "Hapus Tugas Proyek",
        message: "Apakah Anda yakin ingin menghapus tugas ini dari proyek?",
        confirmText: "Ya, Hapus",
        isDanger: true,
      });
      if (!confirmed) return;
      await api.delete(`/api/v1/operational/project-tasks/${id.slice(3)}`);
      await this.refresh();
      this.notice("Tugas berhasil dihapus.");
      return;
    }
    if (act === "assign") {
      const pending = (
        window as unknown as {
          SOPBridge?: {
            getPendingRows: (
              route: string,
              panel: string,
            ) => { selected: string[] };
          };
        }
      ).SOPBridge?.getPendingRows("/projects", "task");
      const selected = (pending?.selected || []).filter((id) =>
        id.startsWith("db-"),
      );
      if (!selected.length) throw new Error("Pilih minimal satu task.");
      const users = (await api.get("/api/v1/operational/projects/options")).data
        .data.users as Array<{ id: string; name: string }>;

      const chosenUserId = await showSelectModal({
        title: "Tugaskan ke Anggota Tim",
        icon: "lucide:user-check",
        subtitle: `Pilih PIC yang akan bertanggung jawab atas ${selected.length} tugas terpilih:`,
        submitText: "Tugaskan PIC",
        options: users.map((u) => ({
          value: u.id,
          label: u.name,
        })),
      });
      if (!chosenUserId) return;
      const assignee = users.find((u) => u.id === chosenUserId);
      await Promise.all(
        selected.map((id) =>
          api.patch(`/api/v1/operational/project-tasks/${id.slice(3)}`, {
            assignee_id: chosenUserId,
          }),
        ),
      );
      await this.refresh();
      this.notice(
        `${selected.length} tugas ditugaskan ke ${assignee?.name || "anggota tim"}.`,
      );
      return;
    }
    const data = (await api.get("/api/v1/operational/projects")).data.data
      .projects as Array<{ id: string; code: string; name: string }>;
    if (!data.length) throw new Error("Belum ada data proyek aktif.");

    const formValues = await showFormModal<{
      project_id: string;
      title: string;
    }>({
      title: "Tambah Tugas Proyek (Task)",
      icon: "lucide:check-square",
      submitText: "Simpan Tugas",
      fields: [
        {
          name: "project_id",
          label: "Proyek",
          type: "select",
          required: true,
          options: data.map((p) => ({
            value: p.id,
            label: `${p.code} — ${p.name}`,
          })),
        },
        {
          name: "title",
          label: "Judul Tugas / Aktivitas",
          type: "text",
          required: true,
          placeholder: "Contoh: Persiapan UAT dan migrasi data pelanggan",
        },
      ],
    });
    if (!formValues) return;
    await api.post(
      `/api/v1/operational/projects/${formValues.project_id}/tasks`,
      { title: formValues.title.trim(), status: "todo" },
    );
    await this.refresh();
    this.notice("Tugas berhasil dibuat dan ditautkan ke proyek.");
  }
}
