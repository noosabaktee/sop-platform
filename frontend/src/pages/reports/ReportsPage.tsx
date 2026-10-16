import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function ReportsPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="reports"
      data-route="/reports"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="reports.dashboard" data-sidebar="default" data-page-title="Reports & Analytics" data-page-title-en="Reports & Analytics" data-export-name="reports">
        <AppSidebar nodePrefix="reports" />
        <div className="main-column">
          <AppTopbar nodePrefix="reports" currentRouteTitle="Reports & Analytics" />
          <section className="page-region">
            <h1 className="sr-only">Reports & Analytics</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Reports & Analytics">Reports & Analytics</h2>
                <p data-en="Financial, tax, management, sales, purchase, project, inventory, asset, BD reports, KPI, custom report, and analytics.">Laporan finansial, pajak, manajemen, sales, purchase, project, inventory, asset, BD, KPI, custom report, dan analytics.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="rep:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="rep:schedule">
                  <iconify-icon noobserver icon="lucide:calendar-clock" aria-hidden="true"></iconify-icon>
                  <span data-en="Schedule">Jadwalkan</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Reports & Analytics" id="rep-tabs"></div>
            <div id="rep-panels"></div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <dialog className="dialog" aria-label="Detail">
            <button type="button" className="dialog-close" data-action="kravio:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-detail="title"></h2>
            <p data-detail="description"></p>
            <div data-detail="body"></div>
            <small>Prototype interaktif · data contoh Reports SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
