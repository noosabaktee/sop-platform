import { api } from "./client";
import { showFormModal, showConfirmModal } from "./modalHelper";

type Approval = {
  id: string;
  subject_id: string;
  subject_type: string;
  status: string;
  number: string | null;
  amount: string | null;
  requester: string | null;
  decided_at: string | null;
  tier?: number;
  due_at?: string | null;
  delegated_from_id?: string | null;
  delegated_from_name?: string | null;
};

type Delegation = {
  id: string;
  scope: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  delegator_id: string;
  delegator_name: string;
  delegator_role: string;
  delegatee_id: string;
  delegatee_name: string;
  delegatee_role: string;
};

type MatrixRule = {
  id: string;
  subject_type: string;
  condition_label: string;
  min_amount: string;
  max_amount: string | null;
  required_role: string;
  level: number;
  sla_hours: number;
};

type SlaSummary = {
  total_pending: number;
  approaching_sla: number;
  breached_sla: number;
  compliance_percentage: number;
  approved_this_week: number;
};

type EscalationItem = {
  id: string;
  subject_id: string;
  subject_type: string;
  number: string | null;
  amount: string | null;
  requester_name: string | null;
  due_at: string | null;
  tier: number;
};

type CompanyUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const rupiah = (value: string | null) =>
  value == null
    ? "—"
    : "Rp " +
      new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(
        Number(value),
      );

const formatShortDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Preserves approved native markup, binds decisions, delegations, matrices, and SLA to real company-scoped transactions. */
export class ApprovalWorkflowBridge {
  private active = false;
  private busy = false;
  private approvals: Approval[] = [];
  private delegations: Delegation[] = [];
  private matrixRules: MatrixRule[] = [];
  private escalations: EscalationItem[] = [];
  private slaSummary: SlaSummary | null = null;
  private readonly templates = new Map<HTMLElement, HTMLElement>();

  constructor(private readonly canApprove: boolean) {}

  async install() {
    this.active = true;
    document.addEventListener("click", this.onClick, true);
    window.addEventListener("hashchange", this.onRoute);
    window.addEventListener("sop:workflow-updated", this.onRoute);
    await this.refresh();
  }

  uninstall() {
    this.active = false;
    document.removeEventListener("click", this.onClick, true);
    window.removeEventListener("hashchange", this.onRoute);
    window.removeEventListener("sop:workflow-updated", this.onRoute);
  }

  private readonly onRoute = () => {
    if (this.active)
      void this.refresh().catch((error) =>
        this.message("Refresh approval gagal: " + String(error)),
      );
  };

  private message(text: string) {
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="workflow"]',
    );
    const toast = root?.querySelector<HTMLElement>(".toast");
    if (toast) {
      toast.textContent = text;
      toast.hidden = false;
      window.setTimeout(() => (toast.hidden = true), 5000);
    } else {
      console.info(text);
    }
  }

  private readonly onClick = (event: MouseEvent) => {
    if (!this.active) return;
    const target = event.target as HTMLElement;
    const el = target.closest<HTMLElement>(
      '[data-wf-act],[data-action="wf:bulk"],[data-action="wf:delegate"],[data-action="wf:revoke-delegation"]',
    );
    if (!el || !el.closest('[data-page-id="workflow"]')) return;

    // Never allow the original demo handler to mutate a fake local approval queue.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.busy) return;

    if (el.dataset.action === "wf:delegate") {
      void this.handleCreateDelegation();
      return;
    }

    if (el.dataset.action === "wf:revoke-delegation") {
      const delId = el.dataset.delegationId;
      if (delId) void this.handleRevokeDelegation(delId);
      return;
    }

    if (!this.canApprove) {
      this.message("Akun ini tidak memiliki izin approval.");
      return;
    }

    if (el.dataset.action === "wf:bulk") {
      if (
        !this.approvals.some(
          (a) =>
            a.status === "pending" &&
            ["quotation", "purchase_request"].includes(a.subject_type),
        )
      ) {
        this.message("Tidak ada approval transaksi yang menunggu.");
        return;
      }
      void (async () => {
        const confirmed = await showConfirmModal({
          title: "Setujui Semua Transaksi (Bulk Approve)",
          message:
            "Apakah Anda yakin ingin menyetujui sekaligus semua transaksi yang memenuhi wewenang approval Anda?",
          confirmText: "Ya, Setujui Semua",
        });
        if (confirmed) {
          await this.bulkApprove();
        }
      })();
      return;
    }

    const parent = el.closest<HTMLElement>('[data-appr^="db-approval-"]');
    if (!parent) {
      this.message("Data persetujuan sedang dimuat...");
      return;
    }
    const id = el.dataset.id;
    if (!id) return;
    const kind = parent.dataset.sopSubjectType || "quotation";
    const action = el.dataset.wfAct;

    if (action === "steps") {
      this.message(
        "Alur " +
          (parent.querySelector(".appr__t")?.textContent || "quotation") +
          ": menunggu keputusan approver.",
      );
      return;
    }
    if (action === "revise") {
      if (kind === "purchase_request") {
        this.message(
          "Untuk Purchase Request, gunakan tombol Setujui atau Tolak dengan alasan.",
        );
        return;
      }
      void (async () => {
        const form = await showFormModal<{ comment: string }>({
          title: "Permintaan Revisi Dokumen",
          icon: "lucide:file-edit",
          iconColor: "#eab308",
          submitText: "Kirim Permintaan Revisi",
          fields: [
            {
              name: "comment",
              label: "Catatan / Instruksi Revisi untuk Pengaju",
              type: "textarea",
              required: true,
              placeholder:
                "Jelaskan poin-poin yang perlu diperbaiki oleh pengaju...",
            },
          ],
        });
        if (!form) return;
        await this.decide(
          id,
          "revision_requested",
          el as HTMLButtonElement,
          form.comment.trim(),
          kind,
        );
      })();
      return;
    }
    if (action === "approve" || action === "reject") {
      const decision = action === "approve" ? "approved" : "rejected";
      if (decision === "rejected") {
        void (async () => {
          const form = await showFormModal<{ comment: string }>({
            title: "Tolak Pengajuan Dokumen",
            icon: "lucide:x-circle",
            iconColor: "#dc2626",
            submitText: "Tolak Dokumen",
            fields: [
              {
                name: "comment",
                label: "Alasan Penolakan",
                type: "textarea",
                required: true,
                placeholder:
                  "Tuliskan alasan penolakan agar diketahui pengaju...",
              },
            ],
          });
          if (!form) return;
          await this.decide(
            id,
            "rejected",
            el as HTMLButtonElement,
            form.comment.trim(),
            kind,
          );
        })();
        return;
      }
      void this.decide(id, decision, el as HTMLButtonElement, "", kind);
    }
  };

  private async handleCreateDelegation() {
    this.busy = true;
    document.body.classList.add("sop-api-busy");
    try {
      const res = await api.get("/api/v1/approvals/users");
      const users = (res.data.data as CompanyUser[]) || [];
      if (!users.length) {
        this.message("Tidak ada user lain di perusahaan untuk didelegasikan.");
        return;
      }

      this.busy = false;
      document.body.classList.remove("sop-api-busy");

      const formValues = await showFormModal<{
        delegatee_id: string;
        scope: string;
        days: number;
        reason: string;
      }>({
        title: "Buat Delegasi Wewenang Approval",
        icon: "lucide:user-plus",
        submitText: "Simpan Delegasi",
        fields: [
          {
            name: "delegatee_id",
            label: "Penerima Delegasi Wewenang",
            type: "select",
            required: true,
            options: users.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.role} — ${u.email})`,
            })),
          },
          {
            name: "scope",
            label: "Cakupan Dokumen Approval",
            type: "select",
            required: true,
            options: [
              {
                value: "all",
                label: "Semua Transaksi (Quotation & Purchase Request)",
              },
              { value: "quotation", label: "Hanya Quotation Penjualan" },
              {
                value: "purchase_request",
                label: "Hanya Purchase Request (Pengadaan)",
              },
            ],
            halfWidth: true,
          },
          {
            name: "days",
            label: "Durasi Delegasi (Hari)",
            type: "number",
            required: true,
            min: 1,
            max: 365,
            value: 7,
            halfWidth: true,
          },
          {
            name: "reason",
            label: "Alasan Pendelegasian",
            type: "text",
            value: "Cuti tahunan",
            placeholder: "Contoh: Cuti tahunan / Perjalanan dinas luar kota",
          },
        ],
      });

      if (!formValues) return;

      const targetUser = users.find((u) => u.id === formValues.delegatee_id);
      const days = Number(formValues.days) || 7;
      const startDate = new Date();
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      this.busy = true;
      document.body.classList.add("sop-api-busy");

      await api.post("/api/v1/approvals/delegations", {
        delegatee_id: formValues.delegatee_id,
        scope: formValues.scope,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason: formValues.reason.trim() || null,
      });

      this.message(
        `Delegasi wewenang approval kepada ${targetUser?.name || "rekan kerja"} (${formValues.scope}) berhasil disimpan.`,
      );
      await this.refresh();
      window.dispatchEvent(new Event("sop:workflow-updated"));
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } };
      this.message(
        "Gagal membuat delegasi: " +
          (e.response?.data?.message || String(error)),
      );
    } finally {
      this.busy = false;
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async handleRevokeDelegation(delegationId: string) {
    const confirmed = await showConfirmModal({
      title: "Cabut Delegasi Approval",
      message:
        "Apakah Anda yakin ingin mencabut wewenang delegasi approval ini sekarang?",
      confirmText: "Ya, Cabut Delegasi",
      isDanger: true,
    });
    if (!confirmed) return;
    this.busy = true;
    document.body.classList.add("sop-api-busy");
    try {
      await api.post(`/api/v1/approvals/delegations/${delegationId}/revoke`);
      this.message("Delegasi wewenang berhasil dicabut.");
      await this.refresh();
      window.dispatchEvent(new Event("sop:workflow-updated"));
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } };
      this.message(
        "Gagal mencabut delegasi: " +
          (e.response?.data?.message || String(error)),
      );
    } finally {
      this.busy = false;
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async requestDecision(
    id: string,
    decision: string,
    comment = "",
    kind = "quotation",
  ) {
    if (kind === "purchase_request") {
      await api.post(`/api/v1/workflows/purchase-requests/${id}/decision`, {
        decision,
        reason: comment,
      });
    } else {
      await api.post(`/api/v1/workflows/quotations/${id}/decision`, {
        decision,
        comment,
      });
    }
  }

  private async decide(
    id: string,
    decision: string,
    button: HTMLButtonElement,
    comment = "",
    kind = "quotation",
  ) {
    this.busy = true;
    button.disabled = true;
    document.body.classList.add("sop-api-busy");
    try {
      await this.requestDecision(id, decision, comment, kind);
      await this.refresh();
      window.dispatchEvent(new Event("sop:workflow-updated"));
      this.message(
        "Keputusan persetujuan (" + decision + ") berhasil diproses.",
      );
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } };
      this.message(
        "Approval gagal: " + (e.response?.data?.message || String(error)),
      );
    } finally {
      button.disabled = false;
      this.busy = false;
      document.body.classList.remove("sop-api-busy");
    }
  }

  private async bulkApprove() {
    this.busy = true;
    document.body.classList.add("sop-api-busy");
    let success = 0;
    let errors = 0;
    try {
      for (const item of this.approvals.filter(
        (a) =>
          a.status === "pending" &&
          ["quotation", "purchase_request"].includes(a.subject_type),
      )) {
        try {
          await this.requestDecision(
            item.subject_id,
            "approved",
            "",
            item.subject_type,
          );
          success++;
        } catch {
          errors++;
        }
      }
      await this.refresh();
      window.dispatchEvent(new Event("sop:workflow-updated"));
      this.message(
        `Approval massal: ${success} berhasil, ${errors} gagal (izin/status).`,
      );
    } catch (error) {
      this.message("Bulk approval gagal: " + String(error));
    } finally {
      this.busy = false;
      document.body.classList.remove("sop-api-busy");
    }
  }

  private emptyState(
    title = "Tidak ada approval",
    subtitle = "Semua sudah diproses.",
  ) {
    const div = document.createElement("div");
    div.className = "list-plain";
    div.innerHTML = `<div class="list-item"><iconify-icon noobserver icon="lucide:inbox" aria-hidden="true"></iconify-icon><div class="list-body"><p class="list-title">${title}</p><p class="list-meta">${subtitle}</p></div></div>`;
    return div;
  }

  async refresh() {
    if (!this.active) return;
    const root = document.querySelector<HTMLElement>(
      '[data-page-id="workflow"]',
    );
    if (!root) return;

    try {
      const [apprRes, delRes, matRes, escRes, slaRes] = await Promise.all([
        api.get("/api/v1/workflows/transaction-approvals"),
        api.get("/api/v1/approvals/delegations"),
        api.get("/api/v1/approvals/matrix"),
        api.get("/api/v1/approvals/escalations"),
        api.get("/api/v1/approvals/sla-summary"),
      ]);

      this.approvals = apprRes.data.data as Approval[];
      this.delegations = (delRes.data.data as Delegation[]) || [];
      this.matrixRules = (matRes.data.data as MatrixRule[]) || [];
      this.escalations = (escRes.data.data as EscalationItem[]) || [];
      this.slaSummary = (slaRes.data.data as SlaSummary) || null;
    } catch (error) {
      console.warn("Gagal memuat data pendukung workflow approval:", error);
      const { data } = await api.get("/api/v1/workflows/transaction-approvals");
      this.approvals = data.data as Approval[];
    }

    const pending = this.approvals.filter(
      (a) =>
        a.status === "pending" &&
        ["quotation", "purchase_request"].includes(a.subject_type) &&
        a.number,
    );

    // 1. Render Pending & MyApproval panels
    for (const section of root.querySelectorAll<HTMLElement>(
      '[data-tabpanel="myapproval"],[data-tabpanel="pending"]',
    )) {
      const existing = section.querySelector<HTMLElement>("[data-appr]");
      if (existing && !this.templates.has(section))
        this.templates.set(section, existing.cloneNode(true) as HTMLElement);
      const template = this.templates.get(section);
      const host =
        section.querySelector<HTMLElement>("[data-db-approvals]") ||
        existing?.parentElement;
      if (!host || !template) continue;
      host.dataset.dbApprovals = "1";
      host.replaceChildren(
        ...(pending.length
          ? pending.map((item) => {
              const node = template.cloneNode(true) as HTMLElement;
              node.dataset.appr = "db-approval-" + item.id;
              node.dataset.sopSubjectType = item.subject_type;
              const title = node.querySelector<HTMLElement>(".appr__t");
              if (title) {
                title.textContent =
                  (item.number || "Transaksi") +
                  " · " +
                  (item.subject_type === "purchase_request"
                    ? "Purchase Request"
                    : "Quotation");
              }
              const meta = node.querySelector<HTMLElement>(".appr__m");
              if (meta) {
                const dueText = item.due_at
                  ? ` · Due: ${formatShortDate(item.due_at)}`
                  : "";
                const delText = item.delegated_from_name
                  ? ` · Delegasi dari ${item.delegated_from_name}`
                  : "";
                meta.textContent = `Pengaju ${item.requester || "—"}${dueText}${delText}`;
              }
              const facts =
                node.querySelectorAll<HTMLElement>(".appr__fact .v");
              if (facts[0]) facts[0].textContent = rupiah(item.amount);
              if (facts[1])
                facts[1].textContent = item.tier
                  ? `Tier ${item.tier}`
                  : item.subject_type === "purchase_request"
                    ? "Approval pembelian"
                    : "Approval quotation";
              if (facts[2]) facts[2].textContent = "Menunggu";
              node
                .querySelectorAll<HTMLElement>("[data-wf-act]")
                .forEach((btn) => {
                  btn.dataset.id = item.subject_id;
                  if (
                    !this.canApprove &&
                    (btn.dataset.wfAct === "approve" ||
                      btn.dataset.wfAct === "reject" ||
                      btn.dataset.wfAct === "revise")
                  ) {
                    (btn as HTMLButtonElement).disabled = true;
                  }
                });
              return node;
            })
          : [this.emptyState()]),
      );
      const count = section.querySelector<HTMLElement>(
        ".section-card__heading .chip",
      );
      if (count) count.textContent = pending.length + " menunggu";
    }

    // 2. Render Delegation panel
    const delPanel = root.querySelector<HTMLElement>(
      '[data-tabpanel="delegation"]',
    );
    if (delPanel) {
      const listContainer = delPanel.querySelector<HTMLElement>(".list-plain");
      if (listContainer) {
        if (!this.delegations.length) {
          listContainer.replaceChildren(
            this.emptyState(
              "Belum ada delegasi",
              "Wewenang approval belum dialihkan ke approver lain.",
            ),
          );
        } else {
          listContainer.innerHTML = this.delegations
            .map((d) => {
              const statusClass =
                d.status === "active"
                  ? "done"
                  : d.status === "expired"
                    ? "pending"
                    : "risk";
              const statusLabel =
                d.status === "active"
                  ? "Aktif"
                  : d.status === "expired"
                    ? "Berakhir"
                    : "Dicabut";
              const scopeLabel =
                d.scope === "all"
                  ? "Semua Transaksi"
                  : d.scope === "quotation"
                    ? "Quotation"
                    : "Purchase Request";
              const period = `${formatShortDate(d.start_date)} – ${formatShortDate(d.end_date)}`;
              const reasonText = d.reason ? ` · ${d.reason}` : "";
              const revokeBtn =
                d.status === "active"
                  ? `<button type="button" class="btn-ghost" data-action="wf:revoke-delegation" data-delegation-id="${d.id}" style="padding:4px 10px;font-size:12px;cursor:pointer;"><iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon> Cabut</button>`
                  : "";
              return `
                <div class="list-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border,#e2e8f0);">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <iconify-icon noobserver icon="lucide:user-plus" aria-hidden="true"></iconify-icon>
                    <div class="list-body">
                      <p class="list-title" style="font-weight:600;margin:0 0 2px 0;">${d.delegator_name} → ${d.delegatee_name} (${d.delegatee_role})</p>
                      <p class="list-meta" style="margin:0;font-size:12px;color:var(--text-muted,#64748b);">Scope: ${scopeLabel} · ${period}${reasonText}</p>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="chip ${statusClass}">${statusLabel}</span>
                    ${revokeBtn}
                  </div>
                </div>`;
            })
            .join("");
        }
      }
    }

    // 3. Render Escalation panel
    const escPanel = root.querySelector<HTMLElement>(
      '[data-tabpanel="escalation"]',
    );
    if (escPanel) {
      const escContainer = escPanel.querySelector<HTMLElement>(".list-plain");
      if (escContainer) {
        if (!this.escalations.length) {
          escContainer.replaceChildren(
            this.emptyState(
              "Tidak ada eskalasi SLA",
              "Semua transaksi masih dalam koridor waktu SLA.",
            ),
          );
        } else {
          escContainer.innerHTML = this.escalations
            .map((e) => {
              const due = e.due_at ? formatShortDate(e.due_at) : "—";
              const typeLabel =
                e.subject_type === "purchase_request"
                  ? "Purchase Request"
                  : "Quotation";
              return `
                <div class="list-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border,#e2e8f0);">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true" style="color:var(--danger,#ef4444);"></iconify-icon>
                    <div class="list-body">
                      <p class="list-title" style="font-weight:600;margin:0 0 2px 0;">${e.number || "Transaksi"} · ${typeLabel}</p>
                      <p class="list-meta" style="margin:0;font-size:12px;color:var(--text-muted,#64748b);">Pengaju: ${e.requester_name || "—"} · Jatuh tempo: ${due} · Nilai: ${rupiah(e.amount)}</p>
                    </div>
                  </div>
                  <span class="chip risk">SLA breach</span>
                </div>`;
            })
            .join("");
        }
      }
    }

    // 4. Render Approval Matrix table
    const matPanel = root.querySelector<HTMLElement>(
      '[data-tabpanel="matrix"]',
    );
    if (matPanel && this.matrixRules.length) {
      const tbody = matPanel.querySelector<HTMLElement>("table.matrix tbody");
      if (tbody) {
        tbody.innerHTML = this.matrixRules
          .map(
            (r) => `
            <tr>
              <td class="lvl" style="font-weight:500;">${r.condition_label}</td>
              <td>${r.required_role}</td>
              <td>Level ${r.level} (${r.sla_hours} jam SLA)</td>
            </tr>`,
          )
          .join("");
      }
    }

    // 5. Update KPI Cards
    for (const value of root.querySelectorAll<HTMLElement>(
      ".kpi-row .kpi:nth-child(1) .kpi__value",
    )) {
      value.textContent = String(pending.length);
    }
    const weeklyCount = this.slaSummary
      ? this.slaSummary.approved_this_week
      : this.approvals.filter(
          (a) =>
            a.status === "approved" &&
            a.decided_at &&
            new Date(a.decided_at).getTime() >= Date.now() - 7 * 86400000,
        ).length;
    for (const value of root.querySelectorAll<HTMLElement>(
      ".kpi-row .kpi:nth-child(2) .kpi__value",
    )) {
      value.textContent = String(weeklyCount);
    }

    const complianceRate = this.slaSummary
      ? `${this.slaSummary.compliance_percentage}%`
      : "100%";
    const breachCount = this.slaSummary ? this.slaSummary.breached_sla : 0;
    for (const value of root.querySelectorAll<HTMLElement>(
      ".kpi-row .kpi:nth-child(3) .kpi__value",
    )) {
      value.textContent = complianceRate;
    }
    for (const label of root.querySelectorAll<HTMLElement>(
      ".kpi-row .kpi:nth-child(3) .kpi__comparison small",
    )) {
      label.textContent = `target 95% · ${breachCount} breach`;
    }
  }
}
