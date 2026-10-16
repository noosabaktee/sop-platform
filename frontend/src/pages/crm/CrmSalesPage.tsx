import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function CrmSalesPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="crm-sales"
      data-route="/crm-sales"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="crm.dashboard" data-sidebar="default" data-page-title="CRM & Sales" data-page-title-en="CRM & Sales" data-export-name="crm-sales">
        <div className="sidebar-region" data-node-id="crm.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="crm.sidebar.navigation" aria-label="Primary navigation">
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
          <div className="topbar-region" data-node-id="crm.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="crm.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">CRM & Sales</strong>
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
            <h1 className="sr-only">CRM & Sales</h1>
            <header className="page-head">
              <div>
                <h2 data-en="CRM & Sales">CRM & Sales</h2>
                <p data-en="Leads, customers, activities, pipeline, and forecast in one place.">Lead, customer, aktivitas, pipeline, dan forecast dalam satu tempat.</p>
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
            <div className="dash-filter" role="group" aria-label="Filter CRM & Sales">
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
                <span data-en="Source">Source</span>
                <select data-action="dash:filter" data-filter="source" aria-label="Source">
                  <option>Semua sumber</option>
                  <option>Web</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>Event</option>
                  <option>Referral</option>
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
            <div className="ws-tabs" role="tablist" aria-label="Modul CRM & Sales">
              <button type="button" className="ws-tab" role="tab" id="ws-tab-leads" aria-controls="dash-panel-leads" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="leads">
                <iconify-icon noobserver icon="lucide:user-plus" aria-hidden="true"></iconify-icon>
                <span>Leads</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-prospects" aria-controls="dash-panel-prospects" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="prospects">
                <iconify-icon noobserver icon="lucide:target" aria-hidden="true"></iconify-icon>
                <span>Prospects</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-customers" aria-controls="dash-panel-customers" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="customers">
                <iconify-icon noobserver icon="lucide:building-2" aria-hidden="true"></iconify-icon>
                <span>Customers & Contacts</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-activities" aria-controls="dash-panel-activities" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="activities">
                <iconify-icon noobserver icon="lucide:phone" aria-hidden="true"></iconify-icon>
                <span>Activities & Follow Up</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-pipeline" aria-controls="dash-panel-pipeline" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="pipeline">
                <iconify-icon noobserver icon="lucide:git-branch" aria-hidden="true"></iconify-icon>
                <span>Sales Pipeline</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-forecast" aria-controls="dash-panel-forecast" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="forecast">
                <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                <span>Sales Forecast</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-history" aria-controls="dash-panel-history" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="history">
                <iconify-icon noobserver icon="lucide:history" aria-hidden="true"></iconify-icon>
                <span>Customer History</span>
              </button>
            </div>
            <div className="dash-panels">
              <div className="dash-panel" id="dash-panel-leads" role="tabpanel" aria-labelledby="ws-tab-leads" data-panel="leads" data-title="Leads" data-title-en="Leads">
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-prospects" role="tabpanel" aria-labelledby="ws-tab-prospects" data-panel="prospects" data-title="Prospects" data-title-en="Prospects" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-customers" role="tabpanel" aria-labelledby="ws-tab-customers" data-panel="customers" data-title="Customers & Contacts" data-title-en="Customers & Contacts" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-activities" role="tabpanel" aria-labelledby="ws-tab-activities" data-panel="activities" data-title="Activities & Follow Up" data-title-en="Activities & Follow Up" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-pipeline" role="tabpanel" aria-labelledby="ws-tab-pipeline" data-panel="pipeline" data-title="Sales Pipeline" data-title-en="Sales Pipeline" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-forecast" role="tabpanel" aria-labelledby="ws-tab-forecast" data-panel="forecast" data-title="Sales Forecast" data-title-en="Sales Forecast" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-history" role="tabpanel" aria-labelledby="ws-tab-history" data-panel="history" data-title="Customer History" data-title-en="Customer History" hidden>
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
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="crm.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Selesai">
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
