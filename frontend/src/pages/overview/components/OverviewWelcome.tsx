import React from "react";

export function OverviewWelcome() {
  return (
          <section className="welcome-region" data-node-id="nuvio.welcome">
            <div>
              <h1>
                Selamat pagi, Aditya{' '}
                <span role="img" aria-label="waving hand">👋</span>
              </h1>
              <p>My Workspace · Senin, 5 Oktober 2026 · Semua pekerjaan penting dalam satu tempat.</p>
            </div>
            <div className="welcome-actions">
              <label className="c-kravio-range" data-component="kravio-range" data-node-id="nuvio.dashboard-range" data-target="dashboard">
                <iconify-icon noobserver icon="lucide:calendar-days" aria-hidden="true"></iconify-icon>
                <select data-action="kravio-range:change" data-part="select" aria-label="dashboard time range">
                  <option>Last week</option>
                  <option>Last month</option>
                  <option>Last quarter</option>
                </select>
                <iconify-icon noobserver icon="lucide:chevron-down" aria-hidden="true"></iconify-icon>
              </label>
              <details className="options">
                <summary aria-label="Dashboard options">
                  <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                </summary>
                <div className="options-menu">
                  <button type="button" data-action="kravio:refresh">Refresh data</button>
                  <button type="button" data-action="kravio:print">Print dashboard</button>
                  <button type="button" data-action="kravio:reset">Reset range</button>
                </div>
              </details>
            </div>
                        {/* agent:nuvio.welcome-content */}

          </section>
  );
}
