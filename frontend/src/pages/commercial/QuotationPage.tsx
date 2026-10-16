import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function QuotationPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="quotation"
      data-route="/quotation"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="quotation.dashboard" data-sidebar="default" data-page-title="Quotation" data-page-title-en="Quotation" data-export-name="quotation">
        <div className="sidebar-region" data-node-id="quotation.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="quotation.sidebar.navigation" aria-label="Primary navigation">
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
          <div className="topbar-region" data-node-id="quotation.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="quotation.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">Quotation</strong>
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
            <h1 className="sr-only">Quotation</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Quotation">Quotation</h2>
                <p data-en="Create, approve, send, and convert quotations into sales orders.">Buat, setujui, kirim, dan konversi quotation menjadi sales order.</p>
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
                <button type="button" className="btn-primary" data-action="q:new">
                  <iconify-icon noobserver icon="lucide:file-plus" aria-hidden="true"></iconify-icon>
                  <span data-en="Create quotation">Buat quotation</span>
                </button>
              </div>
            </header>
            <div className="dash-filter" role="group" aria-label="Filter Quotation">
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
                <span data-en="Status">Status</span>
                <select data-action="dash:filter" data-filter="status" aria-label="Status">
                  <option>Semua status</option>
                  <option>Draft</option>
                  <option>Pending Approval</option>
                  <option>Sent</option>
                  <option>Negotiation</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Expired</option>
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
            <div className="ws-tabs" role="tablist" aria-label="Modul Quotation">
              <button type="button" className="ws-tab" role="tab" id="ws-tab-list" aria-controls="dash-panel-list" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="list">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <span>Quotation List</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-create" aria-controls="dash-panel-create" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="create">
                <iconify-icon noobserver icon="lucide:file-plus" aria-hidden="true"></iconify-icon>
                <span>Create Quotation</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-draft" aria-controls="dash-panel-draft" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="draft">
                <iconify-icon noobserver icon="lucide:file-pen" aria-hidden="true"></iconify-icon>
                <span>Draft</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-pending" aria-controls="dash-panel-pending" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="pending">
                <iconify-icon noobserver icon="lucide:clock" aria-hidden="true"></iconify-icon>
                <span>Pending Approval</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-sent" aria-controls="dash-panel-sent" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="sent">
                <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
                <span>Sent</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-negotiation" aria-controls="dash-panel-negotiation" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="negotiation">
                <iconify-icon noobserver icon="lucide:messages-square" aria-hidden="true"></iconify-icon>
                <span>Negotiation</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-approved" aria-controls="dash-panel-approved" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="approved">
                <iconify-icon noobserver icon="lucide:badge-check" aria-hidden="true"></iconify-icon>
                <span>Approved</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-rejected" aria-controls="dash-panel-rejected" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="rejected">
                <iconify-icon noobserver icon="lucide:x-circle" aria-hidden="true"></iconify-icon>
                <span>Rejected</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-expired" aria-controls="dash-panel-expired" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="expired">
                <iconify-icon noobserver icon="lucide:calendar-x" aria-hidden="true"></iconify-icon>
                <span>Expired</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-revision" aria-controls="dash-panel-revision" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="revision">
                <iconify-icon noobserver icon="lucide:history" aria-hidden="true"></iconify-icon>
                <span>Revision History</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-templates" aria-controls="dash-panel-templates" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="templates">
                <iconify-icon noobserver icon="lucide:layout-template" aria-hidden="true"></iconify-icon>
                <span>Quotation Templates</span>
              </button>
            </div>
            <div className="dash-panels">
              <div className="dash-panel" id="dash-panel-list" role="tabpanel" aria-labelledby="ws-tab-list" data-panel="list" data-title="Quotation List" data-title-en="Quotation List">
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-create" role="tabpanel" aria-labelledby="ws-tab-create" data-panel="create" data-title="Create Quotation" data-title-en="Create Quotation" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-draft" role="tabpanel" aria-labelledby="ws-tab-draft" data-panel="draft" data-title="Draft" data-title-en="Draft" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-pending" role="tabpanel" aria-labelledby="ws-tab-pending" data-panel="pending" data-title="Pending Approval" data-title-en="Pending Approval" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-sent" role="tabpanel" aria-labelledby="ws-tab-sent" data-panel="sent" data-title="Sent" data-title-en="Sent" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-negotiation" role="tabpanel" aria-labelledby="ws-tab-negotiation" data-panel="negotiation" data-title="Negotiation" data-title-en="Negotiation" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-approved" role="tabpanel" aria-labelledby="ws-tab-approved" data-panel="approved" data-title="Approved" data-title-en="Approved" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-rejected" role="tabpanel" aria-labelledby="ws-tab-rejected" data-panel="rejected" data-title="Rejected" data-title-en="Rejected" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-expired" role="tabpanel" aria-labelledby="ws-tab-expired" data-panel="expired" data-title="Expired" data-title-en="Expired" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-revision" role="tabpanel" aria-labelledby="ws-tab-revision" data-panel="revision" data-title="Revision History" data-title-en="Revision History" hidden>
                <div className="dash-panel__body"></div>
              </div>
              <div className="dash-panel" id="dash-panel-templates" role="tabpanel" aria-labelledby="ws-tab-templates" data-panel="templates" data-title="Quotation Templates" data-title-en="Quotation Templates" hidden>
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
              <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="qt.dialog.done" data-tone="default" data-action="kravio:close" aria-label="Selesai">
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
