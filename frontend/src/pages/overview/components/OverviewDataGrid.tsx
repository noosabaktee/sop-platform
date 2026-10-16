import React from "react";

export function OverviewDataGrid() {
  return (
          <section className="data-grid-region" data-node-id="sop.handsontable-grid">
            <div className="data-grid-header">
              <div>
                <h2>Fokus pekerjaan hari ini</h2>
                <span>Handsontable · Terhubung langsung ke database</span>
              </div>
              <span className="status-chip progress">Grid siap diedit</span>
            </div>
            <table className="focus-grid">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" data-action="focus:all" aria-label="Pilih semua record" />
                  </th>
                  <th>Record</th>
                  <th>Modul</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                <tr data-template-row="true">
                  <td>
                    <input type="checkbox" aria-label="Pilih record" />
                  </td>
                  <td>Memuat data...</td>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <span className="status-chip pending">—</span>
                  </td>
                  <td>—</td>
                  <td>Sinkronisasi record...</td>
                </tr>
              </tbody>
            </table>
            <footer className="focus-pager" data-part="focus-pager">
              <span data-part="focus-info" aria-live="polite"></span>
              <div className="focus-pager__controls">
                <label>
                  Baris{' '}
                  <select data-action="focus:size" aria-label="Baris per halaman focus grid">
                    <option value="3">3</option>
                    <option value="5" selected>5</option>
                    <option value="10">10</option>
                  </select>
                </label>
                <button type="button" className="focus-page" data-action="focus:prev" aria-label="Halaman sebelumnya">
                  <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                </button>
                <span data-part="focus-pages"></span>
                <button type="button" className="focus-page" data-action="focus:next" aria-label="Halaman berikutnya">
                  <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                </button>
              </div>
            </footer>
          </section>
  );
}
