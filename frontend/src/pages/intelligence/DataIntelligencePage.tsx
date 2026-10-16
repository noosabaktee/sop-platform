import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function DataIntelligencePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="dataintel"
      data-route="/data-intelligence"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="dataintel.dashboard" data-sidebar="default" data-page-title="Data Intelligence" data-page-title-en="Data Intelligence" data-export-name="data-intelligence">
        <AppSidebar nodePrefix="dataintel" />
        <div className="main-column">
          <AppTopbar nodePrefix="dataintel" currentRouteTitle="Data Intelligence" />
          <section className="page-region">
            <h1 className="sr-only">Data Intelligence</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Data Intelligence">Data Intelligence</h2>
                <p data-en="Web scraping, data sources, scraping jobs & scheduler, competitor/market/tender/lead data, cleaning, enrichment, monitoring, and dashboard.">Web scraping, sumber data, job & scheduler, data kompetitor/market/tender/lead, cleaning, enrichment, monitoring, dan dashboard.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="di:sync">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Sync">Sinkron</span>
                </button>
                <button type="button" className="btn-primary" data-action="di:new">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New job">Job baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Data Intelligence" id="di-tabs"></div>
            <div className="ctrl-bar">
              <span className="sec-title">
                <iconify-icon noobserver icon="lucide:brain-circuit" aria-hidden="true" style={{ width: 16, height: 16, color: "#0f8a6a" }}></iconify-icon>
                <span data-en="Data Intelligence workspace">Ruang kerja Data Intelligence</span>
              </span>
              <span className="grow"></span>
              <label className="fresh">
                <span className="dot" aria-hidden="true"></span>
                <span data-en="Freshness">Freshness</span>
                {' '}09:42
              </label>
              <select data-di-scope aria-label="Scope data">
                <option>Semua sumber</option>
                <option>Portal tender</option>
                <option>Marketplace B2B</option>
                <option>Situs kompetitor</option>
              </select>
              <select data-di-period aria-label="Periode">
                <option>7 hari</option>
                <option>30 hari</option>
                <option>Kuartal ini</option>
              </select>
            </div>
            <div id="di-panels"></div>
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
            <small>Prototype interaktif · data contoh Data Intelligence SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
