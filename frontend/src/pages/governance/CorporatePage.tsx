import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function CorporatePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="corporate"
      data-route="/corporate"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="corporate.dashboard" data-sidebar="default" data-page-title="Corporate" data-page-title-en="Corporate" data-export-name="corporate">
        <AppSidebar nodePrefix="corporate" />
        <div className="main-column">
          <AppTopbar nodePrefix="corporate" currentRouteTitle="Corporate" />
          <section className="page-region">
            <h1 className="sr-only">Corporate</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Corporate">Corporate</h2>
                <p data-en="Corporate calendar, board/management meetings, RUPS, resolutions, documents, and action items.">Kalender korporat, rapat direksi/manajemen, RUPS, resolusi, dokumen, dan action item.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="cor:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="cor:new">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New event">Agenda baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Corporate" id="cor-tabs"></div>
            <div id="cor-panels"></div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <div className="preview" data-preview data-open="false" role="dialog" aria-modal="true" aria-label="Pratinjau dokumen">
            <div className="preview__win">
              <div className="preview__head">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <h3 data-preview-title>Preview</h3>
                <button type="button" className="btn-ghost" data-preview-act="close" aria-label="Tutup">
                  <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
                </button>
              </div>
              <div className="preview__body">
                <div data-preview-stage></div>
              </div>
            </div>
          </div>
          <dialog className="dialog" aria-label="Detail">
            <button type="button" className="dialog-close" data-action="kravio:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-detail="title"></h2>
            <p data-detail="description"></p>
            <div data-detail="body"></div>
            <small>Prototype interaktif · data contoh Corporate SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
