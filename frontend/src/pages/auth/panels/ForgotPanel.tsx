import React from "react";

export function ForgotPanel() {
  return (
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
  );
}

