import React from "react";

export function OverviewDataGrid() {
  return (
          <section className="data-grid-region" data-node-id="sop.handsontable-grid">
            <div className="data-grid-header">
              <div>
                <h2>Fokus pekerjaan hari ini</h2>
                <span>Handsontable · 6 record · terakhir diperbarui 09:42</span>
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
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Quotation Q-2026-014" />
                  </td>
                  <td>Quotation Q-2026-014</td>
                  <td>Quotation</td>
                  <td>Aditya Pratama</td>
                  <td>
                    <span className="status-chip pending">Pending approval</span>
                  </td>
                  <td>Hari ini, 14:00</td>
                  <td>Review margin</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Opportunity OP-108" />
                  </td>
                  <td>Opportunity OP-108</td>
                  <td>CRM & Sales</td>
                  <td>Rina Wijaya</td>
                  <td>
                    <span className="status-chip progress">Follow-up</span>
                  </td>
                  <td>Hari ini, 16:30</td>
                  <td>Hubungi customer</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Project PRJ-042" />
                  </td>
                  <td>Project PRJ-042</td>
                  <td>Project</td>
                  <td>Bagus Santoso</td>
                  <td>
                    <span className="status-chip risk">Risk flagged</span>
                  </td>
                  <td>Besok</td>
                  <td>Review mitigation</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Purchase Request PR-331" />
                  </td>
                  <td>Purchase Request PR-331</td>
                  <td>Procurement</td>
                  <td>Aditya Pratama</td>
                  <td>
                    <span className="status-chip pending">Menunggu approval</span>
                  </td>
                  <td>7 Okt 2026</td>
                  <td>Submit approval</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Invoice INV-088" />
                  </td>
                  <td>Invoice INV-088</td>
                  <td>Finance</td>
                  <td>Sari Putri</td>
                  <td>
                    <span className="status-chip done">Terverifikasi</span>
                  </td>
                  <td>8 Okt 2026</td>
                  <td>Rekonsiliasi payment</td>
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
