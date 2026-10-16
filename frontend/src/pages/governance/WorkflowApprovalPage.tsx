import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function WorkflowApprovalPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="workflow"
      data-route="/workflow-approval"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="workflow.dashboard" data-sidebar="default" data-page-title="Workflow & Approval" data-page-title-en="Workflow & Approval" data-export-name="workflow-approval">
        <AppSidebar nodePrefix="workflow" />
        <div className="main-column">
          <AppTopbar nodePrefix="workflow" currentRouteTitle="Workflow & Approval" />
          <section className="page-region">
            <h1 className="sr-only">Workflow & Approval</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Workflow & Approval">Workflow & Approval</h2>
                <p data-en="Approval center with due date, amount, requester, risk flag, decision actions, delegation, escalation, and approval matrix.">Pusat approval dengan due date, nilai, pengaju, risk flag, aksi keputusan, delegasi, eskalasi, dan approval matrix.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="wf:delegate">
                  <iconify-icon noobserver icon="lucide:user-plus" aria-hidden="true"></iconify-icon>
                  <span data-en="Delegate">Delegasikan</span>
                </button>
                <button type="button" className="btn-primary" data-action="wf:bulk">
                  <iconify-icon noobserver icon="lucide:check-check" aria-hidden="true"></iconify-icon>
                  <span data-en="Bulk approve">Bulk approve</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Workflow & Approval" id="wf-tabs"></div>
            <div id="wf-panels"></div>
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
            <small>Prototype interaktif · data contoh Workflow SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
