import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function EmailCommunicationPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="emailcomm"
      data-route="/email-communication"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="emailcomm.dashboard" data-sidebar="default" data-page-title="Email & Communication" data-page-title-en="Email & Communication" data-export-name="email-communication">
        <AppSidebar nodePrefix="emailcomm" />
        <div className="main-column">
          <AppTopbar nodePrefix="emailcomm" currentRouteTitle="Email & Communication" />
          <section className="page-region">
            <h1 className="sr-only">Email & Communication</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Email & Communication">Email & Communication</h2>
                <p data-en="Inbox, sent, draft, threads, attachments, templates, signature, labels, rules, shared mailbox, and email integration.">Inbox, sent, draft, thread, attachment, template, signature, label, rule, shared mailbox, dan integrasi email.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="mail:sync">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Sync">Sinkron</span>
                </button>
                <button type="button" className="btn-primary" data-action="mail:compose">
                  <iconify-icon noobserver icon="lucide:pen-square" aria-hidden="true"></iconify-icon>
                  <span data-en="Compose">Tulis</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Email & Communication" id="mail-tabs"></div>
            <div id="mail-panels"></div>
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
            <small>Prototype interaktif · data contoh Email SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
