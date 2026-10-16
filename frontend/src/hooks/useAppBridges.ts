import { useEffect, useRef } from "react";
import type { User } from "../types/auth";
import type { GridBridge } from "../api/gridBridge";
import type { ModuleStateBridge } from "../api/moduleStateBridge";
import { QuotationBuilderBridge } from "../api/quotationBuilderBridge";
import { ProjectTaskNativeBridge } from "../api/projectTaskNativeBridge";
import { ProjectNativeBridge } from "../api/projectNativeBridge";
import { PurchaseRequestNativeBridge } from "../api/purchaseRequestNativeBridge";
import { ProcurementReceiptNativeBridge } from "../api/procurementReceiptNativeBridge";
import { ProcurementReturnNativeBridge } from "../api/procurementReturnNativeBridge";
import { SalesNativeBridge } from "../api/salesNativeBridge";
import { OperationalProjectionBridge } from "../api/operationalProjectionBridge";
import { StocktakeNativeBridge } from "../api/stocktakeNativeBridge";
import { AccountingNativeBridge } from "../api/accountingNativeBridge";
import { BankNativeBridge } from "../api/bankNativeBridge";
import { ProjectCostNativeBridge } from "../api/projectCostNativeBridge";
import { InventoryAdjustmentNativeBridge } from "../api/inventoryAdjustmentNativeBridge";
import { CrmOpportunityNativeBridge } from "../api/crmOpportunityNativeBridge";
import { CrmCustomerNativeBridge } from "../api/crmCustomerNativeBridge";
import { InventoryTransferNativeBridge } from "../api/inventoryTransferNativeBridge";
import { CompletionBridge } from "../api/completionBridge";
import { ManagementNativeBridge } from "../api/managementNativeBridge";
import { IntegrationStatusBridge } from "../api/integrationStatusBridge";
import { ExternalNativeBridge } from "../api/externalNativeBridge";
import { CrmWorkflowBridge } from "../api/crmWorkflowBridge";
import { CorporateNativeBridge } from "../api/corporateNativeBridge";
import { DocumentVaultBridge } from "../api/documentVaultBridge";
import { SecurityAuditBridge } from "../api/securityAuditBridge";
import { DocumentTemplateBridge } from "../api/documentTemplateBridge";
import { ApprovalWorkflowBridge } from "../api/approvalWorkflowBridge";
import { refreshSalesOperationalGrids } from "../api/salesOperationalProjection";
import { refreshNativeKpis } from "../api/kpiProjection";
import { refreshNativeWorkspace } from "../api/workspaceProjection";

let runtimeLoaded = false;

export function useAppBridges(
  bridge: GridBridge | null,
  modules: ModuleStateBridge | null,
  user: User | null,
  setStatus: (status: string) => void,
) {
  const isInstalledRef = useRef<boolean>(false);

  useEffect(() => {
    if (!bridge || !modules || isInstalledRef.current || runtimeLoaded) return;
    isInstalledRef.current = true;
    runtimeLoaded = true;

    // Expose global bridges for native access & test assertions
    (
      window as unknown as {
        SOPBridge: GridBridge;
        SOPModules: ModuleStateBridge;
      }
    ).SOPBridge = bridge;
    (window as unknown as { SOPModules: ModuleStateBridge }).SOPModules =
      modules;

    let isCancelled = false;

    // Instantiate all 24 domain bridge adapters
    const completion = new CompletionBridge(bridge);
    const operational = new OperationalProjectionBridge(bridge);
    const quotation = new QuotationBuilderBridge(bridge);
    const projectTasks = new ProjectTaskNativeBridge(operational);
    const projects = new ProjectNativeBridge(operational);
    const purchaseRequests = new PurchaseRequestNativeBridge(operational);
    const receipts = new ProcurementReceiptNativeBridge(operational);
    const returns = new ProcurementReturnNativeBridge(operational);
    const sales = new SalesNativeBridge(bridge);
    const stocktakes = new StocktakeNativeBridge(operational);
    const accounting = new AccountingNativeBridge(operational);
    const banks = new BankNativeBridge(() => completion.refresh());
    const projectCosts = new ProjectCostNativeBridge(() =>
      completion.refresh(),
    );
    const adjustments = new InventoryAdjustmentNativeBridge(operational);
    const opportunities = new CrmOpportunityNativeBridge(bridge);
    const crmCustomers = new CrmCustomerNativeBridge(bridge);
    const transfers = new InventoryTransferNativeBridge(bridge, operational);
    const management = new ManagementNativeBridge();
    const integrations = new IntegrationStatusBridge();
    const external = new ExternalNativeBridge();
    const crmWorkflow = new CrmWorkflowBridge(bridge);
    const corporate = new CorporateNativeBridge();
    const docs = new DocumentVaultBridge();
    const audit = new SecurityAuditBridge();
    const templates = new DocumentTemplateBridge();
    const approvals = new ApprovalWorkflowBridge(
      Boolean(user && ["super_admin", "admin", "manager"].includes(user.role)),
    );

    (async () => {
      try {
        setStatus("Memuat modul interaktif...");
        // Import modular bundled runtime instead of injecting raw script tags
        await import("../scripts/sop-runtime");

        if (isCancelled) return;

        if (user) {
          // Install active event adapters
          transfers.install();
          stocktakes.install();
          adjustments.install();
          accounting.install();
          banks.install();
          projectCosts.install();
          opportunities.install();
          crmCustomers.install();
          external.install();
          crmWorkflow.install();
          projects.install();
          projectTasks.install();
          purchaseRequests.install();
          receipts.install();
          returns.install();
          sales.install();

          // Resolve real SQL-backed panels before allowing native fixture snapshots to seed
          const preparations: Promise<unknown>[] = [
            quotation.install(),
            approvals.install(),
            docs.install(),
            templates.install(),
            refreshSalesOperationalGrids(bridge),
            operational.refresh(),
            completion.install(),
            corporate.install(),
          ];

          if (
            ["super_admin", "admin", "manager", "auditor"].includes(user.role)
          ) {
            preparations.push(audit.install());
          }

          const results = await Promise.allSettled(preparations);
          results.forEach((item) => {
            if (item.status === "rejected") {
              console.error("Inisialisasi domain gagal:", item.reason);
            }
          });
        }

        setStatus("Menghubungkan data ke server...");
        if (user) {
          await bridge.seedUninitialized();
          await modules.seedMissing();
          management.install();
          integrations.install();

          void refreshNativeKpis().catch(console.error);
          void refreshNativeWorkspace().catch(console.error);
        }

        setStatus("");
      } catch (err) {
        setStatus("Gagal memuat fungsi SOP: " + String(err));
        console.error(err);
      }
    })();

    return () => {
      isCancelled = true;
      templates.uninstall();
      integrations.uninstall();
      management.uninstall();
      transfers.uninstall();
      stocktakes.uninstall();
      adjustments.uninstall();
      accounting.uninstall();
      banks.uninstall();
      projectCosts.uninstall();
      opportunities.uninstall();
      crmCustomers.uninstall();
      external.uninstall();
      crmWorkflow.uninstall();
      projects.uninstall();
      projectTasks.uninstall();
      purchaseRequests.uninstall();
      receipts.uninstall();
      returns.uninstall();
      sales.uninstall();
      corporate.uninstall();
      completion.uninstall();
      quotation.uninstall();
      approvals.uninstall();
      docs.uninstall();
      audit.uninstall();
    };
  }, [bridge, modules, user, setStatus]);
}

