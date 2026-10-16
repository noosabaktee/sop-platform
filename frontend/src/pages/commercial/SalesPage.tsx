import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function SalesPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="sales"
      data-route="/sales"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="sales.dashboard" data-sidebar="default" data-page-title="Sales" data-page-title-en="Sales" data-export-name="sales">
        <AppSidebar nodePrefix="sales" />
        <div className="main-column">
          <AppTopbar nodePrefix="sales" currentRouteTitle="Sales" />
          <section className="page-region">
            <h1 className="sr-only">Sales</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Sales">Sales</h2>
                <p data-en="Pengolahan data: inline editing, staged change, import/export, dan approval.">Pengolahan data: inline editing, staged change, import/export, dan approval.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="sop:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="sop:create" data-kind="Record">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New record">Tambah record</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Sales" id="sales-tabs"></div>
            <div id="sales-panels"></div>
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
            <small>Prototype interaktif · data contoh SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
