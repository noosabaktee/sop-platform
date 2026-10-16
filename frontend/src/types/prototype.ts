export type { StateSnapshot, ServerUser } from "../api/moduleStateBridge";

export interface Snapshot {
  route: string;
  panel_id: string;
  rows: {
    __id: string;
    [key: string]: unknown;
  }[];
  version: number;
}

export interface BusinessRecord {
  id: string;
  company_id: string;
  route: string;
  view_key: string;
  table_index: number;
  fields: Record<string, unknown>;
  cells: string[];
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface RecordPayload {
  route: string;
  view_key: string;
  table_index: number;
  cells: string[];
  fields: Record<string, unknown>;
  status?: string;
  version?: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        icon?: string;
        noobserver?: boolean | string;
      };
    }
  }
}

