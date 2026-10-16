import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function OmnichannelPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="omnichannel"
      data-route="/omnichannel"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="omnichannel.dashboard" data-sidebar="default" data-page-title="Omnichannel" data-page-title-en="Omnichannel" data-export-name="omnichannel">
        <AppSidebar nodePrefix="omnichannel" />
        <div className="main-column">
          <AppTopbar nodePrefix="omnichannel" currentRouteTitle="Omnichannel" />
          <section className="page-region">
            <h1 className="sr-only">Omnichannel</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Omnichannel">Omnichannel</h2>
                <p data-en="Unified inbox across WhatsApp, email, web chat, and social media with assignment, tags, canned response, chatbot, and analytics.">Unified inbox lintas WhatsApp, email, web chat, dan social media dengan assignment, tag, canned response, chatbot, dan analytics.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="omni:refresh">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Refresh">Refresh</span>
                </button>
                <button type="button" className="btn-primary" data-action="omni:broadcast">
                  <iconify-icon noobserver icon="lucide:megaphone" aria-hidden="true"></iconify-icon>
                  <span data-en="Broadcast">Broadcast</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Omnichannel" id="omni-tabs"></div>
            <div id="omni-panels"></div>
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
            <small>Prototype interaktif · data contoh Omnichannel SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
