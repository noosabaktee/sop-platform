import React from "react";

export function LockedPanel() {
  return (
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
  );
}

