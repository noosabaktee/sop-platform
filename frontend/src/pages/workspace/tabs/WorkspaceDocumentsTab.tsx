import React from "react";

export function WorkspaceDocumentsTab() {
  return (
              <div className="ws-panel" id="ws-panel-sales" role="tabpanel" aria-labelledby="ws-tab-sales" data-panel="sales" data-title="Dokumen Saya" data-title-en="My Documents" hidden>
                <header className="page-head">
                  <div>
                    <h2 data-en="My Documents">Dokumen Saya</h2>
                    <p data-en="Your documents and approval status.">Dokumen kerja, versi terbaru, dan approval yang perlu ditindaklanjuti.</p>
                  </div>
                  <div className="page-actions">
                    <button type="button" className="btn-ghost" data-action="sop:export">
                      <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                      <span data-en="Export">Export</span>
                    </button>
                    <button type="button" className="btn-primary" data-action="sop:create" data-kind="Document">
                      <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                      {' '}Unggah dokumen
                    </button>
                  </div>
                </header>
                <div className="kpi-row">
                  <button type="button" className="kpi" data-tone="green" data-action="sop:drill" data-kind="Total documents">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Total documents">Total dokumen</span>
                      <iconify-icon noobserver icon="lucide:files" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">48</strong>
                        <span className="kpi__comparison">
                          <small data-en="6 new">6 baru</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="amber" data-action="sop:drill" data-kind="Need approval">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Need approval">Perlu approval</span>
                      <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">5</strong>
                        <span className="kpi__comparison">
                          <small data-en="2 urgent">2 mendesak</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="blue" data-action="sop:drill" data-kind="Shared">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Shared">Dibagikan</span>
                      <iconify-icon noobserver icon="lucide:share-2" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">12</strong>
                        <span className="kpi__comparison">
                          <small data-en="3 teams">3 tim</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                </div>
                <div className="card">
                  <div className="card__head">
                    <h2>
                      <iconify-icon noobserver icon="lucide:table-2" aria-hidden="true"></iconify-icon>
                      <span data-en="My Documents">Dokumen Saya</span>
                    </h2>
                    <div className="card__tools">
                      <div className="card__view" role="group" aria-label="Pilih tampilan data">
                        <button type="button" data-action="view:set" data-view="table" aria-pressed="true">
                          <iconify-icon noobserver icon="lucide:table-2" aria-hidden="true"></iconify-icon>
                          <span data-en="Table">Tabel</span>
                        </button>
                        <button type="button" data-action="view:set" data-view="card" aria-pressed="false">
                          <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
                          <span data-en="Card">Kartu</span>
                        </button>
                      </div>
                      <div className="card__search">
                        <label className="c-kravio-search" data-component="kravio-search" data-node-id="sales.search">
                          <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                          <input type="search" placeholder="Cari record" aria-label="Cari record" data-action="table:search" data-part="input" />
                        </label>
                      </div>
                      <details className="filter-details">
                        <summary>
                          <iconify-icon noobserver icon="lucide:filter" aria-hidden="true"></iconify-icon>
                          <span data-en="Filter">Filter</span>
                        </summary>
                        <div className="filter-panel">
                          <fieldset>
                            <legend>Prioritas</legend>
                            <label>
                              <input type="checkbox" data-filter="priority" value="High" />
                              High
                            </label>
                            <label>
                              <input type="checkbox" data-filter="priority" value="Medium" />
                              Medium
                            </label>
                            <label>
                              <input type="checkbox" data-filter="priority" value="Low" />
                              Low
                            </label>
                          </fieldset>
                          <button type="button" className="btn-ghost" data-action="table:reset">Hapus filter</button>
                        </div>
                      </details>
                      <button type="button" className="btn-ghost" data-action="table:export">
                        <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                        <span data-en="Export">Export</span>
                      </button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="sop-table">
                      <thead>
                        <tr>
                          <th scope="col" aria-sort="none">
                            <input type="checkbox" data-action="table:all" aria-label="Pilih semua record" />
                            <button type="button" data-action="table:sort" data-column="0">
                              Dokumen
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="1">
                              Tipe
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="2">
                              Versi
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="3">
                              Pemilik
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="4">
                              Updated
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="5">
                              Status
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-label="Aksi"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr data-priority="Medium" data-status="Pending">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Quotation Q-2026-014.pdf
                            </label>
                          </td>
                          <td>Quotation</td>
                          <td>v3</td>
                          <td>Rina Wijaya</td>
                          <td>Hari ini 10:10</td>
                          <td>
                            <span className="chip pending">Pending</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Approved">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              PO-2026-031.pdf
                            </label>
                          </td>
                          <td>Purchase Order</td>
                          <td>v1</td>
                          <td>Sari Putri</td>
                          <td>Hari ini 09:40</td>
                          <td>
                            <span className="chip done">Approved</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Approved">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Kontrak CTR-009.pdf
                            </label>
                          </td>
                          <td>Contract</td>
                          <td>v2</td>
                          <td>Bagus Santoso</td>
                          <td>Kemarin</td>
                          <td>
                            <span className="chip done">Approved</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Pending">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              BAST PRJ-041.pdf
                            </label>
                          </td>
                          <td>BAST</td>
                          <td>v1</td>
                          <td>Bagus Santoso</td>
                          <td>Kemarin</td>
                          <td>
                            <span className="chip pending">Pending</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Done">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Invoice INV-088.pdf
                            </label>
                          </td>
                          <td>Invoice</td>
                          <td>v4</td>
                          <td>Sari Putri</td>
                          <td>2 hari lalu</td>
                          <td>
                            <span className="chip done">Done</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Draft">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Proposal BD-021.pdf
                            </label>
                          </td>
                          <td>Proposal</td>
                          <td>v2</td>
                          <td>Aditya Pratama</td>
                          <td>3 hari lalu</td>
                          <td>
                            <span className="chip info">Draft</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Approved">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Laporan Mingguan W40.xlsx
                            </label>
                          </td>
                          <td>Report</td>
                          <td>v1</td>
                          <td>Rina Wijaya</td>
                          <td>3 hari lalu</td>
                          <td>
                            <span className="chip done">Approved</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Draft">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Surat Penawaran PT Beta.docx
                            </label>
                          </td>
                          <td>Letter</td>
                          <td>v1</td>
                          <td>Aditya Pratama</td>
                          <td>4 hari lalu</td>
                          <td>
                            <span className="chip info">Draft</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="card-list" role="list" hidden></div>
                  <footer className="pager">
                    <span data-part="page-info" aria-live="polite"></span>
                    <div className="pager__controls">
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        Baris{' '}
                        <select data-action="table:size" aria-label="Baris per halaman">
                          <option value="3">3</option>
                          <option value="5" selected>5</option>
                          <option value="10">10</option>
                        </select>
                      </label>
                      <button type="button" className="pg" data-action="table:first" aria-label="Halaman pertama">
                        <iconify-icon noobserver icon="lucide:chevrons-left" aria-hidden="true"></iconify-icon>
                      </button>
                      <button type="button" className="pg" data-action="table:prev" aria-label="Halaman sebelumnya">
                        <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                      </button>
                      <span data-part="page-pages" style={{ display: "flex", gap: 6 }}></span>
                      <button type="button" className="pg" data-action="table:next" aria-label="Halaman berikutnya">
                        <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                      </button>
                      <button type="button" className="pg" data-action="table:last" aria-label="Halaman terakhir">
                        <iconify-icon noobserver icon="lucide:chevrons-right" aria-hidden="true"></iconify-icon>
                      </button>
                    </div>
                  </footer>
                </div>
              </div>
  );
}
