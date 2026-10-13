import axios from 'axios';
import type {InternalAxiosRequestConfig} from 'axios';
// Requests already include /api or /sanctum. Strip a trailing /api from user env.
// In local development the Vite proxy keeps cookies same-origin, avoiding 419/401.
const configured=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/+$/,'').replace(/\/api$/,'');
const localApi=/^https?:\/\/(localhost|127\.0\.0\.1):8000$/i.test(configured);
export const api=axios.create({baseURL:import.meta.env.DEV && localApi?'':configured,
 withCredentials:true,withXSRFToken:true,xsrfCookieName:'XSRF-TOKEN',xsrfHeaderName:'X-XSRF-TOKEN',
 headers:{Accept:'application/json','X-Requested-With':'XMLHttpRequest'}});
type RetryableRequest=InternalAxiosRequestConfig&{_sopCsrfRetried?:boolean};
api.interceptors.response.use(r=>r, async error=>{
 const request=error.config as RetryableRequest|undefined;
 // A tab that stayed open while Laravel restarted can retain an obsolete CSRF
 // token. Refresh it once and replay the original mutation transparently.
 if(error.response?.status===419 && request && !request._sopCsrfRetried && !String(request.url||'').includes('/sanctum/csrf-cookie')){
  request._sopCsrfRetried=true;
  await api.get('/sanctum/csrf-cookie');
  return api.request(request);
 }
 if(error.response?.status===401 && location.pathname!=='/login') window.dispatchEvent(new Event('sop-session-expired'));
 return Promise.reject(error);
});
export type BusinessRecord={id:string;company_id:string;route:string;view_key:string;table_index:number;fields:Record<string,unknown>;cells:string[];status:string;version:number;created_at:string;updated_at:string};
export type RecordPayload={route:string;view_key:string;table_index:number;cells:string[];fields:Record<string,unknown>;status?:string;version?:number};
export async function csrf(){await api.get('/sanctum/csrf-cookie')}
export async function listRecords(route:string,view:string,table:number){const {data}=await api.get('/api/v1/records',{params:{route,view_key:view,table_index:table,per_page:200}});return (data.data || []) as BusinessRecord[]}
export async function saveRecord(payload:RecordPayload,id?:string){const {data}=id? await api.put(`/api/v1/records/${id}`,payload):await api.post('/api/v1/records',payload);return data.data as BusinessRecord}
export async function removeRecord(id:string){await api.delete(`/api/v1/records/${id}`)}
export async function getKpis(){const {data}=await api.get('/api/v1/dashboard');return data.data as Record<string,number>}
