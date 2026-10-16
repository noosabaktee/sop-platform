import React, { useRef } from "react";
import { useAuth } from "../app/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { BootStatus } from "../components/common/BootStatus";
import { usePrototypeData } from "../hooks/usePrototypeData";
import { usePrototypeRouting } from "../hooks/usePrototypeRouting";
import { usePrototypeAuthHandlers } from "../hooks/usePrototypeAuthHandlers";
import { usePrototypeActionHandlers } from "../hooks/usePrototypeActionHandlers";
import { usePrototypeBridges } from "../hooks/usePrototypeBridges";

/**
 * Standard React Component for the SOP Platform Prototype
 * Composes modular custom hooks for data fetching, routing, authentication,
 * domain protection, and bridge lifecycle management while preserving exact UI fidelity.
 */
export function ExactPrototype() {
  const { user, loading: authLoading } = useAuth();
  const hostRef = useRef<HTMLDivElement>(null);
  const signedInRef = useRef<boolean>(false);

  // 1. Data loading: HTML template, initial snapshots, module states, and users
  const { html, bridge, modules, status, setStatus } = usePrototypeData(
    user,
    authLoading,
  );

  // 2. Hash routing, session guards, and workspace/KPI route sync
  usePrototypeRouting(user, authLoading, signedInRef);

  // 3. Form interceptors for login, 2FA verification, password reset, and logout
  usePrototypeAuthHandlers(bridge, modules, setStatus, signedInRef);

  // 4. Action handlers for real CSV import/export, domain edit protection, and dashboard updates
  usePrototypeActionHandlers(bridge, modules, user);

  // 5. Bridge adapter lifecycle orchestration (Quotation, Sales, Inventory, Accounting, etc.)
  usePrototypeBridges(html, bridge, modules, user, setStatus);

  if (authLoading) {
    return <BootStatus message="Memuat sesi..." />;
  }

  return (
    <AppLayout status={status}>
      <div ref={hostRef} dangerouslySetInnerHTML={{ __html: html }} />
    </AppLayout>
  );
}
