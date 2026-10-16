import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function FinancePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="finance"
      data-route="/finance"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="finance.dashboard" data-sidebar="default" data-page-title="Finance & Accounting" data-page-title-en="Finance & Accounting" data-export-name="finance">
        <AppSidebar nodePrefix="finance" />
        <div className="main-column">
          <AppTopbar nodePrefix="finance" currentRouteTitle="Finance & Accounting" />
          <section className="page-region">
            <h1 className="sr-only">Finance & Accounting</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Finance & Accounting">Finance & Accounting</h2>
                <p data-en="Transactions, accounting, and cash & bank with AR/AP, journals, and reconciliation.">Transactions, accounting, dan cash & bank dengan AR/AP, jurnal, dan rekonsiliasi.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="fin:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="fin:create">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New record">Tambah record</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Finance" id="fin-tabs"></div>
            <div id="fin-panels"></div>
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
            <small>Prototype interaktif · data contoh Finance SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
