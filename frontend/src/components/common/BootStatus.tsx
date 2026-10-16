import React from "react";

export interface BootStatusProps {
  message?: string;
}

export function BootStatus({ message = "Memuat sesi..." }: BootStatusProps) {
  if (!message) return null;

  return (
    <div className="sop-boot-status" role="status">
      <div className="sop-load-bar" />
      {message}
    </div>
  );
}
