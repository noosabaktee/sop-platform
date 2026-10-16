import React from "react";

export interface AppTopbarProps {
  currentRouteTitle?: string;
  parentTitle?: string;
  onLanguageChange?: (lang: string) => void;
  onThemeToggle?: () => void;
}

export function AppTopbar({
  currentRouteTitle = "Ringkasan hari ini",
  parentTitle = "My Workspace",
}: AppTopbarProps) {
  return (
    <header
      className="c-nuvio-topbar"
      data-component="nuvio-topbar"
      data-node-id="nuvio.topbar.navigation"
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        data-action="kravio:sidebar"
      >
        <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true" />
      </button>

      <nav aria-label="Breadcrumb">
        <a href="#/overview" data-part="crumb-home">
          {parentTitle}
        </a>
        <span aria-hidden="true">/</span>
        <strong data-part="crumb-page">{currentRouteTitle}</strong>
      </nav>

      <div className="c-nuvio-topbar__lang">
        <iconify-icon noobserver icon="lucide:languages" aria-hidden="true" />
        <select data-action="nuvio:lang" aria-label="Pilih bahasa">
          <option value="id">ID</option>
          <option value="en">EN</option>
        </select>
      </div>

      <button
        type="button"
        data-action="nuvio:theme"
        aria-pressed="false"
        aria-label="Aktifkan mode gelap"
      >
        <iconify-icon noobserver icon="lucide:moon" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Notifications"
        data-action="kravio:notifications"
      >
        <iconify-icon noobserver icon="lucide:bell" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Settings"
        data-action="kravio:settings"
      >
        <iconify-icon noobserver icon="lucide:settings-2" aria-hidden="true" />
      </button>
    </header>
  );
}

