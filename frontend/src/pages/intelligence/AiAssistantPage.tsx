import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function AiAssistantPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="aiassistant"
      data-route="/ai-assistant"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="aiassistant.dashboard" data-sidebar="default" data-page-title="AI Assistant" data-page-title-en="AI Assistant" data-export-name="ai-assistant">
        <AppSidebar nodePrefix="aiassistant" />
        <div className="main-column">
          <AppTopbar nodePrefix="aiassistant" currentRouteTitle="AI Assistant" />
          <section className="page-region">
            <h1 className="sr-only">AI Assistant</h1>
            <header className="page-head">
              <div>
                <h2 data-en="AI Assistant">AI Assistant</h2>
                <p data-en="AI chat, role-based business assistants, Ask Your Data, document summarization & generation, data analysis, recommendations, workflow, and AI agent.">AI chat, asisten bisnis berbasis peran, Ask Your Data, ringkas & buat dokumen, analisis data, rekomendasi, workflow, dan AI agent.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="ai:clear">
                  <iconify-icon noobserver icon="lucide:eraser" aria-hidden="true"></iconify-icon>
                  <span data-en="Clear">Bersihkan</span>
                </button>
                <button type="button" className="btn-primary" data-action="ai:new">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New chat">Chat baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu AI Assistant" id="ai-tabs"></div>
            <div id="ai-panels"></div>
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
            <small>Prototype interaktif · data contoh AI SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
