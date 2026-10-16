import React from "react";

export function DashboardTabsNav() {
  return (
    <div className="ws-tabs" role="tablist" aria-label="Jenis dashboard">
      <button type="button" className="ws-tab" role="tab" id="ws-tab-executive" aria-controls="dash-panel-executive" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="executive">
        <iconify-icon noobserver icon="lucide:gauge" aria-hidden="true"></iconify-icon>
        <span>Executive</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-sales" aria-controls="dash-panel-sales" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="sales">
        <iconify-icon noobserver icon="lucide:shopping-cart" aria-hidden="true"></iconify-icon>
        <span>Sales</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-finance" aria-controls="dash-panel-finance" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="finance">
        <iconify-icon noobserver icon="lucide:landmark" aria-hidden="true"></iconify-icon>
        <span>Finance</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-project" aria-controls="dash-panel-project" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="project">
        <iconify-icon noobserver icon="lucide:folder-kanban" aria-hidden="true"></iconify-icon>
        <span>Project</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-procurement" aria-controls="dash-panel-procurement" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="procurement">
        <iconify-icon noobserver icon="lucide:package-search" aria-hidden="true"></iconify-icon>
        <span>Procurement</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-inventory" aria-controls="dash-panel-inventory" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="inventory">
        <iconify-icon noobserver icon="lucide:boxes" aria-hidden="true"></iconify-icon>
        <span>Inventory</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-my" aria-controls="dash-panel-my" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="my">
        <iconify-icon noobserver icon="lucide:user" aria-hidden="true"></iconify-icon>
        <span>My Dashboard</span>
      </button>
    </div>
  );
}

