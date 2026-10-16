import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function DocumentTemplatePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="doctemplate"
      data-route="/document-template"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="doctemplate.dashboard" data-sidebar="default" data-page-title="Document Template" data-page-title-en="Document Template" data-export-name="document-template">
        <AppSidebar nodePrefix="doctemplate" />
        <div className="main-column">
          <AppTopbar nodePrefix="doctemplate" currentRouteTitle="Document Template" />
          <section className="page-region">
            <h1 className="sr-only">Document Template</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Document Template">Document Template</h2>
                <p data-en="Quotation, invoice, PO, SO, BAST, contract, proposal, and report templates with live preview and template variables.">Template quotation, invoice, PO, SO, BAST, contract, proposal, dan report dengan live preview dan template variables.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="tpl:reset">
                  <iconify-icon noobserver icon="lucide:rotate-ccw" aria-hidden="true"></iconify-icon>
                  <span data-en="Reset">Reset</span>
                </button>
                <button type="button" className="btn-primary" data-action="tpl:save">
                  <iconify-icon noobserver icon="lucide:save" aria-hidden="true"></iconify-icon>
                  <span data-en="Save template">Simpan template</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Document Template" id="tpl-tabs"></div>
            <div id="tpl-panels"></div>
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
            <small>Prototype interaktif · data contoh Document Template SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
