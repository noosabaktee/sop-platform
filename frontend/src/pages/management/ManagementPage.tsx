import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function ManagementPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="management"
      data-route="/management"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="management.dashboard" data-sidebar="default" data-page-title="Management & Executive" data-page-title-en="Management & Executive" data-export-name="management">
        <AppSidebar nodePrefix="management" />
        <div className="main-column">
          <AppTopbar nodePrefix="management" currentRouteTitle="Management & Executive" />
          <section className="page-region">
            <h1 className="sr-only">Management & Executive</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Management & Executive">Management & Executive</h2>
                <p data-en="Executive dashboard, company KPI, performance, cash, AR/AP aging, pipeline, and strategic initiatives.">Executive dashboard, KPI perusahaan, performa, kas, AR/AP aging, pipeline, dan strategic initiatives.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="mgmt:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="mgmt:report">
                  <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                  <span data-en="Executive report">Laporan eksekutif</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Management & Executive" id="mgmt-tabs"></div>
            <div id="mgmt-panels"></div>
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
            <small>Prototype interaktif · data contoh Management SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
