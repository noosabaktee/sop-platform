import React from "react";

export function TwoFactorPanel() {
  return (
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
  );
}

