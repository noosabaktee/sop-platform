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
                    <tr data-record="REC-2026-0001" data-priority="Medium" data-status="Pending" data-template-row="true">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record" />
                          REC-2026-0001
                        </label>
                      </td>
                      <td>Verifikasi dokumen pengujian implementasi ERP</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-tone="warning">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Medium</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">AP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Aditya Pratama</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-tone="info">
                          <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Pending</span>
                        </span>
                      </td>
                      <td>CRM & Sales</td>
                      <td>14 Okt 2026</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi" data-action="kravio-table:detail">
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
