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
      <LoginPage hidden={currentRoute !== "/login"} />
    </AppLayout>
  );
}

