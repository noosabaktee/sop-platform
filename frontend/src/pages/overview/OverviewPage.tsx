import React from "react";

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
        <div className="sidebar-region" data-node-id="nuvio.sidebar">
          <aside className="c-kravio-sidebar" data-component="kravio-sidebar" data-node-id="nuvio.sidebar.navigation" aria-label="Primary navigation">
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
                    {/* agent:nuvio.sidebar-content */}

        </div>
        <div className="main-column">
          <div className="topbar-region" data-node-id="nuvio.topbar">
            <header className="c-nuvio-topbar" data-component="nuvio-topbar" data-node-id="nuvio.topbar.navigation">
              <button type="button" aria-label="Toggle sidebar" data-action="kravio:sidebar">
                <iconify-icon noobserver icon="lucide:layout-grid" aria-hidden="true"></iconify-icon>
              </button>
              <nav aria-label="Breadcrumb">
                <a href="#/overview" data-part="crumb-home">My Workspace</a>
                <span aria-hidden="true">/</span>
                <strong data-part="crumb-page">Ringkasan hari ini</strong>
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
                        {/* agent:nuvio.topbar-content */}

          </div>
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
          <main className="analytics-region" data-node-id="nuvio.analytics">
            <div className="metrics-region" data-node-id="nuvio.metrics">
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.tickets" data-tone="success" data-metric="tickets" aria-label="Pipeline aktif">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Pipeline aktif</h2>
                  <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">42</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">+6</span>
                      <span>vs last week</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.resolution" data-tone="success" data-metric="resolution" aria-label="Menunggu approval">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Menunggu approval</h2>
                  <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">7</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">2 SLA</span>
                      <span>vs last week</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
              <section className="c-kravio-metric" data-component="kravio-metric" data-node-id="nuvio.metrics.compliance" data-tone="danger" data-metric="compliance" aria-label="Deadline minggu ini">
                <div className="c-kravio-metric__heading">
                  <h2 data-part="title">Deadline minggu ini</h2>
                  <iconify-icon noobserver icon="lucide:calendar-clock" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-metric__body">
                  <div>
                    <p className="c-kravio-metric__value" data-part="value">8</p>
                    <div className="c-kravio-metric__comparison">
                      <span className="c-kravio-metric__delta" data-part="delta">2 risiko</span>
                      <span>vs last week</span>
                    </div>
                  </div>
                  <svg className="c-kravio-metric__spark" viewBox="0 0 90 40" preserveAspectRatio="none" aria-hidden="true">
                    <polygon className="c-kravio-metric__area" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30 90,40 0,40" />
                    <polyline className="c-kravio-metric__line" points="0,39 10,13 20,15 30,25 40,5 50,24 60,19 70,34 80,20 90,30" />
                    <circle className="c-kravio-metric__dot" cx="90" cy="30" r="2.5" />
                  </svg>
                </div>
              </section>
                            {/* agent:nuvio.metrics-content */}

            </div>
            <div className="chart-region" data-node-id="nuvio.chart">
              <section className="c-kravio-chart" data-component="kravio-chart" data-node-id="nuvio.ticket-volume" aria-label="Tren pipeline dan penjualan">
                <div className="c-kravio-chart__heading">
                  <iconify-icon noobserver icon="lucide:trending-up" aria-hidden="true"></iconify-icon>
                  <h2>Tren pipeline & penjualan</h2>
                  <label className="c-kravio-range" data-component="kravio-range" data-node-id="kravio.trend-range" data-target="trend">
                    <iconify-icon noobserver icon="lucide:calendar-days" aria-hidden="true"></iconify-icon>
                    <select data-action="kravio-range:change" data-part="select" aria-label="trend time range">
                      <option>Last week</option>
                      <option>Last month</option>
                      <option>Last quarter</option>
                    </select>
                    <iconify-icon noobserver icon="lucide:chevron-down" aria-hidden="true"></iconify-icon>
                  </label>
                </div>
                <div className="c-kravio-chart__body" data-part="body">
                  <div className="c-kravio-chart__summary">
                    <strong className="c-kravio-chart__total" data-part="total">4,790</strong>
                    <span className="c-kravio-chart__comparison">
                      <strong>+8%</strong>
                      vs last week
                    </span>
                  </div>
                  <div className="c-kravio-chart__plot" data-part="plot">
                    <div className="c-kravio-chart__bars" role="group" aria-label="Volume pipeline per hari. Gunakan tombol panah untuk memeriksa bar.">
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "31.77777777777778%" }} data-value="286" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 286 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Sun" data-action="kravio-chart:inspect" aria-label="Sun: 584 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Mon" data-action="kravio-chart:inspect" aria-label="Mon: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "44.333333333333336%" }} data-value="399" data-day="Mon" data-action="kravio-chart:inspect" aria-label="Mon: 399 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "59.77777777777777%" }} data-value="538" data-day="Tue" data-action="kravio-chart:inspect" aria-label="Tue: 538 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Tue" data-action="kravio-chart:inspect" aria-label="Tue: 584 tickets" aria-pressed="true"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "51.33333333333333%" }} data-value="462" data-day="Wed" data-action="kravio-chart:inspect" aria-label="Wed: 462 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "64.88888888888889%" }} data-value="584" data-day="Wed" data-action="kravio-chart:inspect" aria-label="Wed: 584 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "85%" }} data-value="765" data-day="Thu" data-action="kravio-chart:inspect" aria-label="Thu: 765 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Thu" data-action="kravio-chart:inspect" aria-label="Thu: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "69.55555555555556%" }} data-value="626" data-day="Fri" data-action="kravio-chart:inspect" aria-label="Fri: 626 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "75.1111111111111%" }} data-value="676" data-day="Fri" data-action="kravio-chart:inspect" aria-label="Fri: 676 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "39.22222222222223%" }} data-value="353" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 353 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "79.33333333333333%" }} data-value="714" data-day="Sat" data-action="kravio-chart:inspect" aria-label="Sat: 714 tickets" aria-pressed="false"></button>
                      <button type="button" className="c-kravio-chart__bar" style={{ ["--bar-height" as any]: "58.333333333333336%" }} data-value="525" data-day="Sun" data-action="kravio-chart:inspect" aria-label="Sun: 525 tickets" aria-pressed="false"></button>
                    </div>
                    <div className="c-kravio-chart__marker" data-part="marker">
                      <span className="c-kravio-chart__tooltip" data-part="tooltip">Tue: 584</span>
                    </div>
                    <div className="c-kravio-chart__axis" aria-hidden="true">
                      <span>800</span>
                      <span>600</span>
                      <span>400</span>
                      <span>200</span>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="c-kravio-chart__days" aria-hidden="true">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                </div>
              </section>
                            {/* agent:nuvio.chart-content */}

            </div>
            <div className="updates-region" data-node-id="nuvio.updates">
              <section className="c-kravio-updates" data-component="kravio-updates" data-node-id="nuvio.latest-updates" aria-label="Aktivitas terbaru" data-period="today">
                <div className="c-kravio-updates__heading">
                  <h2>Aktivitas terbaru</h2>
                  <iconify-icon noobserver icon="lucide:newspaper" aria-hidden="true"></iconify-icon>
                </div>
                <div className="c-kravio-updates__body">
                  <div className="c-kravio-updates__tabs" role="group" aria-label="Rentang aktivitas">
                    <button type="button" data-action="kravio-updates:period" data-period="today" aria-pressed="true">Hari ini</button>
                    <button type="button" data-action="kravio-updates:period" data-period="yesterday" aria-pressed="false">Kemarin</button>
                    <button type="button" data-action="kravio-updates:period" data-period="week" aria-pressed="false">Minggu ini</button>
                  </div>
                  <label className="c-kravio-search" data-component="kravio-search" data-node-id="kravio.activity-search">
                    <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                    <input type="search" placeholder="Cari aktivitas" aria-label="Cari aktivitas" data-action="kravio-updates:search" data-part="input" />
                  </label>
                  <p className="c-kravio-updates__count" data-part="count" aria-live="polite">
                    <strong>8</strong>
                    {' '}aktivitas baru hari ini
                  </p>
                  <div className="c-kravio-updates__list" data-part="list">
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.quotation" data-tone="info">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Quotation diajukan</h3>
                            <time data-part="time">11:20</time>
                          </div>
                          <p data-part="description">Q-2026-014 PT Nusantara menunggu approval</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.opportunity" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:target" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Opportunity baru</h3>
                            <time data-part="time">11:15</time>
                          </div>
                          <p data-part="description">OP-108 dari lead campaign Q4</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.approval" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Approval disetujui</h3>
                            <time data-part="time">11:00</time>
                          </div>
                          <p data-part="description">Sales Order SO-2026-021 disetujui</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.risk" data-tone="danger">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Project at risk</h3>
                            <time data-part="time">10:45</time>
                          </div>
                          <p data-part="description">PRJ-042 variance biaya 8%</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.purchase" data-tone="warning">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:clipboard-list" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Purchase Request</h3>
                            <time data-part="time">10:30</time>
                          </div>
                          <p data-part="description">PR-331 menunggu budget check</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.invoice" data-tone="cyan">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:receipt" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Invoice diposting</h3>
                            <time data-part="time">10:10</time>
                          </div>
                          <p data-part="description">INV-088 AR · three-way match</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.payment" data-tone="success">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:circle-check" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Payment diterima</h3>
                            <time data-part="time">09:50</time>
                          </div>
                          <p data-part="description">Rekonsiliasi bank Rp 320 jt</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="today">
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.today.rups" data-tone="violet">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:gavel" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">RUPS dijadwalkan</h3>
                            <time data-part="time">09:05</time>
                          </div>
                          <p data-part="description">Agenda &amp; undangan terkirim</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.quotation" data-tone="info">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Quotation dikirim</h3>
                            <time data-part="time">17:40</time>
                          </div>
                          <p data-part="description">Q-2026-013 terkirim ke customer</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.received" data-tone="warning">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:package" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Goods Receipt</h3>
                            <time data-part="time">15:12</time>
                          </div>
                          <p data-part="description">GR-044 partial receipt vendor</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.delegation" data-tone="violet">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:repeat-2" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Delegasi approval</h3>
                            <time data-part="time">13:26</time>
                          </div>
                          <p data-part="description">Approver delegasi sampai 7 Okt</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.audit" data-tone="cyan">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Audit event</h3>
                            <time data-part="time">11:05</time>
                          </div>
                          <p data-part="description">Perubahan vendor master tercatat</p>
                        </div>
                      </article>
                    </div>
                    <div data-period="yesterday" hidden>
                      <article className="c-kravio-activity" data-component="kravio-activity" data-node-id="sop.activity.yesterday.stock" data-tone="danger">
                        <span className="c-kravio-activity__icon">
                          <iconify-icon noobserver icon="lucide:boxes" aria-hidden="true"></iconify-icon>
                        </span>
                        <div className="c-kravio-activity__text">
                          <div className="c-kravio-activity__heading">
                            <h3 data-part="title">Stock opname</h3>
                            <time data-part="time">09:30</time>
                          </div>
                          <p data-part="description">Gudang utama · 12 variance</p>
                        </div>
                      </article>
                    </div>
                    <p className="c-kravio-updates__empty" data-part="empty" hidden>Tidak ada aktivitas yang cocok.</p>
                  </div>
                </div>
              </section>
                            {/* agent:nuvio.updates-content */}

            </div>
                        {/* agent:nuvio.analytics-sections */}

                        {/* agent:nuvio.analytics-content */}

          </main>
          <div className="table-region" data-node-id="nuvio.tickets">
            <section className="c-kravio-table" data-component="kravio-table" data-node-id="nuvio.sla-monitoring" aria-label="Daftar pekerjaan dan transaksi">
              <div className="c-kravio-table__header">
                <iconify-icon noobserver icon="lucide:table-2" aria-hidden="true"></iconify-icon>
                <h2>Daftar pekerjaan & transaksi</h2>
                <div className="c-kravio-table__tools">
                  <div className="c-kravio-table__search">
                    <label className="c-kravio-search" data-component="kravio-search" data-node-id="kravio.record-search">
                      <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
                      <input type="search" placeholder="Cari record" aria-label="Cari record" data-action="kravio-table:search" data-part="input" />
                    </label>
                  </div>
                  <details className="c-kravio-table__filter">
                    <summary>
                      <iconify-icon noobserver icon="lucide:filter" aria-hidden="true"></iconify-icon>
                      <span>Filter</span>
                    </summary>
                    <div className="c-kravio-table__filter-panel">
                      <fieldset>
                        <legend>Prioritas</legend>
                        <label>
                          <input type="checkbox" data-filter="priority" value="High" />
                          High
                        </label>
                        <label>
                          <input type="checkbox" data-filter="priority" value="Medium" />
                          Medium
                        </label>
                        <label>
                          <input type="checkbox" data-filter="priority" value="Low" />
                          Low
                        </label>
                      </fieldset>
                      <fieldset>
                        <legend>Status</legend>
                        <label>
                          <input type="checkbox" data-filter="status" value="Draft" />
                          Draft
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="Pending Approval" />
                          Pending Approval
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="At Risk" />
                          At Risk
                        </label>
                        <label>
                          <input type="checkbox" data-filter="status" value="Approved" />
                          Approved
                        </label>
                      </fieldset>
                      <button type="button" data-action="kravio-table:reset">Hapus filter</button>
                    </div>
                  </details>
                  <button type="button" className="c-kravio-button" data-component="kravio-button" data-node-id="kravio.table-export" data-tone="icon" data-action="kravio-table:export" aria-label="Export record">
                    <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                    <span data-part="label">Export record</span>
                  </button>
                </div>
              </div>
              <div className="c-kravio-table__feedback" data-part="feedback" hidden>
                <span data-part="result-count" aria-live="polite"></span>
                <button type="button" data-action="kravio-table:reset">Hapus filter</button>
              </div>
              <div className="c-kravio-table__surface" tabIndex={0} aria-label="Tabel record yang dapat digulir">
                <table>
                  <thead>
                    <tr>
                      <th scope="col" aria-sort="none">
                        <input type="checkbox" data-action="kravio-table:all" aria-label="Pilih semua record" />
                        <button type="button" data-action="kravio-table:sort" data-column="0">
                          Record
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="1">
                          Deskripsi
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="2">
                          Prioritas
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="3">
                          Owner
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="4">
                          Status
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="5">
                          Modul
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-sort="none">
                        <button type="button" data-action="kravio-table:sort" data-column="6">
                          Deadline
                          <iconify-icon noobserver icon="lucide:arrow-down-up" aria-hidden="true"></iconify-icon>
                        </button>
                      </th>
                      <th scope="col" aria-label="Aksi"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-record="Q-2026-014" data-priority="High" data-status="Pending Approval" data-node-id="sop.record.q2026014">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record Q-2026-014" defaultChecked />
                          Q-2026-014
                        </label>
                      </td>
                      <td>Quotation PT Nusantara · discount 12%</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.q2026014.priority" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">High</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.q2026014.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">RW</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Rina Wijaya</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.q2026014.status" data-tone="info">
                          <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Pending Approval</span>
                        </span>
                      </td>
                      <td>Quotation</td>
                      <td>Hari ini 14:00</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk Q-2026-014" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="OP-108" data-priority="Medium" data-status="Approved" data-node-id="sop.record.op108">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record OP-108" />
                          OP-108
                        </label>
                      </td>
                      <td>Opportunity follow-up customer</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.op108.priority" data-tone="warning">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Medium</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.op108.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">AP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Aditya Pratama</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.op108.status" data-tone="success">
                          <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Approved</span>
                        </span>
                      </td>
                      <td>CRM & Sales</td>
                      <td>Hari ini 16:30</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk OP-108" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="PRJ-042" data-priority="High" data-status="At Risk" data-node-id="sop.record.prj042">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record PRJ-042" />
                          PRJ-042
                        </label>
                      </td>
                      <td>Project risk review & cost variance</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.prj042.priority" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">High</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.prj042.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">BS</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Bagus Santoso</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.prj042.status" data-tone="danger">
                          <iconify-icon noobserver icon="lucide:triangle-alert" aria-hidden="true"></iconify-icon>
                          <span data-part="label">At Risk</span>
                        </span>
                      </td>
                      <td>Project</td>
                      <td>Besok</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk PRJ-042" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="PR-331" data-priority="Medium" data-status="Draft" data-node-id="sop.record.pr331">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record PR-331" />
                          PR-331
                        </label>
                      </td>
                      <td>Purchase request budget check</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.pr331.priority" data-tone="warning">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Medium</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.pr331.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">SP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Sari Putri</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.pr331.status" data-tone="yellow">
                          <iconify-icon noobserver icon="lucide:pencil" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Draft</span>
                        </span>
                      </td>
                      <td>Purchase</td>
                      <td>7 Okt 2026</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk PR-331" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                    <tr data-record="INV-088" data-priority="Low" data-status="Approved" data-node-id="sop.record.inv088">
                      <td>
                        <label className="c-kravio-table__ticket">
                          <input type="checkbox" data-action="kravio-table:select" aria-label="Pilih record INV-088" />
                          INV-088
                        </label>
                      </td>
                      <td>Invoice AR · three-way match ready</td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.inv088.priority" data-tone="yellow">
                          <iconify-icon noobserver icon="lucide:chart-no-axes-column-increasing" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Low</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-avatar" data-component="kravio-avatar" data-node-id="sop.record.inv088.owner">
                          <span className="c-kravio-avatar__image">
                            <span aria-hidden="true">SP</span>
                            <img src="" alt="" loading="lazy" />
                          </span>
                          <span data-part="name">Sari Putri</span>
                        </span>
                      </td>
                      <td>
                        <span className="c-kravio-status" data-component="kravio-status" data-node-id="sop.record.inv088.status" data-tone="success">
                          <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                          <span data-part="label">Approved</span>
                        </span>
                      </td>
                      <td>Finance</td>
                      <td>8 Okt 2026</td>
                      <td>
                        <button type="button" className="c-kravio-table__more" aria-label="Aksi untuk INV-088" data-action="kravio-table:detail">
                          <iconify-icon noobserver icon="lucide:ellipsis-vertical" aria-hidden="true"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="c-kravio-table__empty" data-part="empty" hidden>Tidak ada record yang cocok.</p>
              </div>
              <footer className="c-kravio-table__pager" data-part="pager">
                <span className="c-kravio-table__pager-info" data-part="page-info" aria-live="polite"></span>
                <div className="c-kravio-table__pager-controls">
                  <label>
                    Baris per halaman{' '}
                    <select data-action="kravio-table:size" aria-label="Baris per halaman">
                      <option value="3">3</option>
                      <option value="5" selected>5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                    </select>
                  </label>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:first" aria-label="Halaman pertama">
                    <iconify-icon noobserver icon="lucide:chevrons-left" aria-hidden="true"></iconify-icon>
                  </button>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:prev" aria-label="Halaman sebelumnya">
                    <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                  </button>
                  <span className="c-kravio-table__page-numbers" data-part="page-numbers"></span>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:next" aria-label="Halaman berikutnya">
                    <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                  </button>
                  <button type="button" className="c-kravio-table__page-btn" data-action="kravio-table:last" aria-label="Halaman terakhir">
                    <iconify-icon noobserver icon="lucide:chevrons-right" aria-hidden="true"></iconify-icon>
                  </button>
                </div>
              </footer>
            </section>
                        {/* agent:nuvio.tickets-content */}

          </div>
          <section className="data-grid-region" data-node-id="sop.handsontable-grid">
            <div className="data-grid-header">
              <div>
                <h2>Fokus pekerjaan hari ini</h2>
                <span>Handsontable · 6 record · terakhir diperbarui 09:42</span>
              </div>
              <span className="status-chip progress">Grid siap diedit</span>
            </div>
            <table className="focus-grid">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" data-action="focus:all" aria-label="Pilih semua record" />
                  </th>
                  <th>Record</th>
                  <th>Modul</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Quotation Q-2026-014" />
                  </td>
                  <td>Quotation Q-2026-014</td>
                  <td>Quotation</td>
                  <td>Aditya Pratama</td>
                  <td>
                    <span className="status-chip pending">Pending approval</span>
                  </td>
                  <td>Hari ini, 14:00</td>
                  <td>Review margin</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Opportunity OP-108" />
                  </td>
                  <td>Opportunity OP-108</td>
                  <td>CRM & Sales</td>
                  <td>Rina Wijaya</td>
                  <td>
                    <span className="status-chip progress">Follow-up</span>
                  </td>
                  <td>Hari ini, 16:30</td>
                  <td>Hubungi customer</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Project PRJ-042" />
                  </td>
                  <td>Project PRJ-042</td>
                  <td>Project</td>
                  <td>Bagus Santoso</td>
                  <td>
                    <span className="status-chip risk">Risk flagged</span>
                  </td>
                  <td>Besok</td>
                  <td>Review mitigation</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Purchase Request PR-331" />
                  </td>
                  <td>Purchase Request PR-331</td>
                  <td>Procurement</td>
                  <td>Aditya Pratama</td>
                  <td>
                    <span className="status-chip pending">Menunggu approval</span>
                  </td>
                  <td>7 Okt 2026</td>
                  <td>Submit approval</td>
                </tr>
                <tr>
                  <td>
                    <input type="checkbox" aria-label="Pilih Invoice INV-088" />
                  </td>
                  <td>Invoice INV-088</td>
                  <td>Finance</td>
                  <td>Sari Putri</td>
                  <td>
                    <span className="status-chip done">Terverifikasi</span>
                  </td>
                  <td>8 Okt 2026</td>
                  <td>Rekonsiliasi payment</td>
                </tr>
              </tbody>
            </table>
            <footer className="focus-pager" data-part="focus-pager">
              <span data-part="focus-info" aria-live="polite"></span>
              <div className="focus-pager__controls">
                <label>
                  Baris{' '}
                  <select data-action="focus:size" aria-label="Baris per halaman focus grid">
                    <option value="3">3</option>
                    <option value="5" selected>5</option>
                    <option value="10">10</option>
                  </select>
                </label>
                <button type="button" className="focus-page" data-action="focus:prev" aria-label="Halaman sebelumnya">
                  <iconify-icon noobserver icon="lucide:chevron-left" aria-hidden="true"></iconify-icon>
                </button>
                <span data-part="focus-pages"></span>
                <button type="button" className="focus-page" data-action="focus:next" aria-label="Halaman berikutnya">
                  <iconify-icon noobserver icon="lucide:chevron-right" aria-hidden="true"></iconify-icon>
                </button>
              </div>
            </footer>
          </section>
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
