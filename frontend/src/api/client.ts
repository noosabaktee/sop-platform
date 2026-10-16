import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type { BusinessRecord, RecordPayload } from "../types/prototype";

export type { BusinessRecord, RecordPayload };

// Clean up configured base URL
const configuredUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1):8000$/i.test(
  configuredUrl,
);

export const api = axios.create({
  baseURL: import.meta.env.DEV && isLocalApi ? "" : configuredUrl,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

type RetryableRequest = InternalAxiosRequestConfig & {
  _sopCsrfRetried?: boolean;
};

// Response interceptor to handle CSRF token refresh and expired sessions
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableRequest | undefined;

    // A tab that stayed open while Laravel restarted can retain an obsolete CSRF
    // token. Refresh it once and replay the original mutation transparently.
    if (
      error.response?.status === 419 &&
      request &&
      !request._sopCsrfRetried &&
      !String(request.url || "").includes("/sanctum/csrf-cookie")
    ) {
      request._sopCsrfRetried = true;
      await api.get("/sanctum/csrf-cookie");
      return api.request(request);
    }

    if (
      error.response?.status === 401 &&
      String(request?.url || "").includes("/api/v1/me")
    ) {
      try {
        sessionStorage.removeItem("sop_authenticated");
      } catch {}
      window.dispatchEvent(new Event("sop-session-expired"));
    }

    return Promise.reject(error);
  },
);

export async function csrf(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}

export async function listRecords(
  route: string,
  view: string,
  table: number,
): Promise<BusinessRecord[]> {
  const { data } = await api.get("/api/v1/records", {
    params: {
      route,
      view_key: view,
      table_index: table,
      per_page: 200,
    },
  });
  return (data.data || []) as BusinessRecord[];
}

export async function saveRecord(
  payload: RecordPayload,
  id?: string,
): Promise<BusinessRecord> {
  const { data } = id
    ? await api.put(`/api/v1/records/${id}`, payload)
    : await api.post("/api/v1/records", payload);
  return data.data as BusinessRecord;
}

export async function removeRecord(id: string): Promise<void> {
  await api.delete(`/api/v1/records/${id}`);
}

export async function getKpis(): Promise<Record<string, number>> {
  const { data } = await api.get("/api/v1/dashboard");
  return data.data as Record<string, number>;
}
