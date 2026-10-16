import React from "react";

export interface NavItem {
  title: string;
  icon: string;
  route: string;
}

export interface NavSection {
  caption: string;
  items: NavItem[];
}

export const SIDEBAR_NAV_SECTIONS: NavSection[] = [
  {
    caption: "My Workspace",
    items: [
      { title: "My Workspace", icon: "lucide:home", route: "/my-workspace" },
    ],
  },
  {
    caption: "Dashboard",
    items: [
      { title: "Dashboard", icon: "lucide:layout-dashboard", route: "/dashboard" },
    ],
  },
  {
    caption: "Commercial",
    items: [
      { title: "CRM & Sales", icon: "lucide:briefcase", route: "/crm-sales" },
      { title: "Business Development", icon: "lucide:trending-up", route: "/business-development" },
      { title: "Quotation", icon: "lucide:file-text", route: "/quotation" },
      { title: "Sales", icon: "lucide:shopping-cart", route: "/sales" },
    ],
  },
  {
    caption: "Delivery & Operations",
    items: [
      { title: "Project", icon: "lucide:folder-kanban", route: "/projects" },
      { title: "Purchase", icon: "lucide:clipboard-list", route: "/purchase" },
      { title: "Inventory", icon: "lucide:warehouse", route: "/inventory" },
    ],
  },
  {
    caption: "Finance & Insights",
    items: [
      { title: "Finance & Accounting", icon: "lucide:wallet-cards", route: "/finance" },
      { title: "Reports & Analytics", icon: "lucide:bar-chart-3", route: "/reports" },
      { title: "Management & Executive", icon: "lucide:chart-no-axes-column-increasing", route: "/management" },
    ],
  },
  {
    caption: "Data & Documents",
    items: [
      { title: "Master Data", icon: "lucide:database", route: "/master-data" },
      { title: "Document Management", icon: "lucide:files", route: "/document-management" },
      { title: "Document Template", icon: "lucide:layout-template", route: "/document-template" },
      { title: "Email & Communication", icon: "lucide:mail", route: "/email-communication" },
      { title: "Omnichannel", icon: "lucide:messages-square", route: "/omnichannel" },
      { title: "WhatsApp Integration", icon: "lucide:message-circle", route: "/whatsapp-integration" },
    ],
  },
  {
    caption: "Governance & Intelligence",
    items: [
      { title: "General Meeting & RUPS", icon: "lucide:gavel", route: "/general-meeting-rups" },
      { title: "Workflow & Approval", icon: "lucide:git-merge", route: "/workflow-approval" },
      { title: "Corporate", icon: "lucide:building-2", route: "/corporate" },
      { title: "AI Assistant", icon: "lucide:sparkles", route: "/ai-assistant" },
      { title: "Data Intelligence", icon: "lucide:brain-circuit", route: "/data-intelligence" },
    ],
  },
  {
    caption: "Administration",
    items: [
      { title: "Integrations", icon: "lucide:plug", route: "/integrations" },
      { title: "Security & Audit", icon: "lucide:shield-check", route: "/security-audit" },
      { title: "Settings", icon: "lucide:settings-2", route: "/settings" },
    ],
  },
];

export interface AppSidebarProps {
  currentRoute?: string;
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({
  currentRoute = "/my-workspace",
  userName = "Aditya Pratama",
  userEmail = "aditya.pratama@example.com",
}: AppSidebarProps) {
  return (
    <aside
      className="c-kravio-sidebar"
      data-component="kravio-sidebar"
      aria-label="Primary navigation"
    >
      <div className="c-kravio-sidebar__brand" data-part="brand">
        <button
          type="button"
          className="c-kravio-sidebar__home"
          data-action="kravio-sidebar:navigate"
          title="Overview"
          aria-label="Buka Overview"
        >
          <span className="c-kravio-sidebar__logo" aria-hidden="true">
            SO
          </span>
          <strong>Platform</strong>
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          data-action="kravio:sidebar"
        >
          <iconify-icon noobserver icon="lucide:panel-left" aria-hidden="true" />
        </button>
      </div>

      <div className="c-kravio-sidebar__search">
        <label
          className="c-kravio-search"
          data-component="kravio-search"
          data-node-id="kravio.navigation-search"
        >
          <iconify-icon noobserver icon="lucide:search" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search anything"
            aria-label="Search anything"
            data-action="kravio-sidebar:search"
            data-part="input"
          />
        </label>
        <kbd>⌘ K</kbd>
      </div>

      <nav data-part="navigation">
        {SIDEBAR_NAV_SECTIONS.map((section) => (
          <React.Fragment key={section.caption}>
            <p className="c-kravio-sidebar__caption">{section.caption}</p>
            {section.items.map((it) => (
              <button
                key={it.route}
                type="button"
                data-action="kravio-sidebar:navigate"
                title={it.title}
                aria-current={currentRoute === it.route ? "page" : undefined}
              >
                <iconify-icon noobserver icon={it.icon} aria-hidden="true" />
                <span>{it.title}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <button
        type="button"
        className="c-kravio-sidebar__profile"
        data-action="kravio:profile"
      >
        <span className="c-kravio-sidebar__avatar">AP</span>
        <span>
          <strong>{userName}</strong>
          <small>{userEmail}</small>
        </span>
        <iconify-icon
          noobserver
          icon="lucide:chevrons-up-down"
          aria-hidden="true"
        />
      </button>
    </aside>
  );
}

