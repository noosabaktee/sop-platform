import React from "react";

export interface ContextBannerProps {
  title: string;
  badge?: string;
  description: string;
  flow?: string;
  icon?: string;
  tone?: "blue" | "green" | "amber" | "slate";
}

export function ContextBanner({
  title,
  badge,
  description,
  flow,
  icon = "lucide:info",
  tone = "amber",
}: ContextBannerProps) {
  return (
    <div className={`sop-context-banner tone-${tone}`} role="region" aria-label={title}>
      <div className="sop-cb-header">
        <iconify-icon noobserver icon={icon} aria-hidden="true" />
        <strong>{title}</strong>
        {badge && <span className="sop-badge-pill">{badge}</span>}
      </div>
      <p className="sop-cb-desc">{description}</p>
      {flow && (
        <div className="sop-cb-flow">
          <iconify-icon noobserver icon="lucide:arrow-right-circle" aria-hidden="true" />
          <span>{flow}</span>
        </div>
      )}
    </div>
  );
}

