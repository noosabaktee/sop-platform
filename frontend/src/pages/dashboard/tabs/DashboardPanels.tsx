import React from "react";

export function DashboardExecutiveTab() {
  return (
    <div className="dash-panel" id="dash-panel-executive" role="tabpanel" aria-labelledby="ws-tab-executive" data-panel="executive" data-title="Executive Dashboard" data-title-en="Executive Dashboard">
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardSalesTab() {
  return (
    <div className="dash-panel" id="dash-panel-sales" role="tabpanel" aria-labelledby="ws-tab-sales" data-panel="sales" data-title="Sales Dashboard" data-title-en="Sales Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardFinanceTab() {
  return (
    <div className="dash-panel" id="dash-panel-finance" role="tabpanel" aria-labelledby="ws-tab-finance" data-panel="finance" data-title="Finance Dashboard" data-title-en="Finance Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardProjectTab() {
  return (
    <div className="dash-panel" id="dash-panel-project" role="tabpanel" aria-labelledby="ws-tab-project" data-panel="project" data-title="Project Dashboard" data-title-en="Project Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardProcurementTab() {
  return (
    <div className="dash-panel" id="dash-panel-procurement" role="tabpanel" aria-labelledby="ws-tab-procurement" data-panel="procurement" data-title="Procurement Dashboard" data-title-en="Procurement Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardInventoryTab() {
  return (
    <div className="dash-panel" id="dash-panel-inventory" role="tabpanel" aria-labelledby="ws-tab-inventory" data-panel="inventory" data-title="Inventory Dashboard" data-title-en="Inventory Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardMyTab() {
  return (
    <div className="dash-panel" id="dash-panel-my" role="tabpanel" aria-labelledby="ws-tab-my" data-panel="my" data-title="My Dashboard" data-title-en="My Dashboard" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function DashboardPanels() {
  return (
    <div className="dash-panels">
      <DashboardExecutiveTab />
      <DashboardSalesTab />
      <DashboardFinanceTab />
      <DashboardProjectTab />
      <DashboardProcurementTab />
      <DashboardInventoryTab />
      <DashboardMyTab />
    </div>
  );
}

