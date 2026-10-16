import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function DocumentManagementPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="documents"
      data-route="/document-management"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="documents.dashboard" data-sidebar="default" data-page-title="Document Management" data-page-title-en="Document Management" data-export-name="document-management">
        <AppSidebar nodePrefix="documents" />
        <div className="main-column">
          <AppTopbar nodePrefix="documents" currentRouteTitle="Document Management" />
          <section className="page-region">
            <h1 className="sr-only">Document Management</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Document Management">Document Management</h2>
                <p data-en="All, project, quotation, sales, purchase, finance, and company documents with versioning, approval, and digital signature.">Dokumen all, project, quotation, sales, purchase, finance, company dengan versioning, approval, dan digital signature.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="doc:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="doc:upload">
                  <iconify-icon noobserver icon="lucide:upload" aria-hidden="true"></iconify-icon>
                  <span data-en="Upload">Unggah</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Document Management" id="doc-tabs"></div>
            <div id="doc-panels"></div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <div className="preview" data-preview data-open="false" role="dialog" aria-modal="true" aria-label="Pratinjau dokumen">
            <div className="preview__win">
              <div className="preview__head">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <h3 data-preview-title>Preview</h3>
                <div className="preview__tools">
                  <button type="button" className="btn-ghost" data-preview-act="zoom-out" aria-label="Perkecil">
                    <iconify-icon noobserver icon="lucide:zoom-out" aria-hidden="true"></iconify-icon>
                  </button>
                  <span className="preview__zoom" data-preview-zoom>100%</span>
                  <button type="button" className="btn-ghost" data-preview-act="zoom-in" aria-label="Perbesar">
                    <iconify-icon noobserver icon="lucide:zoom-in" aria-hidden="true"></iconify-icon>
                  </button>
                  <button type="button" className="btn-ghost" data-preview-act="compare">
                    <iconify-icon noobserver icon="lucide:git-compare" aria-hidden="true"></iconify-icon>
                    {' '}Compare
                  </button>
                  <button type="button" className="btn-ghost" data-preview-act="sign">
                    <iconify-icon noobserver icon="lucide:pen-tool" aria-hidden="true"></iconify-icon>
                    {' '}Sign
                  </button>
                  <button type="button" className="btn-ghost" data-preview-act="download">
                    <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                    {' '}Download
                  </button>
                  <button type="button" className="btn-ghost" data-preview-act="close" aria-label="Tutup">
                    <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
                  </button>
                </div>
              </div>
              <div className="preview__body">
                <div className="preview__stage" data-preview-stage></div>
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
            <small>Prototype interaktif · data contoh Document SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
