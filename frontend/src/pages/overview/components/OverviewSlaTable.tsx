import React from "react";

export function OverviewSlaTable() {
  return (
          <div className="table-region" data-node-id="nuvio.tickets">
            <section className="c-kravio-table" data-component="kravio-table" data-node-id="nuvio.sla-monitoring" aria-label="Daftar pekerjaan dan transaksi">
              <div className="c-kravio-table__header">
                <iconify-icon noobserver icon="lucide:table-2" aria-hidden="true"></iconify-icon>
                <h2>Daftar pekerjaan & transaksi</h2>
                <div className="c-kravio-table__tools">
                  <div className="c-kravio-table__search">
                    <label className="c-kravio-search" data-component="kravio-search" data-node-id="kravio.record-search">
                      <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                      <input type="search" placeholder="Cari record" aria-label="Cari record" data-action="kravio-table:search" data-part="input" />
                    </label>
                  </div>
                  <details className="c-kravio-table__filter">
                    <summary>
                      <iconify-icon noobserver icon="lucide:filter" aria-hidden="true"></iconify-icon>
                      <span>Filter</span>
                    </summary>
                    <div className="c-kravio-table__filter-panel">
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
                      <fieldset>
                        <legend>Status</legend>
                        <label>
                          <input type="checkbox" data-filter="status" value="Draft" />
                          Draft
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="Pending Approval" />
                          Pending Approval
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="At Risk" />
                          At Risk
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="Approved" />
                          Approved
                        </label>
                      </fieldset>
                      <button type="button" data-action="kravio-table:reset">Hapus filter</button>
                    </div>
                  </details>
                  <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="kravio.table-export" data-tone="icon" data-action="kravio-table:export" aria-label="Export record">
                    <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                    <span data-part="label">Export record</span>
                  </button>
                </div>
              </div>
              <div className="c-kravio-table__feedback" data-part="feedback" hidden>
                <span data-part="result-count" aria-live="polite"></span>
                <button type="button" data-action="kravio-table:reset">Hapus filter</button>
              </div>
              <div className="c-kravio-table__surface" tabIndex={0} aria-label="Tabel record yang dapat digulir">
                <table>
                  <thead>
                    <tr>
                      <th scope="col" aria-sort="none">
                        <input type="checkbox" data-action="kravio-table:all" aria-label="Pilih semua record" />
                        <button type="button" data-action="kravio-table:sort" data-column="0">
                          Record
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="1">
                          Deskripsi
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="2">
                          Prioritas
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="3">
                          Owner
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="4">
                          Status
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="5">
                          Modul
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="6">
                          Deadline
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-label="Aksi"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-record="Q-2026-014" data-priority="High" data-status="Pending Approval" data-node-id="sop.record.q2026014">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record Q-2026-014" defaultChecked />
                          Q-2026-014
                        </label>
                      </td>
                      <td>Quotation PT Nusantara · discount 12%</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.q2026014.priority" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">High</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.q2026014.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">RW</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Rina Wijaya</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.q2026014.status" data-tone="info">
                          <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Pending Approval</span>
                        </span>
                      </td>
                      <td>Quotation</td>
                      <td>Hari ini 14:00</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk Q-2026-014" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="OP-108" data-priority="Medium" data-status="Approved" data-node-id="sop.record.op108">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record OP-108" />
                          OP-108
                        </label>
                      </td>
                      <td>Opportunity follow-up customer</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.op108.priority" data-tone="warning">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Medium</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.op108.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">AP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Aditya Pratama</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.op108.status" data-tone="success">
                          <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Approved</span>
                        </span>
                      </td>
                      <td>CRM & Sales</td>
                      <td>Hari ini 16:30</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk OP-108" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="PRJ-042" data-priority="High" data-status="At Risk" data-node-id="sop.record.prj042">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record PRJ-042" />
                          PRJ-042
                        </label>
                      </td>
                      <td>Project risk review & cost variance</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.prj042.priority" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">High</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.prj042.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">BS</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Bagus Santoso</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.prj042.status" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true"></iconify-icon>
                          <span data-part="label">At Risk</span>
                        </span>
                      </td>
                      <td>Project</td>
                      <td>Besok</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk PRJ-042" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="PR-331" data-priority="Medium" data-status="Draft" data-node-id="sop.record.pr331">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record PR-331" />
                          PR-331
                        </label>
                      </td>
                      <td>Purchase request budget check</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.pr331.priority" data-tone="warning">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Medium</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.pr331.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">SP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Sari Putri</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.pr331.status" data-tone="yellow">
                          <iconify-icon noobserver icon="lucide:pencil" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Draft</span>
                        </span>
                      </td>
                      <td>Purchase</td>
                      <td>7 Okt 2026</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk PR-331" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="INV-088" data-priority="Low" data-status="Approved" data-node-id="sop.record.inv088">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record INV-088" />
                          INV-088
                        </label>
                      </td>
                      <td>Invoice AR · three-way match ready</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.inv088.priority" data-tone="yellow">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Low</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.inv088.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">SP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Sari Putri</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.inv088.status" data-tone="success">
                          <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Approved</span>
                        </span>
                      </td>
                      <td>Finance</td>
                      <td>8 Okt 2026</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk INV-088" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="c-kravio-table__empty" data-part="empty" hidden>Tidak ada record yang cocok.</p>
              </div>
              <footer className="c-kravio-table__pager" data-part="pager">
                <span className="c-kravio-table__pager-info" data-part="page-info" aria-live="polite"></span>
                <div className="c-kravio-table__pager-controls">
                  <label>
                    Baris per halaman{' '}
                    <select data-action="kravio-table:size" aria-label="Baris per halaman">
                      <option value="3">3</option>
                      <option value="5" selected>5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                    </select>
                  </label>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:first" aria-label="Halaman pertama">
                    <iconify-icon noobserver icon="lucide:chevrons-left" aria-hidden="true"></iconify-icon>
                  </button>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:prev" aria-label="Halaman sebelumnya">
                    <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                  </button>
                  <span className="c-kravio-table__page-numbers" data-part="page-numbers"></span>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:next" aria-label="Halaman berikutnya">
                    <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                  </button>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:last" aria-label="Halaman terakhir">
                    <iconify-icon noobserver icon="lucide:chevrons-right" aria-hidden="true"></iconify-icon>
                  </button>
                </div>
              </footer>
            </section>
                        {/* agent:nuvio.tickets-content */}
          </div>
  );
}
