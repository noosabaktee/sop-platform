import { AppSidebar, AppTopbar } from "../../components";
import React from "react";
import {
  OverviewWelcome,
  OverviewMetrics,
  OverviewChart,
  OverviewUpdates,
  OverviewSlaTable,
  OverviewDataGrid,
} from "./components";

export interface PageProps {
  hidden?: boolean;
}

export function OverviewPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="nuvio"
      data-route="/overview"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="nuvio.dashboard" data-sidebar="default">
        <AppSidebar nodePrefix="nuvio" />
        <div className="main-column">
          <AppTopbar nodePrefix="nuvio" currentRouteTitle="Ringkasan hari ini" />
          <OverviewWelcome />
          <main className="analytics-region" data-node-id="nuvio.analytics">
            <OverviewMetrics />
            <OverviewChart />
            <OverviewUpdates />
          </main>
          <OverviewSlaTable />
          <OverviewDataGrid />
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Close navigation"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <dialog className="dialog" aria-label="Dashboard details">
            <button type="button" className="dialog-close" data-action="kravio:close" aria-label="Close dialog">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-detail="title"></h2>
            <p data-detail="description"></p>
            <p data-detail="fields"></p>
            <small>Interactive prototype · reference sample data</small>
            <footer>
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="nuvio.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Done">
                <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                <span data-part="label">Done</span>
              </button>
            </footer>
          </dialog>
                    {/* agent:page-sections */}

        </div>
      </div>
    </section>
  );
}
