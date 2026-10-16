import React from "react";

export function QuotationListTab() {
  return (
    <div className="dash-panel" id="dash-panel-list" role="tabpanel" aria-labelledby="ws-tab-list" data-panel="list" data-title="Quotation List" data-title-en="Quotation List">
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationCreateTab() {
  return (
    <div className="dash-panel" id="dash-panel-create" role="tabpanel" aria-labelledby="ws-tab-create" data-panel="create" data-title="Create Quotation" data-title-en="Create Quotation" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationDraftTab() {
  return (
    <div className="dash-panel" id="dash-panel-draft" role="tabpanel" aria-labelledby="ws-tab-draft" data-panel="draft" data-title="Draft" data-title-en="Draft" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationPendingTab() {
  return (
    <div className="dash-panel" id="dash-panel-pending" role="tabpanel" aria-labelledby="ws-tab-pending" data-panel="pending" data-title="Pending Approval" data-title-en="Pending Approval" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationSentTab() {
  return (
    <div className="dash-panel" id="dash-panel-sent" role="tabpanel" aria-labelledby="ws-tab-sent" data-panel="sent" data-title="Sent" data-title-en="Sent" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationNegotiationTab() {
  return (
    <div className="dash-panel" id="dash-panel-negotiation" role="tabpanel" aria-labelledby="ws-tab-negotiation" data-panel="negotiation" data-title="Negotiation" data-title-en="Negotiation" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationApprovedTab() {
  return (
    <div className="dash-panel" id="dash-panel-approved" role="tabpanel" aria-labelledby="ws-tab-approved" data-panel="approved" data-title="Approved" data-title-en="Approved" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationRejectedTab() {
  return (
    <div className="dash-panel" id="dash-panel-rejected" role="tabpanel" aria-labelledby="ws-tab-rejected" data-panel="rejected" data-title="Rejected" data-title-en="Rejected" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationExpiredTab() {
  return (
    <div className="dash-panel" id="dash-panel-expired" role="tabpanel" aria-labelledby="ws-tab-expired" data-panel="expired" data-title="Expired" data-title-en="Expired" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationRevisionTab() {
  return (
    <div className="dash-panel" id="dash-panel-revision" role="tabpanel" aria-labelledby="ws-tab-revision" data-panel="revision" data-title="Revision History" data-title-en="Revision History" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationTemplatesTab() {
  return (
    <div className="dash-panel" id="dash-panel-templates" role="tabpanel" aria-labelledby="ws-tab-templates" data-panel="templates" data-title="Quotation Templates" data-title-en="Quotation Templates" hidden>
      <div className="dash-panel__body"></div>
    </div>
  );
}

export function QuotationPanels() {
  return (
    <div className="dash-panels">
      <QuotationListTab />
      <QuotationCreateTab />
      <QuotationDraftTab />
      <QuotationPendingTab />
      <QuotationSentTab />
      <QuotationNegotiationTab />
      <QuotationApprovedTab />
      <QuotationRejectedTab />
      <QuotationExpiredTab />
      <QuotationRevisionTab />
      <QuotationTemplatesTab />
    </div>
  );
}

