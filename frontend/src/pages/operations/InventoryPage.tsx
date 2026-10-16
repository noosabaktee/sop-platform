import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function InventoryPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="inventory"
      data-route="/inventory"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="inventory.dashboard" data-sidebar="default" data-page-title="Inventory" data-page-title-en="Inventory" data-export-name="inventory">
        <AppSidebar nodePrefix="inventory" />
        <div className="main-column">
          <AppTopbar nodePrefix="inventory" currentRouteTitle="Inventory" />
          <section className="page-region">
            <h1 className="sr-only">Inventory</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Inventory">Inventory</h2>
                <p data-en="Stock, movement, transfer, opname, adjustment, serial, batch/lot, and valuation in one place.">Stock, movement, transfer, opname, adjustment, serial, batch/lot, dan valuation dalam satu tempat.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="inv:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="inv:create">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New record">Tambah record</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Inventory" id="inv-tabs"></div>
            <div id="inv-panels"></div>
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
            <small>Prototype interaktif · data contoh Inventory SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
