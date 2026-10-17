import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { BootStatus } from "../components/common/BootStatus";
import { useAppData } from "../hooks/useAppData";
import { useAppRouting } from "../hooks/useAppRouting";
import { useAppAuthHandlers } from "../hooks/useAppAuthHandlers";
import { useAppActionHandlers } from "../hooks/useAppActionHandlers";
import { useAppBridges } from "../hooks/useAppBridges";

import {
  OverviewPage,
  MyWorkspacePage,
  DashboardPage,
  CrmSalesPage,
  BusinessDevelopmentPage,
  QuotationPage,
  SalesPage,
  ProjectsPage,
  PurchasePage,
  InventoryPage,
  FinancePage,
  ReportsPage,
  ManagementPage,
  MasterDataPage,
  DocumentManagementPage,
  DocumentTemplatePage,
  EmailCommunicationPage,
  OmnichannelPage,
  WhatsAppIntegrationPage,
  GeneralMeetingRupsPage,
  WorkflowApprovalPage,
  CorporatePage,
  AiAssistantPage,
  DataIntelligencePage,
  IntegrationsPage,
  SecurityAuditPage,
  SettingsPage,
  DocsPage,
  LoginPage,
} from "../pages";

/**
 * Main SOP Application Root Component.
 * Composes standard React page modules, layouts, and data hydration
 * with 100% preservation of UI/UX, styling classes, and domain workflows.
 */
export function App() {
  const { user, loading: authLoading } = useAuth();
  const signedInRef = useRef<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<string>(
    () => location.hash.slice(1) || "/login",
  );

  useEffect(() => {
    const handleRoute = () => {
      setCurrentRoute(location.hash.slice(1) || "/login");
    };
    window.addEventListener("hashchange", handleRoute);
    return () => window.removeEventListener("hashchange", handleRoute);
  }, []);

  // Sync sidebar user profile across all page views from PostgreSQL authenticated user
  useEffect(() => {
    if (!user) return;
    const initials = user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "US";
    document
      .querySelectorAll<HTMLElement>(".c-kravio-sidebar__profile")
      .forEach((profile) => {
        const avatar = profile.querySelector<HTMLElement>(
          ".c-kravio-sidebar__avatar",
        );
        const strong = profile.querySelector<HTMLElement>("strong");
        const small = profile.querySelector<HTMLElement>("small");
        if (avatar) avatar.textContent = initials;
        if (strong) strong.textContent = user.name;
        if (small) small.textContent = user.email;
      });
  }, [user, currentRoute]);

  // Preserve and restore sidebar scroll position across page transitions
  useEffect(() => {
    const restoreSidebarScroll = () => {
      const visibleNav = Array.from(
        document.querySelectorAll<HTMLElement>(".c-kravio-sidebar nav"),
      ).find((nav) => nav.offsetParent !== null && nav.clientHeight > 0);

      if (!visibleNav) return;

      let savedScroll = 0;
      try {
        const saved = sessionStorage.getItem("sop_sidebar_nav_scroll");
        if (saved !== null) savedScroll = parseFloat(saved) || 0;
      } catch {}

      if (savedScroll > 0) {
        visibleNav.scrollTop = savedScroll;
      }

      const activeBtn =
        visibleNav.querySelector<HTMLElement>(`button[data-route="${currentRoute}"]`) ||
        visibleNav.querySelector<HTMLElement>('button[aria-current="page"]');

      if (activeBtn) {
        const navRect = visibleNav.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        if (btnRect.top < navRect.top) {
          visibleNav.scrollTop -= (navRect.top - btnRect.top + 12);
          try {
            sessionStorage.setItem("sop_sidebar_nav_scroll", String(visibleNav.scrollTop));
          } catch {}
        } else if (btnRect.bottom > navRect.bottom) {
          visibleNav.scrollTop += (btnRect.bottom - navRect.bottom + 12);
          try {
            sessionStorage.setItem("sop_sidebar_nav_scroll", String(visibleNav.scrollTop));
          } catch {}
        }
      }
    };

    const rafId = requestAnimationFrame(restoreSidebarScroll);
    const timeoutId = setTimeout(restoreSidebarScroll, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [currentRoute]);

  // 1. Data loading: snapshots, module states, and users (compiled components, no HTML fetch)
  const { bridge, modules, status, setStatus } = useAppData(
    user,
    authLoading,
  );

  // 2. Hash routing, session guards, and workspace/KPI route sync
  useAppRouting(user, authLoading, signedInRef);

  // 3. Form interceptors for login, 2FA verification, password reset, and logout
  useAppAuthHandlers(bridge, modules, setStatus, signedInRef);

  // 4. Action handlers for real CSV import/export, domain edit protection, and dashboard updates
  useAppActionHandlers(bridge, modules, user);

  // 5. Bridge adapter lifecycle orchestration (Quotation, Sales, Inventory, Accounting, etc.)
  useAppBridges(bridge, modules, user, setStatus);

  if (authLoading) {
    return <BootStatus message="Memuat sesi..." />;
  }

  return (
    <AppLayout status={status}>
      <OverviewPage hidden={currentRoute !== "/overview"} />
      <MyWorkspacePage hidden={currentRoute !== "/my-workspace"} />
      <DashboardPage hidden={currentRoute !== "/dashboard"} />
      <CrmSalesPage hidden={currentRoute !== "/crm-sales"} />
      <BusinessDevelopmentPage
        hidden={currentRoute !== "/business-development"}
      />
      <QuotationPage hidden={currentRoute !== "/quotation"} />
      <SalesPage hidden={currentRoute !== "/sales"} />
      <ProjectsPage hidden={currentRoute !== "/projects"} />
      <PurchasePage hidden={currentRoute !== "/purchase"} />
      <InventoryPage hidden={currentRoute !== "/inventory"} />
      <FinancePage hidden={currentRoute !== "/finance"} />
      <ReportsPage hidden={currentRoute !== "/reports"} />
      <ManagementPage hidden={currentRoute !== "/management"} />
      <MasterDataPage hidden={currentRoute !== "/master-data"} />
      <DocumentManagementPage
        hidden={currentRoute !== "/document-management"}
      />
      <DocumentTemplatePage hidden={currentRoute !== "/document-template"} />
      <EmailCommunicationPage
        hidden={currentRoute !== "/email-communication"}
      />
      <OmnichannelPage hidden={currentRoute !== "/omnichannel"} />
      <WhatsAppIntegrationPage
        hidden={currentRoute !== "/whatsapp-integration"}
      />
      <GeneralMeetingRupsPage
        hidden={currentRoute !== "/general-meeting-rups"}
      />
      <WorkflowApprovalPage hidden={currentRoute !== "/workflow-approval"} />
      <CorporatePage hidden={currentRoute !== "/corporate"} />
      <AiAssistantPage hidden={currentRoute !== "/ai-assistant"} />
      <DataIntelligencePage hidden={currentRoute !== "/data-intelligence"} />
      <IntegrationsPage hidden={currentRoute !== "/integrations"} />
      <SecurityAuditPage hidden={currentRoute !== "/security-audit"} />
      <SettingsPage hidden={currentRoute !== "/settings"} />
      <DocsPage hidden={currentRoute !== "/docs"} />
      <LoginPage hidden={currentRoute !== "/login"} />
    </AppLayout>
  );
}

