import React from "react";

export function WorkspaceCalendarTab() {
  return (
              <div className="ws-panel" id="ws-panel-quotation" role="tabpanel" aria-labelledby="ws-tab-quotation" data-panel="quotation" data-title="My Calendar" data-title-en="My Calendar" hidden>
                <header className="page-head">
                  <div>
                    <h2 data-en="My Calendar">My Calendar</h2>
                    <p data-en="Your meetings, deadlines and reminders.">Meeting, deadline, dan pengingat yang terhubung dengan pekerjaan Anda.</p>
                  </div>
                  <div className="page-actions">
                    <button type="button" className="btn-ghost" data-action="sop:export">
                      <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                      <span data-en="Export">Export</span>
                    </button>
                    <button type="button" className="btn-primary" data-action="sop:create" data-kind="Event">
                      <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                      {' '}Event
                    </button>
                  </div>
                </header>
                <div className="kpi-row">
                  <button type="button" className="kpi" data-tone="green" data-action="sop:drill" data-kind="Events this week">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Events this week">Event minggu ini</span>
                      <iconify-icon noobserver icon="lucide:calendar-days" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">11</strong>
                        <span className="kpi__comparison">
                          <small data-en="3 today">3 hari ini</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="blue" data-action="sop:drill" data-kind="Meetings">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Meetings">Meeting</span>
                      <iconify-icon noobserver icon="lucide:users" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">6</strong>
                        <span className="kpi__comparison">
                          <small data-en="2 external">2 eksternal</small>
                        </span>
                      </span>
                      <svg className="kpi__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                        <polygon className="kpi__spark-area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                        <polyline className="kpi__spark-line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                        <circle className="kpi__spark-dot" cx="90" cy="30" r="2.5" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="kpi" data-tone="red" data-action="sop:drill" data-kind="Deadlines">
                    <span className="kpi__heading">
                      <span className="kpi__title" data-en="Deadlines">Deadline</span>
                      <iconify-icon noobserver icon="lucide:alarm-clock" aria-hidden="true"></iconify-icon>
                    </span>
                    <span className="kpi__body">
                      <span className="kpi__main">
                        <strong className="kpi__value">4</strong>
                        <span className="kpi__comparison">
                          <small data-en="1 urgent">1 mendesak</small>
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
                      <span data-en="My Calendar">Kalender Saya</span>
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
                        <label className="c-kravio-search" data-component="kravio-search" data-node-id="quotation.search">
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
                              Agenda
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="1">
                              Tanggal
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="2">
                              Waktu
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="3">
                              Peserta
                              <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                            </button>
                          </th>
                          <th scope="col" aria-sort="none">
                            <button type="button" data-action="table:sort" data-column="4">
                              Lokasi
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
                        <tr data-priority="Low" data-status="Confirmed">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Kickoff PRJ-042
                            </label>
                          </td>
                          <td>5 Okt 2026</td>
                          <td>14:00-15:00</td>
                          <td>8 orang</td>
                          <td>Meeting Room A</td>
                          <td>
                            <span className="chip done">Confirmed</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Pending">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Review quotation Q-2026-014
                            </label>
                          </td>
                          <td>5 Okt 2026</td>
                          <td>16:30-17:00</td>
                          <td>3 orang</td>
                          <td>Online</td>
                          <td>
                            <span className="chip pending">Pending</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Confirmed">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Vendor meeting PT Alpha
                            </label>
                          </td>
                          <td>6 Okt 2026</td>
                          <td>09:00-10:00</td>
                          <td>5 orang</td>
                          <td>Zoom</td>
                          <td>
                            <span className="chip done">Confirmed</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Confirmed">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Board meeting
                            </label>
                          </td>
                          <td>7 Okt 2026</td>
                          <td>10:00-12:00</td>
                          <td>12 orang</td>
                          <td>Board Room</td>
                          <td>
                            <span className="chip done">Confirmed</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="High" data-status="Deadline">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Deadline submit PR-331
                            </label>
                          </td>
                          <td>7 Okt 2026</td>
                          <td>17:00</td>
                          <td>Tim Procurement</td>
                          <td>Sistem</td>
                          <td>
                            <span className="chip risk">Deadline</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Tentative">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Presentasi proposal BD-021
                            </label>
                          </td>
                          <td>9 Okt 2026</td>
                          <td>13:00-14:30</td>
                          <td>6 orang</td>
                          <td>Meeting Room B</td>
                          <td>
                            <span className="chip info">Tentative</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Low" data-status="Confirmed">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              RUPS persiapan
                            </label>
                          </td>
                          <td>11 Okt 2026</td>
                          <td>09:00-11:00</td>
                          <td>15 orang</td>
                          <td>Auditorium</td>
                          <td>
                            <span className="chip done">Confirmed</span>
                          </td>
                          <td>
                            <button type="button" className="btn-ghost" style={{ height: 26, padding: "0 8px" }} data-action="table:detail" aria-label="Detail">…</button>
                          </td>
                        </tr>
                        <tr data-priority="Medium" data-status="Tentative">
                          <td>
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input type="checkbox" data-action="table:select" aria-label="Pilih record" />
                              Review profitability PRJ-041
                            </label>
                          </td>
                          <td>12 Okt 2026</td>
                          <td>15:00-16:00</td>
                          <td>4 orang</td>
                          <td>Online</td>
                          <td>
                            <span className="chip info">Tentative</span>
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
