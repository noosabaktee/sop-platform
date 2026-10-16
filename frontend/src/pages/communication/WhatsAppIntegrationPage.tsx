import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function WhatsAppIntegrationPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="waintegration"
      data-route="/whatsapp-integration"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="waintegration.dashboard" data-sidebar="default" data-page-title="WhatsApp Integration" data-page-title-en="WhatsApp Integration" data-export-name="whatsapp-integration">
        <AppSidebar nodePrefix="waintegration" />
        <div className="main-column">
          <AppTopbar nodePrefix="waintegration" currentRouteTitle="WhatsApp Integration" />
          <section className="page-region">
            <h1 className="sr-only">WhatsApp Integration</h1>
            <header className="page-head">
              <div>
                <h2 data-en="WhatsApp Integration">WhatsApp Integration</h2>
                <p data-en="Accounts, inbox, contacts, broadcast, message templates, automated notifications, and WhatsApp bot.">Akun, inbox, kontak, broadcast, template pesan, notifikasi otomatis, dan bot WhatsApp.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="wa:sync">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Sync">Sinkron</span>
                </button>
                <button type="button" className="btn-primary" data-action="wa:compose">
                  <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
                  <span data-en="New message">Pesan baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu WhatsApp Integration" id="wa-tabs"></div>
            <div id="wa-panels"></div>
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
            <small>Prototype interaktif · data contoh WhatsApp SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
