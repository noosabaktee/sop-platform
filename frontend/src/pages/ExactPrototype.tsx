import React from "react";
import { App } from "../app/App";

/**
 * Backwards-compatibility wrapper for ExactPrototype.
 * Forwards to the standard React App modular component tree.
 */
export function ExactPrototype() {
  return <App />;
}
