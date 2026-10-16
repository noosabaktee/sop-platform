import { api } from "./client";
import { showLockedTransactionModal } from "./modalHelper";

type Row = { __id: string; __new?: boolean; [key: string]: unknown };
type GridState = {
  rows: Row[];
  staged?: Map<string, unknown>;
  selected?: Set<string>;
  seq?: number;
};
type Snapshot = {
  route: string;
  panel_id: string;
  rows: Row[];
  version: number;
};
type MountedGrid = {
  route: string;
  panel_id: string;
  state: GridState;
  render: () => void;
};
const key = (route: string, id: string) => `${route}|${id}`;
const committed = (state: GridState): Row[] =>
  state.rows.filter((r) => !r.__new).map((r) => structuredClone(r));
const same = (a: Row[], b: Row[]) => JSON.stringify(a) === JSON.stringify(b);

interface DomainBannerConfig {
  icon: string;
  badge: string;
  tone: "blue" | "green" | "amber" | "slate";
  title: string;
  desc: string;
  flow: string;
}

const DOMAIN_BANNERS: Record<string, DomainBannerConfig> = {
  // Finance
  "/finance|accounting": {
    icon: "lucide:book-open",
    badge: "Buku Besar Resmi",
    tone: "amber",
    title: "Entri Jurnal Umum & Buku Besar Terverifikasi",
    desc: "Tabel ini menyajikan pencatatan jurnal debit dan kredit resmi yang dibukukan secara otomatis dari transaksi penjualan, pengadaan, dan kas/bank.",
    flow: "Demi kepatuhan akuntansi dan integritas audit, entri jurnal yang telah dibukukan tidak dapat diubah secara langsung di tabel. Untuk membuat jurnal penyesuaian baru, klik tombol '+ Tambah' di atas.",
  },
  "/finance|cash": {
    icon: "lucide:landmark",
    badge: "Rekonsiliasi Kas & Bank",
    tone: "amber",
    title: "Rekapitulasi Rekening Bank & Mutasi Kas",
    desc: "Tabel ini memuat daftar rekening perusahaan dan mutasi kas masuk/keluar yang telah diverifikasi.",
    flow: "Untuk mendaftarkan rekening bank baru atau mengimpor mutasi rekening koran (bank statement), gunakan tombol '+ Tambah' di atas.",
  },
  // Inventory
  "/inventory|opname": {
    icon: "lucide:clipboard-check",
    badge: "Stock Opname",
    tone: "blue",
    title: "Hasil Perhitungan Fisik Stok Gudang",
    desc: "Tabel ini mencatat hasil perhitungan fisik stock opname barang di gudang sebagai pembanding stok tercatat di sistem.",
    flow: "Data hasil opname bersifat historis. Untuk menjadwalkan atau memulai sesi stock opname baru, klik tombol '+ Tambah' di atas.",
  },
  "/inventory|adjustment": {
    icon: "lucide:sliders-horizontal",
    badge: "Penyesuaian Stok",
    tone: "amber",
    title: "Dokumen Penyesuaian Kuantitas Persediaan",
    desc: "Tabel ini memuat rekaman penyesuaian stok yang telah disetujui supervisor gudang untuk mencocokkan stok fisik dan buku persediaan.",
    flow: "Setiap penyesuaian stok otomatis memperbarui kartu stok dan nilai persediaan di neraca. Pengajuan penyesuaian baru dilakukan melalui tombol '+ Tambah' di atas.",
  },
  // Projects
  "/projects|cost": {
    icon: "lucide:receipt",
    badge: "Biaya Aktual Proyek",
    tone: "blue",
    title: "Rekapitulasi Pembebanan Biaya Riil Proyek",
    desc: "Tabel ini mengakumulasi seluruh biaya riil (aktual) proyek yang bersumber dari Purchase Order, pengeluaran kas, dan material.",
    flow: "Pembebanan biaya terjadi otomatis saat transaksi pengadaan atau kas keluar ditautkan ke kode proyek. Untuk mencatat biaya langsung proyek, gunakan tombol '+ Tambah' di atas.",
  },
  "/projects|profitability": {
    icon: "lucide:trending-up",
    badge: "Analisis Profitabilitas",
    tone: "green",
    title: "Analisis Marjin & Kinerja Finansial Proyek",
    desc: "Tabel ini menyajikan perhitungan profitabilitas proyek berdasarkan perbandingan nilai pendapatan kontrak terhadap akumulasi biaya aktual.",
    flow: "Nilai keuntungan dan marjin dihitung secara otomatis oleh sistem secara real-time berdasarkan faktur penjualan dan realisasi biaya proyek.",
  },
  // Sales
  "/sales|order": {
    icon: "lucide:shopping-cart",
    badge: "Pesanan Penjualan",
    tone: "blue",
    title: "Dokumen Sales Order (Pesanan Penjualan) Resmi",
    desc: "Tabel ini memuat pesanan penjualan yang telah disepakati bersama pelanggan dan terdaftar resmi di sistem.",
    flow: "Sales Order yang telah dikonfirmasi menjadi dasar penerbitan Surat Jalan dan Faktur Penjualan. Pengubahan data langsung pada tabel dinonaktifkan demi konsistensi rantai pasok.",
  },
  "/sales|delivery": {
    icon: "lucide:truck",
    badge: "Pengiriman Barang",
    tone: "blue",
    title: "Surat Jalan & Bukti Pengiriman Barang",
    desc: "Tabel ini mencatat seluruh dokumen pengiriman barang ke pelanggan yang diterbitkan dari Sales Order.",
    flow: "Penerbitan surat jalan memotong kuantitas stok di gudang secara otomatis. Surat jalan baru diterbitkan melalui proses pemenuhan pesanan pada modul Penjualan/Gudang.",
  },
  "/sales|return": {
    icon: "lucide:undo-2",
    badge: "Retur Penjualan",
    tone: "amber",
    title: "Dokumen Retur & Pengembalian Barang",
    desc: "Tabel ini mencatat pengembalian barang dari pelanggan yang telah diverifikasi oleh tim quality control dan gudang.",
    flow: "Retur penjualan otomatis mengembalikan stok ke gudang dan menerbitkan nota kredit piutang. Proses retur diajukan melalui alur verifikasi resmi retur penjualan.",
  },
  "/sales|invoice": {
    icon: "lucide:file-text",
    badge: "Faktur Tagihan",
    tone: "blue",
    title: "Faktur Penjualan (Sales Invoice) Resmi",
    desc: "Tabel ini memuat faktur tagihan resmi yang diterbitkan kepada pelanggan beserta tanggal jatuh tempo pembayarannya.",
    flow: "Penerbitan faktur otomatis mengakui piutang usaha dan kewajiban pajak PPN. Pelunasan tagihan dicatat melalui alur pelunasan faktur.",
  },
  "/sales|payment": {
    icon: "lucide:credit-card",
    badge: "Penerimaan Kas",
    tone: "green",
    title: "Bukti Penerimaan Pembayaran Pelanggan",
    desc: "Tabel ini mencatat seluruh pembayaran pelanggan yang telah masuk ke rekening kas atau bank perusahaan.",
    flow: "Penerimaan pembayaran secara otomatis memotong saldo piutang pelanggan dan membukukan mutasi debet kas/bank pada buku besar.",
  },
  "/sales|ar": {
    icon: "lucide:scale",
    badge: "Buku Pembantu Piutang",
    tone: "slate",
    title: "Buku Pembantu Piutang Usaha (Aging AR)",
    desc: "Tabel ini menampilkan saldo piutang usaha dan klasifikasi umur piutang per pelanggan secara komprehensif.",
    flow: "Saldo piutang diperbarui secara otomatis dari transaksi faktur penjualan dan pelunasan pembayaran. Data ini bersifat laporan analitis.",
  },
  // Purchase
  "/purchase|request": {
    icon: "lucide:file-plus",
    badge: "Permintaan Pembelian",
    tone: "blue",
    title: "Pengajuan Permintaan Pembelian (Purchase Request)",
    desc: "Tabel ini memuat pengajuan pengadaan barang/jasa dari masing-masing departemen internal.",
    flow: "Permintaan yang telah disetujui (Approved) akan diteruskan ke departemen pengadaan untuk diterbitkan menjadi Purchase Order (PO). Klik '+ Tambah' untuk mengajukan permintaan baru.",
  },
  // Business Development
  "/business-development|tender": {
    icon: "lucide:briefcase",
    badge: "Tender Bisnis",
    tone: "blue",
    title: "Daftar Partisipasi Tender Resmi",
    desc: "Tabel ini merangkum keikutsertaan tender resmi yang sedang berlangsung beserta jadwal evaluasi dokumen.",
    flow: "Status tahapan tender diperbarui sesuai proses pembukaan dokumen dan evaluasi panitia tender pada menu rincian terkait.",
  },
  "/business-development|proposal": {
    icon: "lucide:file-check",
    badge: "Proposal Komersial",
    tone: "blue",
    title: "Dokumen Proposal Penawaran & Presentasi",
    desc: "Tabel ini memuat berkas proposal teknis dan penawaran harga yang diajukan ke prospek pelanggan.",
    flow: "Proposal yang disetujui klien akan dialihkan statusnya menjadi dokumen kontrak atau diterbitkan Sales Order.",
  },
  // Reports
  "/reports|financial": {
    icon: "lucide:bar-chart-3",
    badge: "Laporan Keuangan",
    tone: "green",
    title: "Laporan Keuangan Resmi Perusahaan",
    desc: "Laporan ini menyajikan posisi keuangan, laba rugi, dan arus kas yang dihasilkan langsung dari buku besar akuntansi.",
    flow: "Data laporan terproyeksi otomatis dari seluruh transaksi yang telah terverifikasi. Gunakan tombol 'Export' di toolbar untuk mengunduh laporan dalam format Excel.",
  },
  "/reports|sales": {
    icon: "lucide:bar-chart-2",
    badge: "Laporan Penjualan",
    tone: "blue",
    title: "Laporan Analisis Penjualan & Pendapatan",
    desc: "Laporan ini merekapitulasi volume dan nilai penjualan per pelanggan, produk, serta tenaga penjual.",
    flow: "Dihasilkan secara otomatis dari transaksi faktur dan pesanan penjualan. Gunakan tombol 'Export' untuk mengunduh laporan dalam format Excel.",
  },
  "/reports|purchase": {
    icon: "lucide:pie-chart",
    badge: "Laporan Pengadaan",
    tone: "amber",
    title: "Laporan Pembelian & Pengeluaran Vendor",
    desc: "Laporan ini merangkum realisasi belanja pengadaan barang/jasa per vendor dan kategori beban.",
    flow: "Dihasilkan secara otomatis dari Purchase Order dan tagihan vendor yang terverifikasi. Gunakan tombol 'Export' untuk mengunduh file Excel.",
  },
};

/** All data handling lives outside the frozen prototype UI.
 * The original JavaScript owns interaction and staging; PostgreSQL owns committed rows.
 * A debounced commit detector catches native save/delete, drag/drop, status, quick-create
 * and drawer actions across every mounted grid without touching CSS/DOM markup. */
export class GridBridge {
  private loaded = new Map<string, Snapshot>();
  private mounted = new Map<string, MountedGrid>();
  private queue: Promise<void> = Promise.resolve();
  private busyCount = 0;
  private initializing: Promise<void> | null = null;
  private timer: number | undefined;
  private dirtyWhileSaving = false;
  private authenticated = false;
  private authoritative = new Set<string>();
  constructor(snapshots: Snapshot[]) {
    this.loadToCache(snapshots);
  }
  private loadToCache(snapshots: Snapshot[]) {
    for (const snapshot of snapshots)
      this.loaded.set(key(snapshot.route, snapshot.panel_id), {
        ...snapshot,
        rows: structuredClone(snapshot.rows),
      });
  }
  private repairRedactedLeadFixture(
    route: string,
    panelId: string,
    state: GridState,
  ) {
    if (route !== "/crm-sales" || panelId !== "leads" || state.rows.length < 2)
      return;
    const fixture = state.rows.every((row) =>
      /^leads-\d+$/.test(String(row.__id)),
    );
    const emails = state.rows.map((row) =>
      String(row.email || "")
        .trim()
        .toLowerCase(),
    );
    // The supplied frozen prototype has privacy-redacted sample addresses that
    // collapse to one value. Repair only that deterministic fixture; genuine
    // user duplicates must still be rejected by the native CRM validator.
    if (fixture && emails.every(Boolean) && new Set(emails).size === 1) {
      state.rows.forEach((row, index) => {
        row.email = `lead-${index + 1}@example.invalid`;
      });
    }
  }
  attach(
    route: string,
    panel_id: string,
    state: GridState,
    render: () => void,
  ) {
    const saved = this.loaded.get(key(route, panel_id));
    if (saved && !this.authoritative.has(key(route, panel_id))) {
      const defaultMap = new Map(state.rows.map((r) => [String(r.__id), r]));
      state.rows = saved.rows.map((row) => {
        const def = defaultMap.get(String(row.__id));
        return def ? { ...def, ...row } : { ...row };
      });
    }
    this.repairRedactedLeadFixture(route, panel_id, state);
    const largestNewId = state.rows.reduce(
      (max, row) =>
        Math.max(max, Number(String(row.__id).match(/-new-(\d+)$/)?.[1] || 0)),
      0,
    );
    state.seq = Math.max(state.seq || 0, state.rows.length, largestNewId);
    this.mounted.set(key(route, panel_id), { route, panel_id, state, render });
    // Some native tabs build their grid lazily; seed those when first opened.
    if (this.authenticated && !saved)
      void this.seedUninitialized().catch(console.error);
    if (this.isDomainReadOnly(route, panel_id)) {
      this.applyDomainTableEnhancements(route, panel_id);
    }
  }
  has(route: string, panelId: string) {
    return this.mounted.has(key(route, panelId));
  }
  private busy(on: boolean) {
    this.busyCount = Math.max(0, this.busyCount + (on ? 1 : -1));
    document.body.classList.toggle("sop-api-busy", this.busyCount > 0);
  }
  private message(msg: string, isError = false, modal = true) {
    const root = document.querySelector<HTMLElement>(
      "[data-prototype-page]:not([hidden])",
    );
    const toast = root?.querySelector<HTMLElement>(".toast");
    if (toast) {
      toast.hidden = false;
      toast.textContent = msg;
      if (isError) toast.setAttribute("role", "alert");
      window.setTimeout(() => (toast.hidden = true), 6000);
    }
    if (isError) {
      console.error(msg);
      if (modal) window.alert(msg);
    }
  }
  loadSnapshots(snapshots: Snapshot[]) {
    this.loadToCache(snapshots);
    for (const snapshot of snapshots) {
      const grid = this.mounted.get(key(snapshot.route, snapshot.panel_id));
      if (
        grid &&
        !this.authoritative.has(key(snapshot.route, snapshot.panel_id))
      ) {
        const defaultMap = new Map(
          grid.state.rows.map((r) => [String(r.__id), r]),
        );
        grid.state.rows = snapshot.rows.map((row) => {
          const def = defaultMap.get(String(row.__id));
          return def ? { ...def, ...row } : { ...row };
        });
        grid.state.staged?.clear();
        grid.state.selected?.clear();
        grid.state.seq = Math.max(grid.state.seq || 0, grid.state.rows.length);
        grid.render();
      }
    }
  }
  applyWorkflowSnapshots(snapshots: Snapshot[]) {
    this.loadToCache(snapshots);
    for (const snapshot of snapshots) {
      const grid = this.mounted.get(key(snapshot.route, snapshot.panel_id));
      if (!grid) continue;
      grid.state.rows = structuredClone(snapshot.rows);
      grid.state.staged?.clear();
      grid.state.selected?.clear();
      grid.state.seq = Math.max(grid.state.seq || 0, grid.state.rows.length);
      grid.render();
    }
  }
  /** Initialize native reference data in SQL once only, without overwriting any stored user changes. */
  async seedUninitialized() {
    if (this.initializing) return this.initializing;
    const task = (async () => {
      this.busy(true);
      try {
        // Native panels are mounted lazily. Keep draining the missing set so a
        // panel mounted while another seed request is in flight is not skipped.
        while (true) {
          const missing = [...this.mounted.values()].filter(
            (x) =>
              !this.loaded.has(key(x.route, x.panel_id)) &&
              !this.authoritative.has(key(x.route, x.panel_id)),
          );
          if (!missing.length) break;
          for (let i = 0; i < missing.length; i += 25) {
            const part = missing.slice(i, i + 25);
            const response = await api.put("/api/v1/grid-snapshots", {
              seed_only: true,
              snapshots: part.map((x) => ({
                route: x.route,
                panel_id: x.panel_id,
                rows: committed(x.state),
              })),
            });
            for (const item of response.data.data as {
              route: string;
              panel_id: string;
              version: number;
            }[]) {
              const k = key(item.route, item.panel_id);
              const grid = this.mounted.get(k);
              if (grid)
                this.loaded.set(k, { ...item, rows: committed(grid.state) });
            }
          }
        }
        this.authenticated = true;
      } catch (error) {
        const response = (
          error as {
            response?: {
              status?: number;
              data?: { message?: string; errors?: unknown };
            };
          }
        ).response;
        const detail =
          response?.data?.message || `HTTP ${response?.status || "network"}`;
        // Background initialization must not block the whole page with a
        // browser alert. Keep the error visible as a toast and in DevTools.
        console.error(
          "Grid initialization failed",
          response?.status,
          response?.data || error,
        );
        this.message(
          `Sinkronisasi tabel belum berhasil (${detail}). Coba refresh halaman.`,
          true,
          false,
        );
        throw error;
      } finally {
        this.busy(false);
      }
    })();
    this.initializing = task;
    try {
      await task;
    } finally {
      if (this.initializing === task) this.initializing = null;
    }
  }
  /** Native UI handles optimistic edit; the actual committed rows always get written to SQL. */
  scheduleSync(delay = 90) {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      void this.persistDirty().catch(console.error);
    }, delay);
  }
  async persistRoute(route: string, panelId?: string) {
    return this.persistDirty(route, panelId);
  }
  async persistDirty(route?: string, panelId?: string): Promise<void> {
    // Snapshot initialization must complete before a user change can be versioned.
    if (this.initializing) {
      await this.initializing;
    }
    if (!this.authenticated) return;
    const operation = async () => {
      const dirty = [...this.mounted.values()].filter(
        (g) =>
          (!route || g.route === route) &&
          (!panelId || g.panel_id === panelId) &&
          !this.authoritative.has(key(g.route, g.panel_id)) &&
          !same(
            committed(g.state),
            this.loaded.get(key(g.route, g.panel_id))?.rows || [],
          ),
      );
      if (!dirty.length) return;
      this.busy(true);
      try {
        for (let i = 0; i < dirty.length; i += 25) {
          const group = dirty.slice(i, i + 25);
          const payloads = group.map((g) => ({
            route: g.route,
            panel_id: g.panel_id,
            rows: committed(g.state),
            version: this.loaded.get(key(g.route, g.panel_id))?.version,
          }));
          const { data: result } = await api.put("/api/v1/grid-snapshots", {
            snapshots: payloads,
          });
          for (const version of result.data as {
            route: string;
            panel_id: string;
            version: number;
          }[]) {
            const submitted = payloads.find(
              (p) =>
                p.route === version.route && p.panel_id === version.panel_id,
            );
            if (submitted)
              this.loaded.set(key(version.route, version.panel_id), {
                ...version,
                rows: submitted.rows,
              });
          }
        }
        this.message("Perubahan data berhasil disimpan.");
      } catch (error) {
        console.error("Persistence error", error);
        this.message(
          "Gagal menyimpan perubahan. Silakan periksa koneksi dan muat ulang halaman.",
          true,
        );
        throw error;
      } finally {
        this.busy(false);
      }
    };
    // Re-evaluate dirty grids inside the serialized operation so concurrent rapid edits
    // do not overwrite newer revisions with an old request.
    this.queue = this.queue.then(operation, operation);
    await this.queue;
    if (
      [...this.mounted.values()].some(
        (g) =>
          !this.authoritative.has(key(g.route, g.panel_id)) &&
          !same(
            committed(g.state),
            this.loaded.get(key(g.route, g.panel_id))?.rows || [],
          ),
      )
    ) {
      // Edits while a previous HTTP request was in flight.
      this.scheduleSync(100);
    }
  }
  async importCSV(route: string, panel_id: string, content: string) {
    const grid = this.mounted.get(key(route, panel_id));
    if (!grid) throw new Error("Tabel belum terdaftar");
    if (this.authoritative.has(key(route, panel_id)))
      throw new Error(
        "Data transaksi ini hanya dapat diimpor melalui alur terotorisasi, bukan langsung ke tabel.",
      );
    const csv = parseCsv(content);
    if (csv.length < 2)
      throw new Error("CSV membutuhkan header dan minimal satu baris data");
    const [headers, ...records] = csv;
    const existing = grid.state.rows[0] || {};
    const keys = Object.keys(existing).filter((k) => !k.startsWith("__"));
    if (!keys.length) throw new Error("Kolom tabel tidak ditemukan");
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const order = keys.map((k, i) => {
      const matched = headers.findIndex((h) => normalize(h) === normalize(k));
      return matched < 0 ? i : matched;
    });
    const prefix = `${panel_id}-import-${crypto.randomUUID()}-`;
    const rows = records
      .filter((r) => r.some((v) => v.trim()))
      .map((row, i) => {
        const record: Row = { __id: prefix + i };
        for (let j = 0; j < keys.length; j++)
          record[keys[j]] = row[order[j]] ?? "";
        return record;
      });
    if (!rows.length)
      throw new Error("Tidak ditemukan baris yang dapat diimpor");
    const before = [...grid.state.rows];
    grid.state.rows = [...rows, ...before];
    try {
      await this.persistDirty(route, panel_id);
      grid.render();
      this.message(`${rows.length} baris data berhasil diimpor`);
    } catch (e) {
      grid.state.rows = before;
      grid.render();
      throw e;
    }
  }

  /** Domain-backed panels are READ-ONLY projections of PostgreSQL.
   * Never persist these rows to grid_snapshots or retain stale demo fixtures. */
  mergeDomainRows(
    route: string,
    panelId: string,
    _prefix: string,
    rows: Row[],
  ) {
    const id = key(route, panelId);
    this.authoritative.add(id);
    const grid = this.mounted.get(id);
    if (!grid) return;
    if (same(grid.state.rows, rows)) {
      this.applyDomainTableEnhancements(route, panelId);
      return;
    }
    grid.state.rows = structuredClone(rows);
    grid.state.staged?.clear();
    grid.state.selected?.clear();
    grid.render();
    this.reconcileProjectedSelects();
    this.applyDomainTableEnhancements(route, panelId);
  }

  isDomainReadOnly(route: string, panelId: string) {
    return this.authoritative.has(key(route, panelId));
  }

  applyDomainTableEnhancements(route: string, panelId: string) {
    if (typeof document === "undefined") return;
    const page = document.querySelector<HTMLElement>(
      `[data-prototype-page][data-route="${route}"]`,
    );
    if (!page) return;

    const panel =
      page.querySelector<HTMLElement>(`[data-bd-panel="${panelId}"]`) ||
      page.querySelector<HTMLElement>(`[data-tabpanel="${panelId}"]`);
    if (!panel) return;

    panel.dataset.domainLocked = "true";

    const noAddPanels = [
      "/sales|invoice",
      "/sales|payment",
      "/sales|ar",
      "/projects|profitability",
      "/reports|financial",
      "/reports|sales",
      "/reports|purchase",
      "/reports|tax",
      "/reports|management",
    ];
    if (noAddPanels.includes(`${route}|${panelId}`)) {
      panel.dataset.noAdd = "true";
    }

    panel.querySelectorAll<HTMLInputElement>(".bd-cell").forEach((input) => {
      input.readOnly = true;
      input.tabIndex = -1;
    });

    let banner = panel.querySelector<HTMLElement>(".sop-context-banner");
    const configKey = `${route}|${panelId}`;
    const info = DOMAIN_BANNERS[configKey] || {
      icon: "lucide:database",
      badge: "Pencatatan Resmi",
      tone: "blue" as const,
      title: "Data Transaksi Terverifikasi",
      desc: "Tabel ini menyajikan pencatatan resmi transaksi yang terhubung langsung dengan basis data sistem.",
      flow: "Pengubahan langsung pada tabel dinonaktifkan demi integritas pembukuan. Gunakan tombol atau alur transaksi resmi di atas untuk melakukan mutasi baru.",
    };

    if (!banner) {
      banner = document.createElement("div");
      banner.className = `sop-context-banner tone-${info.tone}`;
      const toolbar = panel.querySelector<HTMLElement>("[data-bd-toolbar]");
      const tableWrap = panel.querySelector<HTMLElement>("[data-bd-tablewrap]");
      const target = toolbar || tableWrap;
      if (target && target.parentElement) {
        target.parentElement.insertBefore(banner, target);
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

  /** Native prototype status selects only contain demo statuses. When server
   * sends a new real status, preserve the exact original select styling and
   * add only its missing option value (no CSS or markup layout changes). */
  reconcileProjectedSelects() {
    for (const id of this.authoritative) {
      const [route, panelId] = id.split("|");
      if (route && panelId) {
        this.applyDomainTableEnhancements(route, panelId);
      }
      const mounted = this.mounted.get(id);
      if (!mounted) continue;
      const page = document.querySelector<HTMLElement>(
        `[data-prototype-page][data-route="${mounted.route}"]`,
      );
      const panel = page?.querySelector<HTMLElement>(
        `[data-bd-panel="${mounted.panel_id}"]`,
      );
      if (!panel) continue;
      const staged = mounted.state.staged;
      for (const select of panel.querySelectorAll<HTMLSelectElement>(
        'select[data-bd-key="status"][data-bd-id]',
      )) {
        const row = mounted.state.rows.find(
          (r) => r.__id === select.dataset.bdId,
        );
        if (!row) continue;
        const patch = staged?.get(row.__id) as { status?: unknown } | undefined;
        const status = String(patch?.status ?? row.status ?? "");
        if (status && ![...select.options].some((o) => o.value === status)) {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          select.append(option);
        }
        if (status) select.value = status;
      }
    }
  }

  getPendingRows(route: string, panelId: string) {
    const grid = this.mounted.get(key(route, panelId));
    if (!grid)
      return {
        rows: [] as Row[],
        selected: [] as string[],
        staged: [] as string[],
      };
    return {
      rows: grid.state.rows.map((row) => ({
        ...row,
        ...(grid.state.staged?.get(row.__id) || ({} as object)),
      })),
      selected: [...(grid.state.selected || [])],
      staged: [...(grid.state.staged?.keys() || [])],
    };
  }

  /** Capture before native demo handlers; their destructive edits must never
   * give an illusion that journal, stock or approved transactions were changed. */
  protectDomainEdit(event: Event): boolean {
    const el = event.target as HTMLElement;
    const page = el.closest<HTMLElement>("[data-prototype-page]");
    const route = page?.dataset.route || "";
    let panel =
      el.closest<HTMLElement>("[data-bd-panel]")?.dataset.bdPanel ||
      el.closest<HTMLElement>("[data-tabpanel]")?.dataset.tabpanel ||
      "";
    if (!panel)
      panel =
        page?.querySelector<HTMLElement>("[data-tabpanel]:not([hidden])")
          ?.dataset.tabpanel || "";
    if (!this.isDomainReadOnly(route, panel)) return false;
    const isTransfer = route === "/inventory" && panel === "transfer";
    const rowId = el.closest<HTMLElement>("[data-bd-id]")?.dataset.bdId || "";
    const newTransferRow =
      isTransfer && (rowId.includes("-new-") || rowId.includes("-import-"));
    const transferStatus = isTransfer && el.matches('[data-bd-key="status"]');
    if (
      event.type === "focusin" &&
      el instanceof HTMLInputElement &&
      el.matches(".bd-cell")
    ) {
      if (!newTransferRow && !transferStatus) el.readOnly = true;
      return false;
    }
    if (isTransfer) {
      const mutation = el.closest<HTMLElement>(
        '[data-bd-act],[data-action="inv:create"]',
      );
      if (mutation) {
        const action = mutation.dataset.bdAct || mutation.dataset.action || "";
        if (["commit", "delete", "delrow"].includes(action)) return false; // intercepted by transfer adapter
        if (action === "add" || action === "inv:create" || action === "discard")
          return false;
      }
      if (newTransferRow || transferStatus) return false;
    }
    if (
      route === "/inventory" &&
      panel === "opname" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/inventory" &&
      panel === "adjustment" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/finance" &&
      panel === "accounting" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/finance" &&
      panel === "cash" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/projects" &&
      panel === "cost" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (route === "/projects" && panel === "list") {
      const projectMutation = el.closest<HTMLElement>(
        '[data-bd-act="add"],select[data-bd-key="status"],select[data-bd-key="health"]',
      );
      if (projectMutation) return false;
    }
    if (
      route === "/business-development" &&
      ["opportunities", "tender", "proposal"].includes(panel) &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/business-development" &&
      ["opportunities", "tender", "proposal"].includes(panel) &&
      el.matches('select[data-bd-key="status"]')
    )
      return false;
    // Project task writes are captured by ProjectTaskNativeBridge and mapped
    // directly to the normalized task API. Do not let the generic fixture
    // guard consume those specific events first.
    if (route === "/projects" && panel === "task") {
      const taskMutation = el.closest<HTMLElement>(
        '[data-bd-act="add"],[data-bd-act="delrow"],[data-bd-act="assign"],select[data-bd-key="status"]',
      );
      if (taskMutation) return false;
    }
    if (
      route === "/purchase" &&
      panel === "request" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/sales" &&
      panel === "order" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/sales" &&
      panel === "delivery" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;
    if (
      route === "/sales" &&
      panel === "return" &&
      el.closest<HTMLElement>('[data-bd-act="add"]')
    )
      return false;

    const nativeMutation = el.closest<HTMLElement>(
      '.bd-cell,[data-bd-act="add"],[data-bd-act="commit"],[data-bd-act="delete"],[data-bd-act="delrow"],[data-bd-act="assign"],[data-bd-act="discard"],[data-bd-act="import"],[data-action$=":create"]',
    );
    if (!nativeMutation) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "change" || event.type === "input") {
      this.mounted.get(key(route, panel))?.render();
    }
    if (event.type === "click") {
      const isAction = el.closest('[data-bd-act="delrow"],[data-bd-act="commit"],[data-bd-act="delete"]');
      if (isAction) {
        this.message(
          "Data transaksi ini telah dibukukan secara resmi. Gunakan alur atau formulir transaksi resmi terkait untuk memperbarui.",
        );
        void showLockedTransactionModal({ route, panel });
      } else {
        this.message(
          "Data transaksi resmi terkunci demi integritas audit. Gunakan alur atau tombol transaksi resmi di atas.",
        );
      }
    }
    return true;
  }
  get mountedCount() {
    return this.mounted.size;
  }
  get isReady() {
    return this.authenticated && this.initializing === null;
  }
}

/** RFC-4180 CSV: quoted commas/newlines, escaped quotes, CRLF and UTF-8 BOM. */
export function parseCsv(value: string): string[][] {
  const text = value.replace(/^\uFEFF/, "");
  let current = "";
  let row: string[] = [];
  const rows: string[][] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((c === "\r" || c === "\n") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else current += c;
  }
  if (quoted) throw new Error("CSV memiliki tanda kutip yang belum ditutup");
  if (row.length || current) {
    row.push(current);
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}
