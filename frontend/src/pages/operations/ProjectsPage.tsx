import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function ProjectsPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="projects"
      data-route="/projects"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="projects.dashboard" data-sidebar="default" data-page-title="Project" data-page-title-en="Project" data-export-name="project">
        <AppSidebar nodePrefix="projects" />
        <div className="main-column">
          <AppTopbar nodePrefix="projects" currentRouteTitle="Project" />
          <section className="page-region">
            <h1 className="sr-only">Project</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Project">Project</h2>
                <p data-en="Planning, WBS, tasks, Gantt, budget, cost, risk, issue, and profitability in one place.">Planning, WBS, task, Gantt, budget, cost, risk, issue, dan profitability dalam satu tempat.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="proj:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="proj:create">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New project">Project baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Project" id="proj-tabs"></div>
            <div id="proj-panels"></div>
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
            <small>Prototype interaktif · data contoh Project SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
