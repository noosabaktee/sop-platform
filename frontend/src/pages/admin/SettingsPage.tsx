import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function SettingsPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="settings"
      data-route="/settings"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="settings.dashboard" data-sidebar="default" data-page-title="Settings" data-page-title-en="Settings" data-export-name="settings">
        <AppSidebar nodePrefix="settings" />
        <div className="main-column">
          <AppTopbar nodePrefix="settings" currentRouteTitle="Settings" />
          <section className="page-region">
            <h1 className="sr-only">Settings</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Settings">Settings</h2>
                <p data-en="Users, roles, approval workflow, numbering, notifications, parameters, localization, email, WhatsApp, AI, integrations, and backup.">User, role, approval workflow, penomoran, notifikasi, parameter, lokalisasi, email, WhatsApp, AI, integrasi, dan backup.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="set:reset">
                  <iconify-icon noobserver icon="lucide:rotate-ccw" aria-hidden="true"></iconify-icon>
                  <span data-en="Reset">Reset</span>
                </button>
                <button type="button" className="btn-primary" data-action="set:save">
                  <iconify-icon noobserver icon="lucide:save" aria-hidden="true"></iconify-icon>
                  <span data-en="Save changes">Simpan perubahan</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Settings" id="set-tabs"></div>
            <div id="set-panels"></div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <dialog className="dialog form-dialog" aria-label="Form">
            <button type="button" className="dialog-close" data-action="dlg:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-form="title">Form</h2>
            <p data-form="desc"></p>
            <form data-form="form">
              <div className="form-grid" data-form="fields"></div>
            </form>
            <small data-form="note">Perubahan dicatat pada audit trail.</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="dlg:close">Batal</button>
              <button type="button" className="btn-primary" data-action="form:submit">
                <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                <span data-form="submit">Simpan</span>
              </button>
            </footer>
          </dialog>
          <dialog className="dialog confirm-dialog" aria-label="Konfirmasi">
            <button type="button" className="dialog-close" data-action="dlg:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-confirm="title">Konfirmasi</h2>
            <p data-confirm="desc"></p>
            <div data-confirm="body"></div>
            <footer>
              <button type="button" className="btn-ghost" data-action="dlg:close">Batal</button>
              <button type="button" className="btn-primary" data-action="confirm:yes">
                <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                <span data-confirm="yes">Lanjutkan</span>
              </button>
            </footer>
          </dialog>
          <dialog className="dialog" aria-label="Detail">
            <button type="button" className="dialog-close" data-action="kravio:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-detail="title"></h2>
            <p data-detail="description"></p>
            <div data-detail="body"></div>
            <small>Prototype interaktif · data contoh Settings SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
