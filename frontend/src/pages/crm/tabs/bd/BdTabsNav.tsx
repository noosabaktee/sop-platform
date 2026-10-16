import React from "react";

export function BdTabsNav() {
  return (
    <div className="ws-tabs" role="tablist" aria-label="Modul Business Development">
      <button type="button" className="ws-tab" role="tab" id="ws-tab-opportunities" aria-controls="dash-panel-opportunities" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="opportunities">
        <iconify-icon noobserver icon="lucide:target" aria-hidden="true"></iconify-icon>
        <span>Business Opportunities</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-market" aria-controls="dash-panel-market" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="market">
        <iconify-icon noobserver icon="lucide:radar" aria-hidden="true"></iconify-icon>
        <span>Market Intelligence</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-targets" aria-controls="dash-panel-targets" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="targets">
        <iconify-icon noobserver icon="lucide:building-2" aria-hidden="true"></iconify-icon>
        <span>Target Accounts</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-mapping" aria-controls="dash-panel-mapping" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="mapping">
        <iconify-icon noobserver icon="lucide:map" aria-hidden="true"></iconify-icon>
        <span>Prospect Mapping</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-partnership" aria-controls="dash-panel-partnership" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="partnership">
        <iconify-icon noobserver icon="lucide:handshake" aria-hidden="true"></iconify-icon>
        <span>Partnership</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-tender" aria-controls="dash-panel-tender" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="tender">
        <iconify-icon noobserver icon="lucide:gavel" aria-hidden="true"></iconify-icon>
        <span>Tender & Bidding</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-pipeline" aria-controls="dash-panel-pipeline" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="pipeline">
        <iconify-icon noobserver icon="lucide:git-branch" aria-hidden="true"></iconify-icon>
        <span>Opportunity Pipeline</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-competitors" aria-controls="dash-panel-competitors" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="competitors">
        <iconify-icon noobserver icon="lucide:swords" aria-hidden="true"></iconify-icon>
        <span>Competitor Analysis</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-proposal" aria-controls="dash-panel-proposal" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="proposal">
        <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
        <span>Business Proposal</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-reports" aria-controls="dash-panel-reports" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="reports">
        <iconify-icon noobserver icon="lucide:bar-chart-3" aria-hidden="true"></iconify-icon>
        <span>BD Reports</span>
      </button>
    </div>
  );
}

