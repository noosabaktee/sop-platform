import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function ManagementPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="management"
      data-route="/management"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="management.dashboard" data-sidebar="default" data-page-title="Management & Executive" data-page-title-en="Management & Executive" data-export-name="management">
        <div className="sidebar-region" data-node-id="management.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="management.sidebar.navigation" aria-label="Primary navigation">
            <div className="c-kravio-sidebar__brand" data-part="brand">
              <button type="button" className="c-kravio-sidebar__home" data-action="kravio-sidebar:navigate" title="Overview" aria-label="Buka Overview">
                <span className="c-kravio-sidebar__logo" aria-hidden="true">SO</span>
                <strong>Platform</strong>
              </button>
              <button type="button" aria-label="Collapse sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:panel-left" aria-hidden="true"></iconify-icon>
              </button>
            </div>
            <div className="c-kravio-sidebar__search">
              <label className="c-kravio-search" data-component="kravio-search" data-node-id="kravio.navigation-search">
                <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                <input type="search" placeholder="Search anything" aria-label="Search anything" data-action="kravio-sidebar:search" data-part="input" />
              </label>
              <kbd>⌘ K</kbd>
            </div>
            <nav data-part="navigation">
              <p className="c-kravio-sidebar__caption">My Workspace</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="My Workspace">
                <iconify-icon noobserver icon="lucide:home" aria-hidden="true"></iconify-icon>
                <span>My Workspace</span>
              </button>
              <p className="c-kravio-sidebar__caption">Dashboard</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="Dashboard">
                <iconify-icon noobserver icon="lucide:layout-dashboard" aria-hidden="true"></iconify-icon>
                <span>Dashboard</span>
              </button>
              <p className="c-kravio-sidebar__caption">Commercial</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="CRM & Sales">
                <iconify-icon noobserver icon="lucide:briefcase" aria-hidden="true"></iconify-icon>
                <span>CRM & Sales</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Business Development">
                <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                <span>Business Development</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Quotation">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <span>Quotation</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Sales">
                <iconify-icon noobserver icon="lucide:shopping-cart" aria-hidden="true"></iconify-icon>
                <span>Sales</span>
              </button>
              <p className="c-kravio-sidebar__caption">Delivery & Operations</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="Project">
                <iconify-icon noobserver icon="lucide:folder-kanban" aria-hidden="true"></iconify-icon>
                <span>Project</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Purchase">
                <iconify-icon noobserver icon="lucide:clipboard-list" aria-hidden="true"></iconify-icon>
                <span>Purchase</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Inventory">
                <iconify-icon noobserver icon="lucide:warehouse" aria-hidden="true"></iconify-icon>
                <span>Inventory</span>
              </button>
              <p className="c-kravio-sidebar__caption">Finance & Insights</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="Finance & Accounting">
                <iconify-icon noobserver icon="lucide:wallet-cards" aria-hidden="true"></iconify-icon>
                <span>Finance & Accounting</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Reports & Analytics">
                <iconify-icon noobserver icon="lucide:bar-chart-3" aria-hidden="true"></iconify-icon>
                <span>Reports & Analytics</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Management & Executive">
                <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                <span>Management & Executive</span>
              </button>
              <p className="c-kravio-sidebar__caption">Data & Documents</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="Master Data">
                <iconify-icon noobserver icon="lucide:database" aria-hidden="true"></iconify-icon>
                <span>Master Data</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Document Management">
                <iconify-icon noobserver icon="lucide:files" aria-hidden="true"></iconify-icon>
                <span>Document Management</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Document Template">
                <iconify-icon noobserver icon="lucide:layout-template" aria-hidden="true"></iconify-icon>
                <span>Document Template</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Email & Communication">
                <iconify-icon noobserver icon="lucide:mail" aria-hidden="true"></iconify-icon>
                <span>Email & Communication</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Omnichannel">
                <iconify-icon noobserver icon="lucide:messages-square" aria-hidden="true"></iconify-icon>
                <span>Omnichannel</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="WhatsApp Integration">
                <iconify-icon noobserver icon="lucide:message-circle" aria-hidden="true"></iconify-icon>
                <span>WhatsApp Integration</span>
              </button>
              <p className="c-kravio-sidebar__caption">Governance & Intelligence</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="General Meeting & RUPS">
                <iconify-icon noobserver icon="lucide:gavel" aria-hidden="true"></iconify-icon>
                <span>General Meeting & RUPS</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Workflow & Approval">
                <iconify-icon noobserver icon="lucide:git-merge" aria-hidden="true"></iconify-icon>
                <span>Workflow & Approval</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Corporate">
                <iconify-icon noobserver icon="lucide:building-2" aria-hidden="true"></iconify-icon>
                <span>Corporate</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="AI Assistant">
                <iconify-icon noobserver icon="lucide:sparkles" aria-hidden="true"></iconify-icon>
                <span>AI Assistant</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Data Intelligence">
                <iconify-icon noobserver icon="lucide:brain-circuit" aria-hidden="true"></iconify-icon>
                <span>Data Intelligence</span>
              </button>
              <p className="c-kravio-sidebar__caption">Administration</p>
              <button type="button" data-action="kravio-sidebar:navigate" title="Integrations">
                <iconify-icon noobserver icon="lucide:plug" aria-hidden="true"></iconify-icon>
                <span>Integrations</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Security & Audit">
                <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
                <span>Security & Audit</span>
              </button>
              <button type="button" data-action="kravio-sidebar:navigate" title="Settings">
                <iconify-icon noobserver icon="lucide:settings-2" aria-hidden="true"></iconify-icon>
                <span>Settings</span>
              </button>
            </nav>
            <button type="button" className="c-kravio-sidebar__profile" data-action="kravio:profile">
              <span className="c-kravio-sidebar__avatar">AP</span>
              <span>
                <strong>Aditya Pratama</strong>
                <small>aditya.pratama@example.com</small>
              </span>
              <iconify-icon noobserver icon="lucide:chevrons-up-down" aria-hidden="true"></iconify-icon>
            </button>
          </aside>
        </div>
        <div className="main-column">
          <div className="topbar-region" data-node-id="management.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="management.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">Management & Executive</strong>
              </nav>
              <div className="c-nuvio-topbar__lang">
                <iconify-icon noobserver icon="lucide:languages" aria-hidden="true"></iconify-icon>
                <select data-action="nuvio:lang" aria-label="Pilih bahasa">
                  <option value="id">ID</option>
                  <option value="en">EN</option>
                </select>
              </div>
              <button type="button" data-action="nuvio:theme" aria-pressed="false" aria-label="Aktifkan mode gelap">
                <iconify-icon noobserver icon="lucide:moon" aria-hidden="true"></iconify-icon>
              </button>
              <button type="button" aria-label="Notifications" data-action="kravio:notifications">
                <iconify-icon noobserver icon="lucide:bell" aria-hidden="true"></iconify-icon>
              </button>
              <button type="button" aria-label="Settings" data-action="kravio:settings">
                <iconify-icon noobserver icon="lucide:settings-2" aria-hidden="true"></iconify-icon>
              </button>
            </header>
          </div>
          <section className="page-region">
            <h1 className="sr-only">Management & Executive</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Management & Executive">Management & Executive</h2>
                <p data-en="Executive dashboard, company KPI, performance, cash, AR/AP aging, pipeline, and strategic initiatives.">Executive dashboard, KPI perusahaan, performa, kas, AR/AP aging, pipeline, dan strategic initiatives.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="mgmt:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Ekspor</span>
                </button>
                <button type="button" className="btn-primary" data-action="mgmt:report">
                  <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                  <span data-en="Executive report">Laporan eksekutif</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Management & Executive" id="mgmt-tabs"></div>
            <div id="mgmt-panels"></div>
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
            <small>Prototype interaktif · data contoh Management SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
