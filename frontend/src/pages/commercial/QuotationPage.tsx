import { AppSidebar, AppTopbar } from "../../components";
import React from "react";
import { QuotationTabsNav, QuotationPanels } from "./tabs";

export interface PageProps {
  hidden?: boolean;
}

export function QuotationPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="quotation"
      data-route="/quotation"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="quotation.dashboard" data-sidebar="default" data-page-title="Quotation" data-page-title-en="Quotation" data-export-name="quotation">
        <AppSidebar nodePrefix="quotation" />
        <div className="main-column">
          <AppTopbar nodePrefix="quotation" currentRouteTitle="Quotation" />
          <section className="page-region">
            <h1 className="sr-only">Quotation</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Quotation">Quotation</h2>
                <p data-en="Create, approve, send, and convert quotations into sales orders.">Buat, setujui, kirim, dan konversi quotation menjadi sales order.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="dash:saveview">
                  <iconify-icon noobserver icon="lucide:bookmark" aria-hidden="true"></iconify-icon>
                  <span data-en="Save view">Simpan view</span>
                </button>
                <button type="button" className="btn-ghost" data-action="dash:refresh">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Refresh">Refresh</span>
                </button>
                <button type="button" className="btn-primary" data-action="q:new">
                  <iconify-icon noobserver icon="lucide:file-plus" aria-hidden="true"></iconify-icon>
                  <span data-en="Create quotation">Buat quotation</span>
                </button>
              </div>
            </header>
            <div className="dash-filter" role="group" aria-label="Filter Quotation">
              <label>
                <span data-en="Period">Periode</span>
                <select data-action="dash:filter" data-filter="periode" aria-label="Periode">
                  <option>Bulan ini</option>
                  <option>Kuartal ini</option>
                  <option>Tahun ini</option>
                </select>
              </label>
              <label>
                <span data-en="Company">Company</span>
                <select data-action="dash:filter" data-filter="company" aria-label="Company">
                  <option>SOP Indonesia</option>
                  <option>SOP Nusantara</option>
                  <option>SOP Global</option>
                </select>
              </label>
              <label>
                <span data-en="Branch">Branch</span>
                <select data-action="dash:filter" data-filter="branch" aria-label="Branch">
                  <option>Semua cabang</option>
                  <option>Jakarta</option>
                  <option>Surabaya</option>
                  <option>Bandung</option>
                </select>
              </label>
              <label>
                <span data-en="Owner">Owner</span>
                <select data-action="dash:filter" data-filter="owner" aria-label="Owner">
                  <option>Semua owner</option>
                  <option>Aditya Pratama</option>
                  <option>Rina Wijaya</option>
                  <option>Bagus Santoso</option>
                  <option>Sari Putri</option>
                </select>
              </label>
              <label>
                <span data-en="Status">Status</span>
                <select data-action="dash:filter" data-filter="status" aria-label="Status">
                  <option>Semua status</option>
                  <option>Draft</option>
                  <option>Pending Approval</option>
                  <option>Sent</option>
                  <option>Negotiation</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Expired</option>
                </select>
              </label>
              <button type="button" className="btn-ghost" data-action="dash:reset">
                <iconify-icon noobserver icon="lucide:rotate-ccw" aria-hidden="true"></iconify-icon>
                <span data-en="Reset">Reset</span>
              </button>
              <span className="dash-fresh">
                <i className="dot" aria-hidden="true"></i>
                <span data-en="Freshness">Freshness</span>
                <strong data-part="dash-fresh-time">09:42</strong>
              </span>
            </div>
            <QuotationTabsNav />
            <QuotationPanels />
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <dialog className="dialog" aria-label="Detail">
            <button type="button" className="dialog-close" data-action="kravio:close" aria-label="Tutup dialog">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-detail="title"></h2>
            <p data-detail="description"></p>
            <p data-detail="fields"></p>
            <small>Prototype interaktif · data contoh SOP</small>
            <footer>
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="qt.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Selesai">
                <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                <span data-part="label">Selesai</span>
              </button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
