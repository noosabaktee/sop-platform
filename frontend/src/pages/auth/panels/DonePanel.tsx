import React from "react";

export function DonePanel() {
  return (
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
  );
}

