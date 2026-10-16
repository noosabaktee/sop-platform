import React from "react";

export function WorkspaceTabsNav() {
  return (
            <div className="ws-tabs" role="tablist" aria-label="Halaman My Workspace">
              <button type="button" className="ws-tab" role="tab" id="ws-tab-my-workspace" aria-controls="ws-panel-my-workspace" aria-selected="true" tabIndex={0} data-action="ws:tab" data-panel="my-workspace">
                <iconify-icon noobserver icon="lucide:list-checks" aria-hidden="true"></iconify-icon>
                <span data-en="My Tasks">My Tasks</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-dashboard" aria-controls="ws-panel-dashboard" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="dashboard">
                <iconify-icon noobserver icon="lucide:folder-kanban" aria-hidden="true"></iconify-icon>
                <span data-en="Dashboard">Dashboard</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-crm-sales" aria-controls="ws-panel-crm-sales" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="crm-sales">
                <iconify-icon noobserver icon="lucide:stamp" aria-hidden="true"></iconify-icon>
                <span data-en="CRM & Sales">CRM & Sales</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-business-development" aria-controls="ws-panel-business-development" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="business-development">
                <iconify-icon noobserver icon="lucide:activity" aria-hidden="true"></iconify-icon>
                <span data-en="My Activities">My Activities</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-quotation" aria-controls="ws-panel-quotation" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="quotation">
                <iconify-icon noobserver icon="lucide:calendar-days" aria-hidden="true"></iconify-icon>
                <span data-en="My Calendar">My Calendar</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-sales" aria-controls="ws-panel-sales" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="sales">
                <iconify-icon noobserver icon="lucide:file-text" aria-hidden="true"></iconify-icon>
                <span data-en="My Documents">My Documents</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-projects" aria-controls="ws-panel-projects" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="projects">
                <iconify-icon noobserver icon="lucide:bell" aria-hidden="true"></iconify-icon>
                <span data-en="My Notifications">My Notifications</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-purchase" aria-controls="ws-panel-purchase" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="purchase">
                <iconify-icon noobserver icon="lucide:mail" aria-hidden="true"></iconify-icon>
                <span data-en="My Email">My Email</span>
              </button>
              <button type="button" className="ws-tab" role="tab" id="ws-tab-inventory" aria-controls="ws-panel-inventory" aria-selected="false" tabIndex={-1} data-action="ws:tab" data-panel="inventory">
                <iconify-icon noobserver icon="lucide:user" aria-hidden="true"></iconify-icon>
                <span data-en="My Profile">My Profile</span>
              </button>
            </div>
  );
}
