import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function PurchasePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="purchase"
      data-route="/purchase"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="purchase.dashboard" data-sidebar="default" data-page-title="Purchase" data-page-title-en="Purchase" data-export-name="purchase">
        <AppSidebar nodePrefix="purchase" />
        <div className="main-column">
          <AppTopbar nodePrefix="purchase" currentRouteTitle="Purchase" />
          <section className="page-region">
            <h1 className="sr-only">Purchase</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Purchase">Purchase</h2>
                <p data-en="Purchase request, order, goods receipt, return, vendors, prices, and vendor evaluation in one place.">Purchase request, order, goods receipt, return, vendor, harga, dan evaluasi vendor dalam satu tempat.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="pur:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="pur:create">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New record">Tambah record</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Purchase" id="pur-tabs"></div>
            <div id="pur-panels"></div>
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
            <small>Prototype interaktif · data contoh Purchase SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
