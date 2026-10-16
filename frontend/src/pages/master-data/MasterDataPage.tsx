import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function MasterDataPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="masterdata"
      data-route="/master-data"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="masterdata.dashboard" data-sidebar="default" data-page-title="Master Data" data-page-title-en="Master Data" data-export-name="master-data">
        <AppSidebar nodePrefix="masterdata" />
        <div className="main-column">
          <AppTopbar nodePrefix="masterdata" currentRouteTitle="Master Data" />
          <section className="page-region">
            <h1 className="sr-only">Master Data</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Master Data">Master Data</h2>
                <p data-en="Company, COA, customers, vendors, products, assets, departments, employees, warehouses, pricing, banks, and cost centers.">Company, COA, customer, vendor, produk, aset, departemen, karyawan, gudang, harga, bank, dan cost center.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="md:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="md:import">
                  <iconify-icon noobserver icon="lucide:upload" aria-hidden="true"></iconify-icon>
                  <span data-en="Import">Import</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Master Data" id="md-tabs"></div>
            <div id="md-panels"></div>
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
            <small>Prototype interaktif · data contoh Master Data SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
