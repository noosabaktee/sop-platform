import { AppSidebar, AppTopbar } from "../../components";
import React from "react";
import {
  WorkspaceTabsNav,
  MyTasksTab,
  WorkspaceDashboardTab,
  WorkspaceCrmSalesTab,
  WorkspaceActivitiesTab,
  WorkspaceCalendarTab,
  WorkspaceDocumentsTab,
  WorkspaceNotificationsTab,
  WorkspaceEmailTab,
  WorkspaceProfileTab,
} from "./tabs";

export interface PageProps {
  hidden?: boolean;
}

export function MyWorkspacePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="my-workspace"
      data-route="/my-workspace"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="my-workspace.dashboard" data-sidebar="default" data-page-title="My Workspace" data-page-title-en="My Workspace" data-export-name="my-workspace">
        <AppSidebar nodePrefix="my-workspace" />
        <div className="main-column">
          <AppTopbar nodePrefix="my-workspace" currentRouteTitle="My Workspace" />
          <section className="page-region">
            <h1 className="sr-only">My Workspace</h1>
            <WorkspaceTabsNav />
            <div className="ws-panels">
              <MyTasksTab />
              <WorkspaceDashboardTab />
              <WorkspaceCrmSalesTab />
              <WorkspaceActivitiesTab />
              <WorkspaceCalendarTab />
              <WorkspaceDocumentsTab />
              <WorkspaceNotificationsTab />
              <WorkspaceEmailTab />
              <WorkspaceProfileTab />
            </div>
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
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="my-workspace.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Selesai">
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
