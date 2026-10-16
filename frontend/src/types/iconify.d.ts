import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        icon?: string;
        noobserver?: boolean | string;
        "aria-hidden"?: string | boolean;
      };
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        icon?: string;
        noobserver?: boolean | string;
        "aria-hidden"?: string | boolean;
      };
    }
  }
}

