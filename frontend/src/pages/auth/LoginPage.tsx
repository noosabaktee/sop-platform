import React from "react";
import {
  BrandPane,
  LoginTabsNav,
  LoginPanel,
  ForgotPanel,
  TwoFactorPanel,
  LockedPanel,
  DonePanel,
} from "./panels";

export interface PageProps {
  hidden?: boolean;
}

export function LoginPage({ hidden }: PageProps) {
  return (
    <section
      data-prototype-page
      data-page-id="login"
      data-route="/login"
      hidden={hidden}
    >
      <div className="dashboard login" data-node-id="login.dashboard" data-theme="light">
        <BrandPane />
        <section className="formpane">
          <div className="login-lang" role="group" aria-label="Pilih bahasa">
            <button type="button" data-login-lang="id" aria-pressed="true">ID</button>
            <button type="button" data-login-lang="en" aria-pressed="false">EN</button>
          </div>
          <div className="auth">
            <div className="auth-head">
              <div className="mobile-brand">
                <span className="logo">
                  <iconify-icon noobserver icon="lucide:layers-2" aria-hidden="true"></iconify-icon>
                </span>
                {' '}SOP
              </div>
              <h2 data-panel-title>Masuk ke akun Anda</h2>
              <p data-panel-sub>Selamat datang kembali. Silakan masuk untuk melanjutkan.</p>
            </div>

            <LoginTabsNav />

            <div className="banner warn" data-banner hidden>
              <iconify-icon noobserver icon="lucide:alert-triangle" aria-hidden="true"></iconify-icon>
              <span data-banner-text></span>
            </div>

            <LoginPanel />
            <ForgotPanel />
            <TwoFactorPanel />
            <LockedPanel />
            <DonePanel />

            <div className="help">
              Butuh bantuan? Hubungi{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>admin@perusahaan.com</a>
              {' '}·{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>Kebijakan privasi</a>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
