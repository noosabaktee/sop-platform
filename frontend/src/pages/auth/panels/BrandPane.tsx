import React from "react";

export function BrandPane() {
  return (
    <section className="brandpane" aria-label="Tentang SOP">
      <div className="brand">
        <span className="logo">
          <iconify-icon noobserver icon="lucide:layers-2" aria-hidden="true"></iconify-icon>
        </span>
        {' '}SOP <span style={{ opacity: 0.7, fontWeight: 400 }}>/ platform</span>
      </div>
      <div className="brand-hero">
        <h1>Kelola bisnis Anda dalam satu platform.</h1>
        <p>
          Sales, Business Development, Project, Procurement, Inventory, Finance,
          Corporate, dan Management — single source of truth dengan approval,
          audit trail, dan AI assistant.
        </p>
        <ul className="feat">
          <li>
            <iconify-icon noobserver icon="lucide:shield-check" aria-hidden="true"></iconify-icon>
            <span>
              <b>Permission by default.</b> Data dan field sesuai role, company, dan policy.
            </span>
          </li>
          <li>
            <iconify-icon noobserver icon="lucide:git-merge" aria-hidden="true"></iconify-icon>
            <span>
              <b>Approval &amp; audit.</b> Setiap keputusan terlacak dan immutable.
            </span>
          </li>
          <li>
            <iconify-icon noobserver icon="lucide:sparkles" aria-hidden="true"></iconify-icon>
            <span>
              <b>Human-in-the-loop AI.</b> Draft &amp; analisis, keputusan tetap di manusia.
            </span>
          </li>
        </ul>
      </div>
      <div className="brand-foot">© 2026 SOP Integrated Business Management Platform</div>
    </section>
  );
}

