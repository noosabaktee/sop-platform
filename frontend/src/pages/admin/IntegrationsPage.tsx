import { AppSidebar, AppTopbar } from "../../components";
import React from "react";

export interface PageProps {
  hidden?: boolean;
}

export function IntegrationsPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="integrations"
      data-route="/integrations"
      hidden={hidden}
    >
       <div className="dashboard" data-node-id="integrations.dashboard" data-sidebar="default" data-page-title="Integrations" data-page-title-en="Integrations" data-export-name="integrations">
        <AppSidebar nodePrefix="integrations" />
        <div className="main-column">
          <AppTopbar nodePrefix="integrations" currentRouteTitle="Integrations" />
          <section className="page-region">
            <h1 className="sr-only">Integrations</h1>
            <header className="page-head">
              <div>
                <h2 data-en="Integrations">Integrations</h2>
                <p data-en="Connect WhatsApp, email, cloud, payment, banking, tax, API, webhook, IoT, and external applications — with connection health.">Hubungkan WhatsApp, email, cloud, payment, banking, pajak, API, webhook, IoT, dan aplikasi eksternal — dengan health koneksi.</p>
              </div>
              <div className="page-actions">
                <button type="button" className="btn-ghost" data-action="int:sync">
                  <iconify-icon noobserver icon="lucide:refresh-cw" aria-hidden="true"></iconify-icon>
                  <span data-en="Sync all">Sinkron semua</span>
                </button>
                <button type="button" className="btn-primary" data-action="int:new">
                  <iconify-icon noobserver icon="lucide:plus" aria-hidden="true"></iconify-icon>
                  <span data-en="Add integration">Tambah integrasi</span>
                </button>
              </div>
            </header>
            <div className="ws-tabs" role="tablist" aria-label="Menu Integrations" id="int-tabs"></div>
            <div className="ctrl-bar">
              <span className="fresh">
                <span className="dot" aria-hidden="true"></span>
                <span data-en="System health">Health sistem</span>
                {' '}09:42
              </span>
              <span className="grow"></span>
              <label className="fresh">
                <iconify-icon noobserver icon="lucide:search" aria-hidden="true" style={{ width: 14, height: 14 }}></iconify-icon>
              </label>
              <input data-int-search type="search" placeholder="Cari integrasi…" aria-label="Cari integrasi" />
            </div>
            <div id="int-panels"></div>
          </section>
          <button type="button" className="sidebar-backdrop" data-action="kravio:sidebar" aria-label="Tutup navigasi"></button>
          <div className="toast" role="status" aria-live="polite" hidden></div>
          <dialog className="dialog form-dialog" aria-label="Form integrasi">
            <button type="button" className="dialog-close" data-action="dlg:close" aria-label="Tutup">
              <iconify-icon noobserver icon="lucide:x" aria-hidden="true"></iconify-icon>
            </button>
            <h2 data-form="title">Tambah integrasi</h2>
            <p data-form="desc"></p>
            <form data-form="form">
              <div className="form-grid" data-form="fields"></div>
            </form>
            <small>Kredensial disimpan di secret manager · semua perubahan dicatat pada audit.</small>
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
            <small>Prototype interaktif · data contoh Integrations SOP</small>
            <footer>
              <button type="button" className="btn-ghost" data-action="kravio:close">Tutup</button>
            </footer>
          </dialog>
        </div>
      </div>
    </section>
  );
}
