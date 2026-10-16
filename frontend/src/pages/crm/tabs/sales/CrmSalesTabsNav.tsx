import React from "react";

export function CrmSalesTabsNav() {
  return (
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
  );
}

