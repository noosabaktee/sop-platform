import { useEffect, useRef } from "react";
import type { User } from "../types/auth";
import { refreshNativeKpis } from "../api/kpiProjection";
import { refreshNativeWorkspace } from "../api/workspaceProjection";

export function useAppRouting(
  user: User | null,
  authLoading: boolean,
  isSignedInRef?: React.MutableRefObject<boolean>,
) {
  const userRef = useRef<User | null>(user);
  userRef.current = user;

  useEffect(() => {
    // If authentication is still being verified from the backend, wait.
    // Do NOT redirect or overwrite location.hash prematurely!
    if (authLoading) return;

    const isAuthed = Boolean(
      userRef.current ||
        isSignedInRef?.current ||
        sessionStorage.getItem("sop_authenticated") === "1",
    );

    const routeGuard = () => {
      const route = location.hash.slice(1);
      const authed = Boolean(
        userRef.current ||
          isSignedInRef?.current ||
          sessionStorage.getItem("sop_authenticated") === "1",
      );

      if (!authed && route !== "/login") {
        location.hash = "#/login";
      } else if (
        authed &&
        (route === "/login" || route === "" || route === "/")
      ) {
        location.hash = "#/my-workspace";
      }
    };

    // Initial route check when hash is empty
    if (!location.hash) {
      location.hash = isAuthed ? "#/my-workspace" : "#/login";
    }

    const handleWorkspaceRoute = () => {
      if (!userRef.current) return;

      if (location.hash === "#/my-workspace") {
        void refreshNativeWorkspace().catch(console.error);
      }
      if (["#/overview", "#/dashboard"].includes(location.hash)) {
        void refreshNativeKpis().catch(console.error);
      }
    };

    const handleDomainUpdated = () => {
      if (!userRef.current) return;
      void refreshNativeKpis().catch(console.error);
      void refreshNativeWorkspace().catch(console.error);
    };

    routeGuard();

    window.addEventListener("hashchange", routeGuard);
    window.addEventListener("hashchange", handleWorkspaceRoute);
    window.addEventListener("sop:domain-updated", handleDomainUpdated);

    return () => {
      window.removeEventListener("hashchange", routeGuard);
      window.removeEventListener("hashchange", handleWorkspaceRoute);
      window.removeEventListener("sop:domain-updated", handleDomainUpdated);
    };
  }, [authLoading, Boolean(user), isSignedInRef]);
}

export { useAppRouting as usePrototypeRouting };

