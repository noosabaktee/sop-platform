import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { GridBridge } from "../api/gridBridge";
import { ModuleStateBridge } from "../api/moduleStateBridge";
import type { User } from "../types/auth";
import type { Snapshot, StateSnapshot, ServerUser } from "../types/prototype";

export interface AppDataResult {
  bridge: GridBridge | null;
  modules: ModuleStateBridge | null;
  status: string;
  setStatus: (status: string) => void;
  isReady: boolean;
}

/**
 * Standard React Data Hook for SOP Platform.
 * Loads PostgreSQL grid snapshots, module states, and administrative users.
 * Does NOT rely on fetching raw HTML templates.
 */
export function useAppData(
  user: User | null,
  authLoading: boolean,
): AppDataResult {
  const [bridge, setBridge] = useState<GridBridge | null>(null);
  const [modules, setModules] = useState<ModuleStateBridge | null>(null);
  const [status, setStatus] = useState<string>("Memuat konfigurasi sistem...");
  const [isReady, setIsReady] = useState<boolean>(false);
  const isStarted = useRef<boolean>(false);

  useEffect(() => {
    if (authLoading || isStarted.current) return;
    isStarted.current = true;

    let isCancelled = false;
    const isSuperOrAdmin = Boolean(
      user && ["super_admin", "admin"].includes(user.role),
    );

    Promise.all([
      user
        ? api
            .get("/api/v1/grid-snapshots")
            .then((res) => res.data.data as Snapshot[])
        : Promise.resolve([] as Snapshot[]),
      user
        ? api
            .get("/api/v1/module-states")
            .then((res) => res.data.data as StateSnapshot[])
        : Promise.resolve([] as StateSnapshot[]),
      isSuperOrAdmin
        ? api
            .get("/api/v1/admin/users")
            .then((res) => res.data.data as ServerUser[])
        : Promise.resolve([] as ServerUser[]),
    ])
      .then(([snapshots, states, users]) => {
        if (isCancelled) return;

        const gridBridge = new GridBridge(snapshots);
        const moduleBridge = new ModuleStateBridge(states, isSuperOrAdmin);

        if (isSuperOrAdmin && users.length > 0) {
          moduleBridge.preloadUsers(users);
        }

        setBridge(gridBridge);
        setModules(moduleBridge);
        setIsReady(true);
      })
      .catch((error: unknown) => {
        setStatus("Tidak dapat memuat aplikasi: " + String(error));
      });

    return () => {
      isCancelled = true;
    };
  }, [user, authLoading]);

  return { bridge, modules, status, setStatus, isReady };
}

