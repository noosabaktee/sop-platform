import React from "react";

export function CrmLeadsTab() {
  return (
    <div className="dash-panel" id="dash-panel-leads" role="tabpanel" aria-labelledby="ws-tab-leads" data-panel="leads" data-title="Leads" data-title-en="Leads">
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmProspectsTab() {
  return (
    <div className="dash-panel" id="dash-panel-prospects" role="tabpanel" aria-labelledby="ws-tab-prospects" data-panel="prospects" data-title="Prospects" data-title-en="Prospects" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmCustomersTab() {
  return (
    <div className="dash-panel" id="dash-panel-customers" role="tabpanel" aria-labelledby="ws-tab-customers" data-panel="customers" data-title="Customers & Contacts" data-title-en="Customers & Contacts" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmActivitiesTab() {
  return (
    <div className="dash-panel" id="dash-panel-activities" role="tabpanel" aria-labelledby="ws-tab-activities" data-panel="activities" data-title="Activities & Follow Up" data-title-en="Activities & Follow Up" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmPipelineTab() {
  return (
    <div className="dash-panel" id="dash-panel-pipeline" role="tabpanel" aria-labelledby="ws-tab-pipeline" data-panel="pipeline" data-title="Sales Pipeline" data-title-en="Sales Pipeline" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmForecastTab() {
  return (
    <div className="dash-panel" id="dash-panel-forecast" role="tabpanel" aria-labelledby="ws-tab-forecast" data-panel="forecast" data-title="Sales Forecast" data-title-en="Sales Forecast" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmHistoryTab() {
  return (
    <div className="dash-panel" id="dash-panel-history" role="tabpanel" aria-labelledby="ws-tab-history" data-panel="history" data-title="Customer History" data-title-en="Customer History" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function CrmSalesPanels() {
  return (
    <div className="dash-panels">
      <CrmLeadsTab />
      <CrmProspectsTab />
      <CrmCustomersTab />
      <CrmActivitiesTab />
      <CrmPipelineTab />
      <CrmForecastTab />
      <CrmHistoryTab />
    </div>
  );
}

