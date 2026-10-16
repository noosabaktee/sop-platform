import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function DataIntelligencePage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="dataintel"
      data-route="/data-intelligence"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="dataintel.dashboard" data-sidebar="default" data-page-title="Data Intelligence" data-page-title-en="Data Intelligence" data-export-name="data-intelligence">
        <div className="sidebar-region" data-node-id="dataintel.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="dataintel.sidebar.navigation" aria-label="Primary navigation">
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
          <div className="topbar-region" data-node-id="dataintel.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="dataintel.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">Data Intelligence</strong>
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
            <h1 className="sr-only">Data Intelligence</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Data Intelligence">Data Intelligence</h2>
                <p data-en="Web scraping, data sources, scraping jobs & scheduler, competitor/market/tender/lead data, cleaning, enrichment, monitoring, and dashboard.">Web scraping, sumber data, job & scheduler, data kompetitor/market/tender/lead, cleaning, enrichment, monitoring, dan dashboard.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="di:sync">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Sync">Sinkron</span>
                </button>
                <button type="button" className="btn-primary" data-action="di:new">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="New job">Job baru</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Data Intelligence" id="di-tabs"></div>
            <div className="ctrl-bar">
              <span className="sec-title">
                <iconify-icon noobserver icon="lucide:brain-circuit" aria-hidden="true" style={{ width: 16, height: 16, color: "#0f8a6a" }}></iconify-icon>
                <span data-en="Data Intelligence workspace">Ruang kerja Data Intelligence</span>
              </span>
              <span className="grow"></span>
              <label className="fresh">
                <span className="dot" aria-hidden="true"></span>
                <span data-en="Freshness">Freshness</span>
                {' '}09:42
              </label>
              <select data-di-scope aria-label="Scope data">
                <option>Semua sumber</option>
                <option>Portal tender</option>
                <option>Marketplace B2B</option>
                <option>Situs kompetitor</option>
              </select>
              <select data-di-period aria-label="Periode">
                <option>7 hari</option>
                <option>30 hari</option>
                <option>Kuartal ini</option>
              </select>
            </div>
            <div id="di-panels"></div>
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
            <small>Prototype interaktif · data contoh Data Intelligence SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
