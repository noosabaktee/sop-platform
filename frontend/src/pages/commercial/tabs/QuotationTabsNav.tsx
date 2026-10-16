import React from "react";

export function QuotationTabsNav() {
  return (
    <div className="ws-tabs" role="tablist" aria-label="Modul Quotation">
      <button type="button" className="ws-tab" role="tab" id="ws-tab-list" aria-controls="dash-panel-list" aria-selected="true" tabIndex={0} data-action="dash:tab" data-panel="list">
        <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
        <span>Quotation List</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-create" aria-controls="dash-panel-create" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="create">
        <iconify-icon noobserver icon="lucide:file-plus" aria-hidden="true"></iconify-icon>
        <span>Create Quotation</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-draft" aria-controls="dash-panel-draft" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="draft">
        <iconify-icon noobserver icon="lucide:file-pen" aria-hidden="true"></iconify-icon>
        <span>Draft</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-pending" aria-controls="dash-panel-pending" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="pending">
        <iconify-icon noobserver icon="lucide:clock" aria-hidden="true"></iconify-icon>
        <span>Pending Approval</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-sent" aria-controls="dash-panel-sent" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="sent">
        <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
        <span>Sent</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-negotiation" aria-controls="dash-panel-negotiation" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="negotiation">
        <iconify-icon noobserver icon="lucide:messages-square" aria-hidden="true"></iconify-icon>
        <span>Negotiation</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-approved" aria-controls="dash-panel-approved" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="approved">
        <iconify-icon noobserver icon="lucide:badge-check" aria-hidden="true"></iconify-icon>
        <span>Approved</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-rejected" aria-controls="dash-panel-rejected" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="rejected">
        <iconify-icon noobserver icon="lucide:x-circle" aria-hidden="true"></iconify-icon>
        <span>Rejected</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-expired" aria-controls="dash-panel-expired" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="expired">
        <iconify-icon noobserver icon="lucide:calendar-x" aria-hidden="true"></iconify-icon>
        <span>Expired</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-revision" aria-controls="dash-panel-revision" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="revision">
        <iconify-icon noobserver icon="lucide:history" aria-hidden="true"></iconify-icon>
        <span>Revision History</span>
      </button>
      <button type="button" className="ws-tab" role="tab" id="ws-tab-templates" aria-controls="dash-panel-templates" aria-selected="false" tabIndex={-1} data-action="dash:tab" data-panel="templates">
        <iconify-icon noobserver icon="lucide:layout-template" aria-hidden="true"></iconify-icon>
        <span>Quotation Templates</span>
      </button>
    </div>
  );
}

