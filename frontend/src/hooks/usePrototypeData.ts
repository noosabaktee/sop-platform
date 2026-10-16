import { useAppData } from "./useAppData";
import type { User } from "../types/auth";
import type { GridBridge } from "../api/gridBridge";
import type { ModuleStateBridge } from "../api/moduleStateBridge";

export interface PrototypeDataResult {
  html: string;
  bridge: GridBridge | null;
  modules: ModuleStateBridge | null;
  status: string;
  setStatus: (status: string) => void;
}

/**
 * Backwards compatibility hook for legacy usePrototypeData.
 * Forwards to standard useAppData without needing raw HTML network fetches.
 */
export function usePrototypeData(
  user: User | null,
  authLoading: boolean,
): PrototypeDataResult {
  const { bridge, modules, status, setStatus } = useAppData(user, authLoading);
  return { html: "", bridge, modules, status, setStatus };
}
