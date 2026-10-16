import { useAppBridges } from "./useAppBridges";
import type { User } from "../types/auth";
import type { GridBridge } from "../api/gridBridge";
import type { ModuleStateBridge } from "../api/moduleStateBridge";

/**
 * Backwards compatibility hook for legacy usePrototypeBridges.
 * Forwards to standard useAppBridges.
 */
export function usePrototypeBridges(
  _html: string,
  bridge: GridBridge | null,
  modules: ModuleStateBridge | null,
  user: User | null,
  setStatus: (status: string) => void,
) {
  useAppBridges(bridge, modules, user, setStatus);
}
