import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function BusinessDevelopmentPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="business-development"
      data-route="/business-development"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="business-development.dashboard" data-sidebar="default" data-page-title="Business Development" data-page-title-en="Business Development" data-export-name="business-development">
        <div className="sidebar-region" data-node-id="business-development.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="business-development.sidebar.navigation" aria-label="Primary navigation">
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
          <div className="topbar-region" data-node-id="business-development.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="business-development.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">Business Development</strong>
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
            <h1 className="sr-only">Business Development</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Business Development">Business Development</h2>
                <p data-en="Markets, tenders, partnerships, proposals, and competitors in one place.">Market, tender, partnership, proposal, dan competitor dalam satu tempat.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="dash:saveview">
                  <iconify-icon noobserver icon="lucide:bookmark" aria-hidden="true"></iconify-icon>
                  <span data-en="Save view">Simpan view</span>
                </button>
                <button type="button" className="btn-ghost" data-action="dash:refresh">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Refresh">Refresh</span>
                </button>
                <button type="button" className="btn-primary" data-action="dash:export">
                  <iconify-icon noobserver icon="lucide:download" aria-hidden="true"></iconify-icon>
                  <span data-en="Export">Export</span>
                </button>
              </div>
            </header>
            <div className="dash-filter" role="group" aria-label="Filter Business Development">
              <label>
                <span data-en="Period">Periode</span>
                <select data-action="dash:filter" data-filter="periode" aria-label="Periode">
                  <option>Bulan ini</option>
                  <option>Kuartal ini</option>
                  <option>Tahun ini</option>
                </select>
              </label>
              <label>
                <span data-en="Company">Company</span>
                <select data-action="dash:filter" data-filter="company" aria-label="Company">
                  <option>SOP Indonesia</option>
                  <option>SOP Nusantara</option>
                  <option>SOP Global</option>
                </select>
              </label>
              <label>
                <span data-en="Branch">Branch</span>
                <select data-action="dash:filter" data-filter="branch" aria-label="Branch">
                  <option>Semua cabang</option>
                  <option>Jakarta</option>
                  <option>Surabaya</option>
                  <option>Bandung</option>
                </select>
              </label>
              <label>
                <span data-en="Owner">Owner</span>
                <select data-action="dash:filter" data-filter="owner" aria-label="Owner">
                  <option>Semua owner</option>
                  <option>Aditya Pratama</option>
                  <option>Rina Wijaya</option>
                  <option>Bagus Santoso</option>
                  <option>Sari Putri</option>
                </select>
              </label>
              <label>
                <span data-en="Market">Market</span>
                <select data-action="dash:filter" data-filter="market" aria-label="Market">
                  <option>Semua market</option>
                  <option>Enterprise</option>
                  <option>Government</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                </select>
              </label>
              <button type="button" className="btn-ghost" data-action="dash:reset">
                <iconify-icon noobserver icon="lucide:rotate-ccw" aria-hidden="true"></iconify-icon>
                <span data-en="Reset">Reset</span>
              </button>
              <span className="dash-fresh">
                <i className="dot" aria-hidden="true"></i>
                <span data-en="Freshness">Freshness</span>
                <strong data-part="dash-fresh-time">09:42</strong>
              </span>
            </div>
            <div className="ws-tabs" role="tablist" aria-label="Modul Business Development">
              <button type="button" className="ws-tab" role="tab" id="ws-tab-opportunities" aria-controls="dash-panel-opportunities" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="opportunities">
                <iconify-icon noobserver icon="lucide:target" aria-hidden="true"></iconify-icon>
                <span>Business Opportunities</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-market" aria-controls="dash-panel-market" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="market">
                <iconify-icon noobserver icon="lucide:radar" aria-hidden="true"></iconify-icon>
                <span>Market Intelligence</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-targets" aria-controls="dash-panel-targets" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="targets">
                <iconify-icon noobserver icon="lucide:building-2" aria-hidden="true"></iconify-icon>
                <span>Target Accounts</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-mapping" aria-controls="dash-panel-mapping" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="mapping">
                <iconify-icon noobserver icon="lucide:map" aria-hidden="true"></iconify-icon>
                <span>Prospect Mapping</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-partnership" aria-controls="dash-panel-partnership" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="partnership">
                <iconify-icon noobserver icon="lucide:handshake" aria-hidden="true"></iconify-icon>
                <span>Partnership</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-tender" aria-controls="dash-panel-tender" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="tender">
                <iconify-icon noobserver icon="lucide:gavel" aria-hidden="true"></iconify-icon>
                <span>Tender & Bidding</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-pipeline" aria-controls="dash-panel-pipeline" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="pipeline">
                <iconify-icon noobserver icon="lucide:git-branch" aria-hidden="true"></iconify-icon>
                <span>Opportunity Pipeline</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-competitors" aria-controls="dash-panel-competitors" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="competitors">
                <iconify-icon noobserver icon="lucide:swords" aria-hidden="true"></iconify-icon>
                <span>Competitor Analysis</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-proposal" aria-controls="dash-panel-proposal" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="proposal">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <span>Business Proposal</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-reports" aria-controls="dash-panel-reports" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="reports">
                <iconify-icon noobserver icon="lucide:bar-chart-3" aria-hidden="true"></iconify-icon>
                <span>BD Reports</span>
              </button>
            </div>
            <div className="dash-panels">
              <div className="dash-panel" id="dash-panel-opportunities" role="tabpanel" aria-labelledby="ws-tab-opportunities" data-panel="opportunities" data-title="Business Opportunities" data-title-en="Business Opportunities">
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-market" role="tabpanel" aria-labelledby="ws-tab-market" data-panel="market" data-title="Market Intelligence" data-title-en="Market Intelligence" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-targets" role="tabpanel" aria-labelledby="ws-tab-targets" data-panel="targets" data-title="Target Accounts" data-title-en="Target Accounts" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-mapping" role="tabpanel" aria-labelledby="ws-tab-mapping" data-panel="mapping" data-title="Prospect Mapping" data-title-en="Prospect Mapping" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-partnership" role="tabpanel" aria-labelledby="ws-tab-partnership" data-panel="partnership" data-title="Partnership" data-title-en="Partnership" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-tender" role="tabpanel" aria-labelledby="ws-tab-tender" data-panel="tender" data-title="Tender & Bidding" data-title-en="Tender & Bidding" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-pipeline" role="tabpanel" aria-labelledby="ws-tab-pipeline" data-panel="pipeline" data-title="Opportunity Pipeline" data-title-en="Opportunity Pipeline" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-competitors" role="tabpanel" aria-labelledby="ws-tab-competitors" data-panel="competitors" data-title="Competitor Analysis" data-title-en="Competitor Analysis" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-proposal" role="tabpanel" aria-labelledby="ws-tab-proposal" data-panel="proposal" data-title="Business Proposal" data-title-en="Business Proposal" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-reports" role="tabpanel" aria-labelledby="ws-tab-reports" data-panel="reports" data-title="Business Development Reports" data-title-en="Business Development Reports" hidden>
                <div className="dash-panel__body"></div>
              </div>
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
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="bd.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Selesai">
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
