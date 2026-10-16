import React from "react";

export function BdOpportunitiesTab() {
  return (
    <div className="dash-panel" id="dash-panel-opportunities" role="tabpanel" aria-labelledby="ws-tab-opportunities" data-panel="opportunities" data-title="Business Opportunities" data-title-en="Business Opportunities">
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdMarketTab() {
  return (
    <div className="dash-panel" id="dash-panel-market" role="tabpanel" aria-labelledby="ws-tab-market" data-panel="market" data-title="Market Intelligence" data-title-en="Market Intelligence" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdTargetsTab() {
  return (
    <div className="dash-panel" id="dash-panel-targets" role="tabpanel" aria-labelledby="ws-tab-targets" data-panel="targets" data-title="Target Accounts" data-title-en="Target Accounts" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdMappingTab() {
  return (
    <div className="dash-panel" id="dash-panel-mapping" role="tabpanel" aria-labelledby="ws-tab-mapping" data-panel="mapping" data-title="Prospect Mapping" data-title-en="Prospect Mapping" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdPartnershipTab() {
  return (
    <div className="dash-panel" id="dash-panel-partnership" role="tabpanel" aria-labelledby="ws-tab-partnership" data-panel="partnership" data-title="Partnership" data-title-en="Partnership" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdTenderTab() {
  return (
    <div className="dash-panel" id="dash-panel-tender" role="tabpanel" aria-labelledby="ws-tab-tender" data-panel="tender" data-title="Tender & Bidding" data-title-en="Tender & Bidding" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdPipelineTab() {
  return (
    <div className="dash-panel" id="dash-panel-pipeline" role="tabpanel" aria-labelledby="ws-tab-pipeline" data-panel="pipeline" data-title="Opportunity Pipeline" data-title-en="Opportunity Pipeline" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdCompetitorsTab() {
  return (
    <div className="dash-panel" id="dash-panel-competitors" role="tabpanel" aria-labelledby="ws-tab-competitors" data-panel="competitors" data-title="Competitor Analysis" data-title-en="Competitor Analysis" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdProposalTab() {
  return (
    <div className="dash-panel" id="dash-panel-proposal" role="tabpanel" aria-labelledby="ws-tab-proposal" data-panel="proposal" data-title="Business Proposal" data-title-en="Business Proposal" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdReportsTab() {
  return (
    <div className="dash-panel" id="dash-panel-reports" role="tabpanel" aria-labelledby="ws-tab-reports" data-panel="reports" data-title="Business Development Reports" data-title-en="Business Development Reports" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function BdPanels() {
  return (
    <div className="dash-panels">
      <BdOpportunitiesTab />
      <BdMarketTab />
      <BdTargetsTab />
      <BdMappingTab />
      <BdPartnershipTab />
      <BdTenderTab />
      <BdPipelineTab />
      <BdCompetitorsTab />
      <BdProposalTab />
      <BdReportsTab />
    </div>
  );
}

