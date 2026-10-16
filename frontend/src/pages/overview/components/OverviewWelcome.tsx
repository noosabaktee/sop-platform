import React from "react";
import { useAuth } from "../../../app/AuthContext";

export function OverviewWelcome() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Pengguna";
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 18
          ? "Selamat sore"
          : "Selamat malam";
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
          <section className="welcome-region" data-node-id="nuvio.welcome">
            <div>
              <h1>
                {greeting}, {firstName}{' '}
                <span role="img" aria-label="waving hand">👋</span>
              </h1>
              <p>My Workspace · {todayFormatted} · Semua pekerjaan penting dalam satu tempat.</p>
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
