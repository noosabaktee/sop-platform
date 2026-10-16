import React, { type ReactNode } from "react";
import { BootStatus } from "../common/BootStatus";
import { ApiProgressBar } from "../common/ApiProgressBar";

export interface AppLayoutProps {
  children: ReactNode;
  status?: string;
}

export function AppLayout({ children, status }: AppLayoutProps) {
  return (
    <div className="sop-app-container">
      {children}
      <BootStatus message={status} />
      <ApiProgressBar />
    </div>
  );
}
