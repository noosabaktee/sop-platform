import React from "react";

export function LoginPanel() {
  return (
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
  );
}

