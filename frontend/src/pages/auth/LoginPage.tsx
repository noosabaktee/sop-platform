import React from "react";

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
        <section className="brandpane" aria-label="Tentang SOP">
          <div className="brand">
            <span className="logo">
              <iconify-icon noobserver icon="lucide:layers-2" aria-hidden="true"></iconify-icon>
            </span>
            {' '}SOP{' '}
            <span style={{ opacity: ".7", fontWeight: 400 }}>/ platform</span>
          </div>
          <div className="brand-hero">
            <h1>Kelola bisnis Anda dalam satu platform.</h1>
            <p>Sales, Business Development, Project, Procurement, Inventory, Finance, Corporate, dan Management — single source of truth dengan approval, audit trail, dan AI assistant.</p>
            <ul className="feat">
              <li>
                <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
                <span>
                  <b>Permission by default.</b>
                  {' '}Data dan field sesuai role, company, dan policy.
                </span>
              </li>
              <li>
                <iconify-icon noobserver icon="lucide:git-merge" aria-hidden="true"></iconify-icon>
                <span>
                  <b>Approval & audit.</b>
                  {' '}Setiap keputusan terlacak dan immutable.
                </span>
              </li>
              <li>
                <iconify-icon noobserver icon="lucide:sparkles" aria-hidden="true"></iconify-icon>
                <span>
                  <b>Human-in-the-loop AI.</b>
                  {' '}Draft & analisis, keputusan tetap di manusia.
                </span>
              </li>
            </ul>
          </div>
          <div className="brand-foot">© 2026 SOP Integrated Business Management Platform</div>
        </section>
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
            <div className="tabs" role="tablist" aria-label="Metode masuk" data-login-tabs>
              <button type="button" className="tab" role="tab" aria-selected="true" data-ltab="login">
                <iconify-icon noobserver icon="lucide:log-in" aria-hidden="true"></iconify-icon>
                {' '}Masuk
              </button>
              <button type="button" className="tab" role="tab" aria-selected="false" data-ltab="forgot">
                <iconify-icon noobserver icon="lucide:key-round" aria-hidden="true"></iconify-icon>
                {' '}Lupa sandi
              </button>
              <button type="button" className="tab" role="tab" aria-selected="false" data-ltab="2fa">
                <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
                {' '}2FA
              </button>
            </div>
            <div className="banner warn" data-banner hidden>
              <iconify-icon noobserver icon="lucide:alert-triangle" aria-hidden="true"></iconify-icon>
              <span data-banner-text></span>
            </div>
            <div className="panel" data-panel="login">
              <form data-form="login" noValidate>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <div className="control" data-c="email">
                    <iconify-icon noobserver icon="lucide:mail" aria-hidden="true"></iconify-icon>
                    <input id="email" type="email" autoComplete="email" placeholder="nama@perusahaan.com" />
                  </div>
                  <span className="err" data-err="email"></span>
                </div>
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <div className="control" data-c="password">
                    <iconify-icon noobserver icon="lucide:lock" aria-hidden="true"></iconify-icon>
                    <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
                    <button type="button" className="eye" data-eye aria-label="Tampilkan sandi">
                      <iconify-icon noobserver icon="lucide:eye" aria-hidden="true"></iconify-icon>
                    </button>
                  </div>
                  <span className="err" data-err="password"></span>
                </div>
                <div className="row-between">
                  <label className="check">
                    <input type="checkbox" data-remember defaultChecked />
                    {' '}Ingat saya
                  </label>
                  <button type="button" className="link" data-ltab="forgot">Lupa password?</button>
                </div>
                <button type="submit" className="btn-submit">
                  <iconify-icon noobserver icon="lucide:log-in" aria-hidden="true"></iconify-icon>
                  {' '}Masuk
                </button>
              </form>
              <div className="divider">atau lanjutkan dengan</div>
              <div className="sso">
                <button type="button" data-sso="Google">
                  <iconify-icon noobserver icon="lucide:chrome" aria-hidden="true"></iconify-icon>
                  {' '}Google
                </button>
                <button type="button" data-sso="Microsoft 365">
                  <iconify-icon noobserver icon="lucide:grid-2x2" aria-hidden="true"></iconify-icon>
                  {' '}Microsoft
                </button>
              </div>
              <div className="note">
                Demo:{' '}
                <b>aditya@sop.id</b>
                {' '}· sandi apa pun.{' '}
                <span data-demo-locked>3 percobaan gagal akan mengunci akun.</span>
              </div>
            </div>
            <div className="panel" data-panel="forgot" hidden>
              <form data-form="forgot" noValidate>
                <div className="field">
                  <label htmlFor="femail">Email terdaftar</label>
                  <div className="control" data-c="femail">
                    <iconify-icon noobserver icon="lucide:mail" aria-hidden="true"></iconify-icon>
                    <input id="femail" type="email" placeholder="nama@perusahaan.com" />
                  </div>
                  <span className="err" data-err="femail"></span>
                </div>
                <button type="submit" className="btn-submit">
                  <iconify-icon noobserver icon="lucide:send" aria-hidden="true"></iconify-icon>
                  {' '}Kirim tautan reset
                </button>
              </form>
              <div className="note">Kami akan mengirim tautan reset ke email dengan token sekali pakai yang berlaku terbatas.</div>
            </div>
            <div className="panel" data-panel="2fa" hidden>
              <div className="banner info">
                <iconify-icon noobserver icon="lucide:shield" aria-hidden="true"></iconify-icon>
                <span>Masukkan 6 digit kode dari aplikasi authenticator Anda.</span>
              </div>
              <form data-form="2fa" noValidate>
                <div className="otp" data-otp>
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 1" />
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 2" />
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 3" />
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 4" />
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 5" />
                  <input inputMode="numeric" maxLength={1} aria-label="Digit 6" />
                </div>
                <span className="err" data-err="otp"></span>
                <button type="submit" className="btn-submit">
                  <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                  {' '}Verifikasi & masuk
                </button>
              </form>
              <div className="row-between" style={{ marginTop: 14, marginBottom: 0 }}>
                <button type="button" className="link" data-ltab="login">← Kembali</button>
                <button type="button" className="link" data-resend>Kirim ulang kode</button>
              </div>
            </div>
            <div className="panel" data-panel="locked" hidden>
              <div className="banner warn">
                <iconify-icon noobserver icon="lucide:lock" aria-hidden="true"></iconify-icon>
                <span>
                  <b>Akun terkunci sementara.</b>
                  {' '}Terlalu banyak percobaan gagal. Coba lagi dalam{' '}
                  <b data-lock-count>15:00</b>
                  {' '}atau reset password.
                </span>
              </div>
              <button type="button" className="btn-submit" data-ltab="forgot" style={{ marginBottom: 10 }}>
                <iconify-icon noobserver icon="lucide:key-round" aria-hidden="true"></iconify-icon>
                {' '}Reset password
              </button>
              <button type="button" className="link" data-ltab="login">Kembali ke halaman masuk</button>
            </div>
            <div className="panel" data-panel="done" hidden>
              <div className="success-box">
                <div className="ic">
                  <iconify-icon noobserver icon="lucide:check" aria-hidden="true"></iconify-icon>
                </div>
                <h3 data-done-title>Berhasil</h3>
                <p data-done-sub>Anda akan diarahkan ke Overview.</p>
                <button type="button" className="btn-submit" data-goto="/overview" style={{ marginBottom: 10 }}>
                  <iconify-icon noobserver icon="lucide:arrow-right" aria-hidden="true"></iconify-icon>
                  {' '}Buka Overview
                </button>
                <button type="button" className="btn-submit" data-ltab="login">
                  <iconify-icon noobserver icon="lucide:arrow-right" aria-hidden="true"></iconify-icon>
                  {' '}Masuk lagi
                </button>
              </div>
            </div>
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
