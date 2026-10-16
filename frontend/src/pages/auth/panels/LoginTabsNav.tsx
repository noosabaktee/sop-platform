import React from "react";

export function LoginTabsNav() {
  return (
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
  );
}

