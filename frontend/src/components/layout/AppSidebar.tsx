import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../app/AuthContext";

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
      { title: "Docs", icon: "lucide:book-open", route: "/docs" },
    ],
  },
];

// In-memory fallback scroll cache for seamless sidebar position preservation
let lastKnownSidebarScroll = 0;

export const setStoredSidebarScroll = (scrollTop: number) => {
  lastKnownSidebarScroll = scrollTop;
  try {
    sessionStorage.setItem("sop_sidebar_nav_scroll", String(scrollTop));
  } catch {}
};

export const getStoredSidebarScroll = (): number => {
  try {
    const saved = sessionStorage.getItem("sop_sidebar_nav_scroll");
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {}
  return lastKnownSidebarScroll;
};

export interface AppSidebarProps {
  currentRoute?: string;
  userName?: string;
  userEmail?: string;
  nodePrefix?: string;
  nodeId?: string;
  regionNodeId?: string;
}

export function AppSidebar({
  currentRoute,
  userName,
  userEmail,
  nodePrefix,
  nodeId,
  regionNodeId,
}: AppSidebarProps) {
  const { user } = useAuth();
  const displayName = userName || user?.name || "Aditya Pratama";
  const displayEmail = userEmail || user?.email || "aditya.pratama@example.com";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarRegionId = regionNodeId || (nodePrefix ? `${nodePrefix}.sidebar` : undefined);
  const sidebarNavId = nodeId || (nodePrefix ? `${nodePrefix}.sidebar.navigation` : "kravio.sidebar.navigation");

  const navRef = useRef<HTMLElement>(null);
  const [activeRoute, setActiveRoute] = useState<string>(() => {
    if (currentRoute) return currentRoute;
    if (typeof window !== "undefined") {
      return window.location.hash.slice(1) || "/my-workspace";
    }
    return "/my-workspace";
  });

  useEffect(() => {
    if (currentRoute) {
      setActiveRoute(currentRoute);
      return;
    }
    const syncRoute = () => {
      setActiveRoute(window.location.hash.slice(1) || "/my-workspace");
    };
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, [currentRoute]);

  // Keep sidebar scroll position stable and ensure active menu item is comfortably visible
  const restoreAndFocusNav = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Only operate if this sidebar is currently visible (not inside a hidden page)
    if (nav.offsetParent === null && nav.getClientRects().length === 0) {
      return;
    }

    // 1. Restore the last known scroll position so the user stays in the same sidebar viewport
    const savedScroll = getStoredSidebarScroll();
    if (savedScroll > 0) {
      nav.scrollTop = savedScroll;
    }

    // 2. Locate active button matching the current route
    const activeBtn =
      nav.querySelector<HTMLElement>(`button[data-route="${activeRoute}"]`) ||
      nav.querySelector<HTMLElement>('button[aria-current="page"]');

    if (activeBtn) {
      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      // If active menu item is clipped above or below visible nav area, adjust nav.scrollTop directly
      if (btnRect.top < navRect.top) {
        nav.scrollTop -= (navRect.top - btnRect.top + 12);
        setStoredSidebarScroll(nav.scrollTop);
      } else if (btnRect.bottom > navRect.bottom) {
        nav.scrollTop += (btnRect.bottom - navRect.bottom + 12);
        setStoredSidebarScroll(nav.scrollTop);
      }
    }
  }, [activeRoute]);

  useEffect(() => {
    const rafId = requestAnimationFrame(restoreAndFocusNav);
    const timeoutId = setTimeout(restoreAndFocusNav, 50);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [restoreAndFocusNav, activeRoute]);

  return (
    <div className="sidebar-region" data-node-id={sidebarRegionId}>
      <aside
        className="c-kravio-sidebar"
        data-component="kravio-sidebar"
        data-node-id={sidebarNavId}
        aria-label="Primary navigation"
      >
        <div className="c-kravio-sidebar__brand" data-part="brand">
          <button
            type="button"
            className="c-kravio-sidebar__home"
            data-action="kravio-sidebar:navigate"
            data-route="/overview"
            title="Overview"
            aria-label="Buka Overview"
            onClick={() => setStoredSidebarScroll(0)}
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
            <iconify-icon noobserver icon="lucide:panel-left" aria-hidden="true"></iconify-icon>
          </button>
        </div>

        <div className="c-kravio-sidebar__search">
          <label
            className="c-kravio-search"
            data-component="kravio-search"
            data-node-id="kravio.navigation-search"
          >
            <iconify-icon noobserver icon="lucide:search" aria-hidden="true"></iconify-icon>
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

        <nav
          ref={navRef}
          data-part="navigation"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.clientHeight > 0) {
              setStoredSidebarScroll(target.scrollTop);
            }
          }}
          onClick={(e) => {
            const btn = (e.target as HTMLElement).closest(
              'button[data-action="kravio-sidebar:navigate"]'
            );
            if (btn && navRef.current) {
              setStoredSidebarScroll(navRef.current.scrollTop);
            }
          }}
        >
          {SIDEBAR_NAV_SECTIONS.map((section) => (
            <React.Fragment key={section.caption}>
              <p className="c-kravio-sidebar__caption">{section.caption}</p>
              {section.items.map((it) => (
                <button
                  key={it.route}
                  type="button"
                  data-action="kravio-sidebar:navigate"
                  data-route={it.route}
                  title={it.title}
                  aria-current={activeRoute === it.route ? "page" : undefined}
                >
                  <iconify-icon noobserver icon={it.icon} aria-hidden="true"></iconify-icon>
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
          <span className="c-kravio-sidebar__avatar">{initials}</span>
          <span>
            <strong>{displayName}</strong>
            <small>{displayEmail}</small>
          </span>
          <iconify-icon
            noobserver
            icon="lucide:chevrons-up-down"
            aria-hidden="true"
          ></iconify-icon>
        </button>
      </aside>
    </div>
  );
}
