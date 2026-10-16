import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function SecurityAuditPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="security"
      data-route="/security-audit"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="security.dashboard" data-sidebar="default" data-page-title="Security & Audit" data-page-title-en="Security & Audit" data-export-name="security-audit">
        <AppSidebar nodePrefix="security" />
        <div className="main-column">
          <AppTopbar nodePrefix="security" currentRouteTitle="Security & Audit" />
          <section className="page-region">
            <h1 className="sr-only">Security & Audit</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Security & Audit">Security & Audit</h2>
                <p data-en="User activity, audit trail, login history, access logs, data change history, security events, and session management.">Aktivitas user, audit trail, riwayat login, access log, perubahan data, security event, dan manajemen sesi.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="sec:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="sec:lockdown">
                  <iconify-icon noobserver icon="lucide:shield-alert" aria-hidden="true"></iconify-icon>
                  <span data-en="Lockdown">Lockdown</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Security & Audit" id="sec-tabs"></div>
            <div className="ctrl-bar">
              <span className="fresh">
                <span className="dot" aria-hidden="true"></span>
                <span data-en="Audit immutable">Audit immutable</span>
                {' '}·{' '}
                <span data-en="Freshness">Freshness</span>
                {' '}09:42
              </span>
              <span className="grow"></span>
              <input data-sec-search type="search" placeholder="Cari event / aktor / entity…" aria-label="Cari audit" />
              <select data-sec-sev aria-label="Severity">
                <option>Semua severity</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div id="sec-panels"></div>
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
            <small>Prototype interaktif · data contoh Security SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
