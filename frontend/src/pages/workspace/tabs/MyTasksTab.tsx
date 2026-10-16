import React from "react";

export function MyTasksTab() {
  return (
              <div className="ws-panel" id="ws-panel-my-workspace" role="tabpanel" aria-labelledby="ws-tab-my-workspace" data-panel="my-workspace" data-title="My Tasks" data-title-en="My Tasks">
                <header className="page-head">
                  <div>
                    <h2 data-en="My Tasks">My Tasks</h2>
                    <p data-en="Tasks and follow-ups to complete.">Daftar task dan follow-up yang harus diselesaikan.</p>
                  </div>
                  <div className="page-actions">
                    <button type="button" className="btn-ghost" data-action="sop:export">
                      <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                      <span data-en="Export">Export</span>
                    </button>
                    <button type="button" className="btn-primary" data-action="sop:create" data-kind="Record baru">
                      <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                      {' '}Task
                    </button>
                  </div>
                </header>
                <div className="kpi-row">
                  <button type="button" className="kpi" data-tone="green" data-action="sop:drill" data-kind="Today's tasks">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Today's tasks">Tugas hari ini</span>
                      <iconify-icon noobserver icon="lucide:list-checks" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">12</strong>
                        <span className="kpi__comparison">
                          <small data-en="4 done">4 selesai</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="red" data-action="sop:drill" data-kind="Overdue">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Overdue">Overdue</span>
                      <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">3</strong>
                        <span className="kpi__comparison">
                          <small data-en="needs action">perlu tindakan</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="teal" data-action="sop:drill" data-kind="Done this week">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Done this week">Selesai minggu ini</span>
                      <iconify-icon noobserver icon="lucide:check-circle" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">28</strong>
                        <span className="kpi__comparison">
                          <small data-en="+6 vs last week">+6 vs minggu lalu</small>
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
                      <span>My Tasks</span>
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
                        <label className="c-kravio-search" data-component="kravio-search" data-node-id="my-workspace.search">
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
                              Task
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="1">
                              Modul
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="2">
                              Prioritas
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="3">
                              Status
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="4">
                              Due
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="5">
                              Owner
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-label="Aksi"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr data-priority="High" data-status="In progress">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Follow-up PT Nusantara
                            </label>
                          </td>
                          <td>CRM & Sales</td>
                          <td>
                            <span className="chip risk">High</span>
                          </td>
                          <td>
                            <span className="chip progress">In progress</span>
                          </td>
                          <td>Hari ini 16:30</td>
                          <td>Aditya Pratama</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="High" data-status="Pending">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Review margin Quotation Q-2026-014
                            </label>
                          </td>
                          <td>Quotation</td>
                          <td>
                            <span className="chip risk">High</span>
                          </td>
                          <td>
                            <span className="chip pending">Pending</span>
                          </td>
                          <td>Hari ini 14:00</td>
                          <td>Rina Wijaya</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="High" data-status="At risk">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Review mitigation PRJ-042
                            </label>
                          </td>
                          <td>Project</td>
                          <td>
                            <span className="chip risk">High</span>
                          </td>
                          <td>
                            <span className="chip risk">At risk</span>
                          </td>
                          <td>Besok</td>
                          <td>Bagus Santoso</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Draft">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Submit approval PR-331
                            </label>
                          </td>
                          <td>Purchase</td>
                          <td>
                            <span className="chip pending">Medium</span>
                          </td>
                          <td>
                            <span className="chip info">Draft</span>
                          </td>
                          <td>7 Okt 2026</td>
                          <td>Sari Putri</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Done">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Rekonsiliasi payment INV-088
                            </label>
                          </td>
                          <td>Finance</td>
                          <td>
                            <span className="chip pending">Medium</span>
                          </td>
                          <td>
                            <span className="chip done">Done</span>
                          </td>
                          <td>8 Okt 2026</td>
                          <td>Sari Putri</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="In progress">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Update pipeline stage OP-108
                            </label>
                          </td>
                          <td>CRM & Sales</td>
                          <td>
                            <span className="chip info">Low</span>
                          </td>
                          <td>
                            <span className="chip progress">In progress</span>
                          </td>
                          <td>9 Okt 2026</td>
                          <td>Aditya Pratama</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Pending">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Stock opname gudang utama
                            </label>
                          </td>
                          <td>Inventory</td>
                          <td>
                            <span className="chip pending">Medium</span>
                          </td>
                          <td>
                            <span className="chip pending">Pending</span>
                          </td>
                          <td>10 Okt 2026</td>
                          <td>Bagus Santoso</td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Done">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Siapkan RUPS agenda
                            </label>
                          </td>
                          <td>Corporate</td>
                          <td>
                            <span className="chip info">Low</span>
                          </td>
                          <td>
                            <span className="chip done">Done</span>
                          </td>
                          <td>11 Okt 2026</td>
                          <td>Rina Wijaya</td>
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
