import React, { useState, useMemo } from "react";
import { AppSidebar, AppTopbar } from "../../components";

export interface PageProps {
  hidden?: boolean;
}

interface WorkflowStep {
  step: number;
  title: string;
  role: string;
  module: string;
  route: string;
  icon: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  rules: string[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: "1. CRM & Kualifikasi Prospek",
    role: "Sales & Business Development",
    module: "CRM & Sales",
    route: "/crm-sales",
    icon: "lucide:user-check",
    summary:
      "Mencatat data calon pelanggan, mengidentifikasi peluang proyek / tender, dan menghitung lead score untuk memprioritaskan penawaran.",
    inputs: ["Data Kontak & Profil Perusahaan", "Kebutuhan Spesifikasi Klien", "Anggaran Indikatif"],
    outputs: ["Data Prospek Terkualifikasi", "Rekam Jejak Kebutuhan Klien", "Jadwal Pertemuan Presentasi"],
    rules: [
      "Perusahaan wajib memiliki NPWP dan nomor kontak aktif.",
      "Lead score di atas 70 otomatis masuk ke pipeline prioritas tinggi.",
    ],
  },
  {
    step: 2,
    title: "2. Kalkulasi Biaya & Penerbitan Quotation",
    role: "Sales Engineer & Estimator",
    module: "Quotation",
    route: "/quotation",
    icon: "lucide:file-text",
    summary:
      "Menyusun rincian harga barang/jasa, menghitung margin keuntungan kotor, dan menerbitkan dokumen penawaran harga resmi dengan penomoran otomatis.",
    inputs: ["Katalog Produk & Harga Acuan", "Biaya Jasa & Implementasi", "Termin Pembayaran"],
    outputs: ["Draft / Final Quotation (QUO-2026-xxxx)", "Surat Penawaran PDF Resmi", "Margin Calculation Sheet"],
    rules: [
      "Diskon di atas 15% memerlukan persetujuan Manager melalui Approval Matrix.",
      "Masa berlaku penawaran default adalah 30 hari kalender sejak diterbitkan.",
    ],
  },
  {
    step: 3,
    title: "3. Konfirmasi Order & Sales Order (SO)",
    role: "Sales Operations & Project Lead",
    module: "Sales",
    route: "/sales",
    icon: "lucide:shopping-cart",
    summary:
      "Setelah penawaran disetujui klien (Won), penawaran dikonversi menjadi Sales Order (SO) untuk mengikat komitmen kontrak dan memulai proses operasional.",
    inputs: ["PO Resmi dari Customer (Client PO)", "Quotation yang Telah Disetujui (Approved)"],
    outputs: ["Dokumen Sales Order (SO-2026-xxxx)", "Alokasi Kebutuhan Barang Gudang", "Notifikasi ke Tim Gudang & PM"],
    rules: [
      "Sales Order mengunci harga dan kuantitas barang yang telah disepakati.",
      "SO berstatus Confirmed langsung memunculkan opsi proses pengiriman barang.",
    ],
  },
  {
    step: 4,
    title: "4. Alokasi Stok & Pengiriman (BAST / DO)",
    role: "Logistik & Kepala Gudang",
    module: "Inventory & Delivery",
    route: "/inventory",
    icon: "lucide:truck",
    summary:
      "Memeriksa ketersediaan stok fisik di gudang, menyiapkan barang, menerbitkan Surat Jalan / Delivery Order (DO), dan mencatat Berita Acara Serah Terima (BAST).",
    inputs: ["Sales Order (Confirmed)", "Saldo Kartu Stok Gudang", "Armada Ekspedisi / Kurir"],
    outputs: ["Surat Jalan Pengiriman (DO-2026-xxxx)", "BAST Ditandatangani Penerima", "Mutasi Stok Keluar (FIFO Perpetual)"],
    rules: [
      "Penerbitan Surat Jalan otomatis memotong saldo kartu stok pada gudang asal.",
      "Dukungan pengiriman parsial (partial delivery) dengan pencatatan nomor batch/lot.",
    ],
  },
  {
    step: 5,
    title: "5. Penagihan & Penerbitan Faktur (Invoicing)",
    role: "Staf Billing & Keuangan",
    module: "Finance & Sales",
    route: "/sales",
    icon: "lucide:receipt",
    summary:
      "Menerbitkan Invoice tagihan resmi kepada customer berdasarkan BAST yang telah diterima, lengkap dengan perhitungan PPN 11% dan jatuh tempo.",
    inputs: ["Dokumen BAST / Surat Jalan Tervalidasi", "Nomor Seri Faktur Pajak (NSFP)"],
    outputs: ["Invoice Resmi (INV-2026-xxxx)", "Faktur Pajak Masa PPN", "Kartu Piutang Usaha (AR)"],
    rules: [
      "Invoice diterbitkan dengan termin waktu (Net 14 / Net 30 / Net 45) sesuai kontrak.",
      "Invoice otomatis tercatat pada daftar pemantauan Aging Piutang (AR).",
    ],
  },
  {
    step: 6,
    title: "6. Penerimaan Pembayaran & Pencatatan Jurnal",
    role: "Finance & Accounting",
    module: "Finance & Accounting",
    route: "/finance",
    icon: "lucide:wallet-cards",
    summary:
      "Mencatat pelunasan tagihan dari customer (transfer bank / giro) dan sistem otomatis membentuk jurnal double-entry seimbang ke buku besar.",
    inputs: ["Bukti Transfer / Rekening Koran Klien", "Nomor Invoice Terkait"],
    outputs: ["Bukti Kas Masuk (PAY-2026-xxxx)", "Jurnal Finansial (Debit Kas/Bank, Kredit Piutang Usaha)", "Update Status Invoice menjadi Paid"],
    rules: [
      "Jurnal akuntansi wajib seimbang (balance debit = credit).",
      "Mendukung pelunasan bertahap (partial payment) dan uang muka (down payment).",
    ],
  },
  {
    step: 7,
    title: "7. Rekonsiliasi Bank & Laporan Keuangan",
    role: "Chief Financial Officer & Auditor",
    module: "Reports & Analytics",
    route: "/reports",
    icon: "lucide:bar-chart-3",
    summary:
      "Melakukan pencocokan transaksi bank otomatis dengan buku besar, rekonsiliasi PPN, serta menghasilkan Laporan Laba Rugi dan Neraca secara real-time.",
    inputs: ["Mutasi Rekening Koran Bank BCA/Mandiri", "Buku Besar Pembantu"],
    outputs: ["Laporan Rekonsiliasi Bank", "Laporan Laba Rugi (P&L)", "Neraca Keuangan & Ekspor Excel"],
    rules: [
      "Seluruh transaksi terkunci secara permanen pada audit trail dan tamper-proof.",
      "Dapat diekspor sewaktu-waktu ke Excel (.xlsx) dengan formula akuntansi utuh.",
    ],
  },
];

interface ModuleDoc {
  id: string;
  category: string;
  roleTag: string;
  title: string;
  icon: string;
  route: string;
  description: string;
  keyFeatures: string[];
  tips: string;
}

const MODULE_DOCS: ModuleDoc[] = [
  {
    id: "workspace",
    category: "Ruang Kerja & Produktivitas",
    roleTag: "Semua Pengguna",
    title: "My Workspace",
    icon: "lucide:home",
    route: "/my-workspace",
    description:
      "Pusat aktivitas personal setiap pengguna. Berisi daftar tugas harian yang harus diselesaikan, status persetujuan yang menunggu tindakan Anda, jadwal rapat, arsip dokumen pribadi, dan notifikasi real-time.",
    keyFeatures: [
      "Daftar 'Tugas Saya' dengan status prioritas (High, Medium, Low) dan tanggal jatuh tempo.",
      "Tab 'Persetujuan' (Approvals) untuk menyetujui atau menolak dokumen secara cepat.",
      "Pintasan agenda rapat dan kalender aktivitas.",
      "Profil pengguna terhubung dengan role dan kredensial database.",
    ],
    tips: "Gunakan My Workspace sebagai halaman utama saat memulai pekerjaan setiap pagi untuk mengecek SLA tugas pending.",
  },
  {
    id: "dashboard",
    category: "Ruang Kerja & Produktivitas",
    roleTag: "Manajemen & Direksi",
    title: "Executive Dashboard",
    icon: "lucide:layout-dashboard",
    route: "/dashboard",
    description:
      "Menyajikan ringkasan visual performa perusahaan secara holistik dalam grafik dan kartu metrik KPI: total pendapatan, pipeline peluang aktif, saldo kas & bank, utilisasi gudang, dan kesehatan proyek.",
    keyFeatures: [
      "Kartu metrik omset bulan berjalan vs target.",
      "Grafik tren penjualan harian dengan inspeksi nilai interaktif.",
      "Status saldo multi-bank (BCA, Mandiri, BRI) yang terintegrasi.",
      "Pelacakan status proyek berjalan dan kesehatan operasional.",
    ],
    tips: "Pilih tab periode (Hari Ini, Kemarin, Minggu Ini) untuk menganalisis pergerakan transaksi secara terperinci.",
  },
  {
    id: "crm-sales",
    category: "Commercial & Penjualan",
    roleTag: "Sales & Marketing",
    title: "CRM & Sales Operations",
    icon: "lucide:briefcase",
    route: "/crm-sales",
    description:
      "Pengelolaan siklus hidup pelanggan secara menyeluruh: registrasi lead awal, scoring prospek, database perusahaan klien 360 derajat, riwayat interaksi, hingga konversi peluang tender.",
    keyFeatures: [
      "Pelacakan pipeline peluang dari tahap Prospek, Negosiasi, hingga Closed Won.",
      "Manajemen kontak utama (PIC) pada tiap instansi/klien.",
      "Perhitungan estimasi probabilitas nilai kontrak (weighted pipeline value).",
      "Pencatatan riwayat meeting, telepon, dan korespondensi email.",
    ],
    tips: "Segera catat setiap hasil interaksi dengan klien agar skor probabilitas closing terupdate otomatis di dashboard.",
  },
  {
    id: "quotation",
    category: "Commercial & Penjualan",
    roleTag: "Sales & Estimator",
    title: "Quotation & Kalkulasi Penawaran",
    icon: "lucide:file-text",
    route: "/quotation",
    description:
      "Penyusunan penawaran harga interaktif. Memungkinkan penambahan item produk, jasa, ongkos kirim, dan perhitungan PPN serta diskon secara otomatis dengan validasi approval matrix.",
    keyFeatures: [
      "Penyusunan item penawaran multi-baris dengan harga standar master data.",
      "Kalkulasi margin kotor dan harga pokok penjualan (HPP) secara live.",
      "Sistem revisi dan versioning penawaran (Rev 0, Rev 1, Rev 2) tanpa menghapus draf awal.",
      "Ekspor dokumen penawaran resmi dalam format cetak PDF berstandar korporat.",
    ],
    tips: "Jika Anda ingin mengajukan diskon khusus untuk klien strategis, sistem akan otomatis meneruskan draf ke Manager untuk approval.",
  },
  {
    id: "sales-orders",
    category: "Commercial & Penjualan",
    roleTag: "Sales Ops & Billing",
    title: "Sales Orders & Retur Penjualan",
    icon: "lucide:shopping-cart",
    route: "/sales",
    description:
      "Pencatatan pesanan penjualan yang telah dikonfirmasi (Confirmed Order), pelacakan Surat Jalan / BAST, pembuatan invoice penagihan, pencatatan pembayaran kas, serta penanganan retur penjualan.",
    keyFeatures: [
      "Tabel terpadu: Sales Order, Surat Jalan (DO), Invoice, Bukti Bayar, dan Piutang (AR).",
      "Fitur 'Pengiriman Barang / BAST' langsung dari baris Sales Order yang siap dikirim.",
      "Pengelolaan retur barang dengan penerbitan Nota Kredit (Credit Note) dan pengembalian dana.",
      "Analisis umur piutang (AR Aging) untuk memprioritaskan penagihan yang telah jatuh tempo.",
    ],
    tips: "Klik tombol 'Proses Pengiriman' pada tabel Sales Order untuk mencetak Surat Jalan secara langsung ke pihak logistik.",
  },
  {
    id: "inventory",
    category: "Operasional & Gudang",
    roleTag: "Gudang & Logistik",
    title: "Inventory & Kartu Stok Multi-Gudang",
    icon: "lucide:warehouse",
    route: "/inventory",
    description:
      "Pengawasan stok fisik secara real-time di seluruh lokasi gudang (Pusat, Hub Transit, dan Site). Menggunakan sistem perpetual persediaan FIFO/Average dengan pencatatan nomor lot dan tanggal kadaluarsa.",
    keyFeatures: [
      "Saldo stok realtime: On-hand, Reserved (terkunci order), dan Available.",
      "Transfer antar-gudang (Warehouse Transfer) dengan state machine: Draft -> In Transit -> Received.",
      "Fitur Stock Opname (Penyesuaian Fisik) dengan rekam selisih kuantitas otomatis.",
      "Kartu stok mutasi keluar-masuk lengkap dengan referensi dokumen sumber.",
    ],
    tips: "Lakukan Stock Opname secara berkala melalui menu Opname untuk memastikan akurasi saldo buku dengan fisik lapangan.",
  },
  {
    id: "purchase",
    category: "Operasional & Gudang",
    roleTag: "Procurement & Pengadaan",
    title: "Purchase & Manajemen Vendor",
    icon: "lucide:clipboard-list",
    route: "/purchase",
    description:
      "Pengelolaan pengadaan barang dan jasa dari vendor: pengajuan Purchase Request (PR) oleh departemen pemohon, penerbitan Purchase Order (PO) resmi, verifikasi penerimaan barang (Goods Receipt), dan evaluasi vendor.",
    keyFeatures: [
      "Alur approval Purchase Request bertingkat sesuai batas wewenang nominal.",
      "Penerbitan PO vendor resmi dengan syarat pembayaran (Payment Terms).",
      "Pencatatan Goods Receipt (GR) dengan pengecekan kondisi fisik barang.",
      "Evaluasi performa vendor berkala (skor kualitas, ketepatan waktu, dan pelayanan).",
    ],
    tips: "Barang yang diterima pada Goods Receipt langsung menambah saldo kartu stok gudang tanpa perlu input manual ulang.",
  },
  {
    id: "finance",
    category: "Keuangan & Akuntansi",
    roleTag: "Akuntan & Finance",
    title: "Finance, Accounting & Jurnal",
    icon: "lucide:wallet-cards",
    route: "/finance",
    description:
      "Pusat pencatatan pembukuan keuangan berstandar akuntansi Indonesia. Mengelola Bagan Akun (Chart of Accounts), Jurnal Umum Otomatis, Rekonsiliasi Bank, dan Penutupan Periode Akuntansi.",
    keyFeatures: [
      "Chart of Accounts (COA) komprehensif (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).",
      "Jurnal otomatis yang terbentuk saat transaksi penjualan, pengadaan, dan mutasi stok terjadi.",
      "Rekonsiliasi mutasi bank BCA/Mandiri dengan pencocokan referensi pembayaran.",
      "Proteksi penutupan periode akuntansi (Fiscal Period Locking) untuk menjaga integritas data.",
    ],
    tips: "Pastikan seluruh transaksi mutasi kas bank telah memiliki referensi invoice terkait sebelum melakukan rekonsiliasi bulanan.",
  },
  {
    id: "reports",
    category: "Keuangan & Akuntansi",
    roleTag: "Manajemen & Auditor",
    title: "Reports & Financial Analytics",
    icon: "lucide:bar-chart-3",
    route: "/reports",
    description:
      "Pusat pelaporan terpadu seluruh divisi perusahaan. Menyediakan ekspor instan data keuangan, pajak PPN/PPh, rekapitulasi penjualan, analisis HPP proyek, dan indikator kepatuhan.",
    keyFeatures: [
      "Fitur Global Excel Interceptor: seluruh ekspor data otomatis dihasilkan dalam format Excel (.xlsx) rapi.",
      "Laporan masa pajak dan rekapitulasi faktur pajak keluaran/masukan.",
      "Laporan Laba Rugi per proyek (Project Profitability & Cost Variance).",
      "Penyaringan fleksibel berdasarkan rentang tanggal dan status transaksi.",
    ],
    tips: "Gunakan tombol 'Export Excel' pada kanan atas untuk mengunduh laporan berformat spreadsheet lengkap dengan styling.",
  },
  {
    id: "security-audit",
    category: "Tata Kelola & Keamanan",
    roleTag: "Administrator & IT Security",
    title: "Keamanan, 2FA & Audit Trail",
    icon: "lucide:shield-check",
    route: "/security-audit",
    description:
      "Perlindungan data dan transparansi operasional tingkat enterprise. Menyimpan log audit forensik permanen, pemantauan sesi login pengguna, otentikasi dua faktor (2FA TOTP), dan enkripsi data.",
    keyFeatures: [
      "Audit Trail tak terhapuskan (immutable log) mencatat aktor, waktu, IP, dan payload perubahan.",
      "Pengaturan Two-Factor Authentication (2FA) berbasis Google Authenticator.",
      "Pemantauan sesi login aktif dengan kemampuan force-logout perangkat mencurigakan.",
      "Sistem pemulihan dengan Emergency Recovery Codes saat kehilangan perangkat 2FA.",
    ],
    tips: "Aktifkan 2FA pada menu Akun untuk mengamankan hak akses Anda dari potensi penyalahgunaan kredensial.",
  },
];

const FAQS = [
  {
    q: "Bagaimana alur revisi penawaran harga (Quotation) yang sudah dikirim ke klien?",
    a: "Buka menu Quotation, pilih penawaran yang ingin direvisi, lalu klik tombol 'Revisi Penawaran'. Sistem akan otomatis membuat versi baru (misalnya Rev 1 dari Rev 0) dengan nomor yang sama dan menjaga riwayat versi lama tetap tersimpan di audit trail.",
  },
  {
    q: "Kapan saldo stok gudang berkurang saat terjadi transaksi penjualan?",
    a: "Saldo stok pada kartu stok gudang berkurang secara otomatis tepat saat Anda menerbitkan Surat Jalan / Berita Acara Serah Terima (DO/BAST) pada menu Sales. Saat status Sales Order baru 'Confirmed', kuantitas baru tercatat sebagai 'Reserved' (terkunci) dan belum memotong saldo fisik.",
  },
  {
    q: "Bagaimana cara menangani barang yang rusak atau diretur oleh pelanggan?",
    a: "Buka menu Sales -> tab 'Retur Penjualan'. Klik 'Input Retur Barang', pilih dokumen pengiriman asal, tentukan jumlah barang dan alasannya. Setelah disetujui, sistem otomatis menerbitkan Nota Kredit (Credit Note) dan menambah stok kembali ke gudang retur.",
  },
  {
    q: "Apakah seluruh ekspor laporan dapat dibuka di Microsoft Excel dengan rapi?",
    a: "Ya! Platform ini dilengkapi dengan Global Excel Interceptor. Semua tombol 'Export' atau 'Unduh Laporan' di seluruh modul secara otomatis menghasilkan file Microsoft Excel (.xlsx) dengan kolom rapi, format angka Rupiah, dan header profesional.",
  },
  {
    q: "Bagaimana jika lupa password atau kehilangan kode otentikasi 2FA?",
    a: "Pengguna dapat menggunakan salah satu dari 8 Recovery Codes yang diberikan saat pertama kali mengaktifkan 2FA. Jika recovery code hilang, Super Administrator dapat melakukan reset 2FA melalui menu Security & Audit.",
  },
  {
    q: "Apakah platform ini dapat diakses oleh beberapa pengguna secara bersamaan?",
    a: "Ya, platform didesain dengan arsitektur multi-user berbasis peran (Role-Based Access Control) dengan sinkronisasi data real-time melalui database PostgreSQL. Setiap perubahan data yang dilakukan oleh tim Anda langsung tercermin pada dashboard.",
  },
];

export function DocsPage({ hidden }: PageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const categories = useMemo(() => {
    const set = new Set<string>();
    MODULE_DOCS.forEach((m) => set.add(m.category));
    return ["Semua", ...Array.from(set)];
  }, []);

  const filteredDocs = useMemo(() => {
    return MODULE_DOCS.filter((doc) => {
      const matchCat =
        selectedCategory === "Semua" || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchQuery =
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.roleTag.toLowerCase().includes(q) ||
        doc.keyFeatures.some((f) => f.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const activeStep = WORKFLOW_STEPS[activeStepIndex];

  return (
    <section
      data-prototype-page
      data-page-id="docs"
      data-route="/docs"
      hidden={hidden}
    >
      <div
        className="dashboard"
        data-node-id="docs.dashboard"
        data-sidebar="default"
        data-page-title="Documentation & Guide"
        data-page-title-en="Docs & User Guide"
        data-export-name="docs"
      >
        <AppSidebar nodePrefix="docs" />
        <div className="main-column">
          <AppTopbar nodePrefix="docs" currentRouteTitle="Docs" />
          <section className="page-region" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
            <h1 className="sr-only">Dokumentasi & Panduan Platform SOP</h1>

            {/* Header Banner */}
            <header className="page-head" style={{ marginBottom: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span
                    style={{
                      background: "rgba(33, 115, 70, 0.15)",
                      color: "#185c37",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <iconify-icon noobserver icon="lucide:book-marked" aria-hidden="true"></iconify-icon>
                    SOP PLATFORM GUIDE v2.5
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    Panduan Interaktif & Manual Sistem
                  </span>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--color-text)" }}>
                  Pusat Dokumentasi & Panduan Pengguna
                </h2>
                <p style={{ margin: "6px 0 0", color: "var(--color-secondary)", fontSize: "14px" }}>
                  Pelajari seluruh alur operasional, standar prosedur transaksi, manajemen modul, hingga panduan keamanan sistem.
                </p>
              </div>

              <div className="page-actions" style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    const el = document.getElementById("interactive-simulation");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <iconify-icon noobserver icon="lucide:play-circle" aria-hidden="true"></iconify-icon>
                  <span>Simulasi Alur Bisnis</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById("faq-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <iconify-icon noobserver icon="lucide:help-circle" aria-hidden="true"></iconify-icon>
                  <span>FAQ & Bantuan</span>
                </button>
              </div>
            </header>

            {/* Search and Category Filter Bar */}
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-card)",
                padding: "16px 20px",
                marginBottom: "28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <div
                  style={{
                    position: "relative",
                    flex: "1 1 300px",
                    minWidth: "260px",
                  }}
                >
                  <iconify-icon
                    noobserver
                    icon="lucide:search"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-muted)",
                      fontSize: "16px",
                    }}
                    aria-hidden="true"
                  ></iconify-icon>
                  <input
                    type="search"
                    placeholder="Cari fitur, kata kunci, dokumen (misal: 'Quotation', 'BAST', 'Stok', 'Jurnal', '2FA')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px 0 38px",
                      background: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-control)",
                      color: "var(--color-text)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-muted)",
                      }}
                      aria-label="Bersihkan pencarian"
                    >
                      <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: selectedCategory === cat ? 600 : 500,
                        border: selectedCategory === cat ? "1px solid #185c37" : "1px solid var(--color-border)",
                        background: selectedCategory === cat ? "#217346" : "var(--color-background)",
                        color: selectedCategory === cat ? "#ffffff" : "var(--color-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive End-to-End Business Flow Simulator */}
            <div
              id="interactive-simulation"
              style={{
                background: "linear-gradient(180deg, var(--color-surface) 0%, rgba(33, 115, 70, 0.04) 100%)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-card)",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <iconify-icon noobserver icon="lucide:workflow" style={{ color: "#217346" }} aria-hidden="true"></iconify-icon>
                    Simulasi Alur Proses Bisnis Terpadu (End-to-End)
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "var(--color-secondary)", fontSize: "13px" }}>
                    Klik setiap tahapan di bawah untuk melihat rincian dokumen masukan, hasil keluaran, penanggung jawab, dan aturan sistem.
                  </p>
                </div>
                <span
                  style={{
                    background: "#217346",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Langkah {activeStepIndex + 1} dari {WORKFLOW_STEPS.length}
                </span>
              </div>

              {/* Stepper Buttons Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${WORKFLOW_STEPS.length}, minmax(130px, 1fr))`,
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                }}
              >
                {WORKFLOW_STEPS.map((s, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-control)",
                        border: isActive ? "2px solid #217346" : "1px solid var(--color-border)",
                        background: isActive ? "rgba(33, 115, 70, 0.12)" : "var(--color-surface)",
                        color: isActive ? "#185c37" : "var(--color-secondary)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: isActive ? "#217346" : "var(--color-border)",
                            color: isActive ? "#fff" : "var(--color-muted)",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {s.step}
                        </span>
                        <iconify-icon noobserver icon={s.icon} style={{ fontSize: "14px" }} aria-hidden="true"></iconify-icon>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: isActive ? 700 : 500, lineHeight: 1.2 }}>
                        {s.title.split(". ")[1]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Interactive Detail Card */}
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-control)",
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--color-text)" }}>
                      {activeStep.title}
                    </h4>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-secondary)" }}>
                        <strong>Penanggung Jawab:</strong> {activeStep.role}
                      </span>
                      <span style={{ color: "var(--color-border)" }}>•</span>
                      <span style={{ fontSize: "12px", color: "var(--color-secondary)" }}>
                        <strong>Modul Utama:</strong> {activeStep.module}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                    onClick={() => {
                      window.location.hash = `#${activeStep.route}`;
                    }}
                  >
                    <span>Buka Modul {activeStep.module}</span>
                    <iconify-icon noobserver icon="lucide:arrow-right" aria-hidden="true"></iconify-icon>
                  </button>
                </div>

                <p style={{ margin: "0 0 16px", fontSize: "13px", lineHeight: "1.6", color: "var(--color-secondary)" }}>
                  {activeStep.summary}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                  <div
                    style={{
                      background: "rgba(33, 115, 70, 0.04)",
                      border: "1px dashed rgba(33, 115, 70, 0.3)",
                      borderRadius: "6px",
                      padding: "14px",
                    }}
                  >
                    <h5 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#185c37", display: "flex", alignItems: "center", gap: "6px" }}>
                      <iconify-icon noobserver icon="lucide:log-in" aria-hidden="true"></iconify-icon>
                      Dokumen / Data Masukan (Inputs)
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--color-secondary)", lineHeight: 1.6 }}>
                      {activeStep.inputs.map((inp, idx) => (
                        <li key={idx}>{inp}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background: "rgba(43, 87, 154, 0.04)",
                      border: "1px dashed rgba(43, 87, 154, 0.3)",
                      borderRadius: "6px",
                      padding: "14px",
                    }}
                  >
                    <h5 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#2451b2", display: "flex", alignItems: "center", gap: "6px" }}>
                      <iconify-icon noobserver icon="lucide:log-out" aria-hidden="true"></iconify-icon>
                      Dokumen / Hasil Keluaran (Outputs)
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--color-secondary)", lineHeight: 1.6 }}>
                      {activeStep.outputs.map((out, idx) => (
                        <li key={idx}>{out}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background: "rgba(230, 126, 34, 0.04)",
                      border: "1px dashed rgba(230, 126, 34, 0.3)",
                      borderRadius: "6px",
                      padding: "14px",
                    }}
                  >
                    <h5 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#b7651a", display: "flex", alignItems: "center", gap: "6px" }}>
                      <iconify-icon noobserver icon="lucide:shield-alert" aria-hidden="true"></iconify-icon>
                      Validasi & Aturan Sistem
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--color-secondary)", lineHeight: 1.6 }}>
                      {activeStep.rules.map((rul, idx) => (
                        <li key={idx}>{rul}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                    style={{ opacity: activeStepIndex === 0 ? 0.4 : 1 }}
                  >
                    <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                    <span>Tahap Sebelumnya</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={activeStepIndex === WORKFLOW_STEPS.length - 1}
                    onClick={() => setActiveStepIndex((prev) => Math.min(WORKFLOW_STEPS.length - 1, prev + 1))}
                    style={{ opacity: activeStepIndex === WORKFLOW_STEPS.length - 1 ? 0.4 : 1 }}
                  >
                    <span>Tahap Selanjutnya</span>
                    <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>
                  Katalog Panduan Modul ({filteredDocs.length} Modul)
                </h3>
                {searchQuery && (
                  <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    Menampilkan hasil untuk: <strong>"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {filteredDocs.length === 0 ? (
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-card)",
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "var(--color-secondary)",
                  }}
                >
                  <iconify-icon noobserver icon="lucide:search-x" style={{ fontSize: "36px", color: "var(--color-muted)", marginBottom: "8px" }} aria-hidden="true"></iconify-icon>
                  <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada modul yang cocok dengan kriteria pencarian.</p>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginTop: "12px" }}
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("Semua");
                    }}
                  >
                    Reset Filter Pencarian
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {filteredDocs.map((doc) => (
                    <article
                      key={doc.id}
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-card)",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "rgba(33, 115, 70, 0.1)",
                              color: "#185c37",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "18px",
                            }}
                          >
                            <iconify-icon noobserver icon={doc.icon} aria-hidden="true"></iconify-icon>
                          </span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--color-text)" }}>
                              {doc.title}
                            </h4>
                            <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                              {doc.category}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            background: "var(--color-background)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-secondary)",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {doc.roleTag}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: "0 0 14px",
                          fontSize: "12.5px",
                          lineHeight: "1.5",
                          color: "var(--color-secondary)",
                          flex: "1",
                        }}
                      >
                        {doc.description}
                      </p>

                      <div style={{ marginBottom: "14px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-text)", display: "block", marginBottom: "6px" }}>
                          Fitur & Kapabilitas Kunci:
                        </span>
                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "var(--color-secondary)", lineHeight: 1.5 }}>
                          {doc.keyFeatures.map((feat, idx) => (
                            <li key={idx}>{feat}</li>
                          ))}
                        </ul>
                      </div>

                      <div
                        style={{
                          background: "rgba(33, 115, 70, 0.04)",
                          borderLeft: "3px solid #217346",
                          padding: "8px 12px",
                          borderRadius: "0 4px 4px 0",
                          fontSize: "11px",
                          color: "var(--color-secondary)",
                          marginBottom: "14px",
                          lineHeight: 1.4,
                        }}
                      >
                        <strong>Tips Praktis:</strong> {doc.tips}
                      </div>

                      <button
                        type="button"
                        className="btn-ghost"
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          fontSize: "12px",
                          marginTop: "auto",
                        }}
                        onClick={() => {
                          window.location.hash = `#${doc.route}`;
                        }}
                      >
                        <span>Akses Modul Sekarang</span>
                        <iconify-icon noobserver icon="lucide:external-link" aria-hidden="true"></iconify-icon>
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive FAQ Section */}
            <div
              id="faq-section"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-card)",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                <iconify-icon noobserver icon="lucide:message-circle-question" style={{ color: "#217346" }} aria-hidden="true"></iconify-icon>
                Pertanyaan yang Sering Diajukan (FAQ)
              </h3>
              <p style={{ margin: "0 0 20px", color: "var(--color-secondary)", fontSize: "13px" }}>
                Jawaban praktis seputar penanganan kendala transaksi harian dan konfigurasi platform.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {FAQS.map((faq, index) => {
                  const isOpen = expandedFaqIndex === index;
                  return (
                    <div
                      key={index}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-control)",
                        overflow: "hidden",
                        background: isOpen ? "rgba(33, 115, 70, 0.02)" : "var(--color-surface)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                        style={{
                          width: "100%",
                          padding: "14px 18px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: isOpen ? "#185c37" : "var(--color-text)",
                        }}
                      >
                        <span>{faq.q}</span>
                        <iconify-icon
                          noobserver
                          icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                          style={{ fontSize: "16px", color: "var(--color-muted)", flexShrink: 0 }}
                          aria-hidden="true"
                        ></iconify-icon>
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0 18px 16px",
                            fontSize: "13px",
                            lineHeight: "1.6",
                            color: "var(--color-secondary)",
                            borderTop: "1px dashed var(--color-border)",
                            marginTop: "4px",
                            paddingTop: "12px",
                          }}
                        >
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Cheat Sheet & System Architecture Badges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
              {/* Keyboard Shortcuts */}
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-card)",
                  padding: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <iconify-icon noobserver icon="lucide:keyboard" style={{ color: "#217346" }} aria-hidden="true"></iconify-icon>
                  Pintasan Tombol Cepat (Keyboard Shortcuts)
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    ["⌘ K / Ctrl + K", "Membuka pencarian global sidebar"],
                    ["Esc", "Menutup dialog modal atau form aktif"],
                    ["Enter", "Menyimpan atau mengirim formulir"],
                    ["Tab / Shift + Tab", "Berpindah antar kolom pada tabel Handsontable"],
                    ["#/<route>", "Navigasi langsung melalui hash URL browser"],
                  ].map(([key, desc], idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        padding: "6px 0",
                        borderBottom: "1px dashed var(--color-border)",
                      }}
                    >
                      <span style={{ color: "var(--color-secondary)" }}>{desc}</span>
                      <kbd
                        style={{
                          background: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontFamily: "var(--font-mono, monospace)",
                          fontWeight: 600,
                        }}
                      >
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Architecture Specifications */}
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-card)",
                  padding: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <iconify-icon noobserver icon="lucide:server" style={{ color: "#217346" }} aria-hidden="true"></iconify-icon>
                  Spesifikasi & Keandalan Arsitektur
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                    <span style={{ color: "var(--color-secondary)" }}>Basis Data Relasional</span>
                    <strong>PostgreSQL 16 (ACID & NUMERIC Exact)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                    <span style={{ color: "var(--color-secondary)" }}>Backend Runtime</span>
                    <strong>Laravel 11 RESTful API + Transaction Locking</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                    <span style={{ color: "var(--color-secondary)" }}>Frontend Framework</span>
                    <strong>React 19 + TypeScript + TanStack Query</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                    <span style={{ color: "var(--color-secondary)" }}>Format Export Standar</span>
                    <strong>Microsoft Excel (.xlsx) OpenXML Natif</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ color: "var(--color-secondary)" }}>Integritas Keamanan</span>
                    <span style={{ color: "#185c37", fontWeight: 700 }}>2FA TOTP & SHA-256 Vault Tamper-Proof</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
        </div>
      </div>
    </section>
  );
}

