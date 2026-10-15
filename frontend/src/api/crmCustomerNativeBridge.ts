import {api} from './client';
import type {GridBridge} from './gridBridge';

type Customer={id:string;name:string;status:string;revenue:string;outstanding_ar:string};
type Opportunity={id:string;name:string;customer:string;owner:string|null;amount:string;probability:number;stage:string};
type History={customer_id:string;customer:string;quotations:number;orders:number;invoices:number;last_activity:string|null};
type Forecast={owner_id:string;owner:string;pipeline:string;commit:string;best:string;target:string};

const label=(value:string)=>value.replace(/\b\w/g,letter=>letter.toUpperCase());

/** Projects PostgreSQL domain customers, sales pipeline, transaction history, and forecast to CRM. */
export class CrmCustomerNativeBridge {
 private readonly onUpdate=()=>{void this.refresh().catch(console.error)};
 constructor(private readonly grid:GridBridge){}
 install(){
  window.addEventListener('sop:domain-updated',this.onUpdate);
  window.addEventListener('sop:workflow-updated',this.onUpdate);
  void this.refresh();
 }
 uninstall(){
  window.removeEventListener('sop:domain-updated',this.onUpdate);
  window.removeEventListener('sop:workflow-updated',this.onUpdate);
 }
 async refresh(){
  try {
   const [customersRes,oppsRes,histRes,fcRes]=await Promise.all([
    api.get('/api/v1/operational/crm/customers'),
    api.get('/api/v1/operational/crm/opportunities'),
    api.get('/api/v1/operational/crm/history'),
    api.get('/api/v1/operational/crm/forecast')
   ]);

   const customers=customersRes.data.data as Customer[];
   this.grid.mergeDomainRows('/crm-sales','customers','db-',customers.map(c=>({
    __id:'db-'+c.id,name:c.name,segment:'—',contacts:'—',
    revenue:Number(c.revenue)/1_000_000,ar:Number(c.outstanding_ar)/1_000_000,status:label(c.status)
   })));

   const opps=oppsRes.data.data as Opportunity[];
   this.grid.mergeDomainRows('/crm-sales','pipeline','db-',opps.map(o=>({
    __id:'db-'+o.id,name:o.name,customer:o.customer,stage:label(o.stage),
    value:Number(o.amount)/1_000_000,prob:o.probability,owner:o.owner||'—'
   })));

   const history=histRes.data.data as History[];
   this.grid.mergeDomainRows('/crm-sales','history','db-hist-',history.map(h=>({
    __id:'db-hist-'+h.customer_id,name:h.customer,quotations:Number(h.quotations),
    orders:Number(h.orders),invoices:Number(h.invoices),
    last:h.last_activity?new Date(h.last_activity).toLocaleDateString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'
   })));

   const forecast=fcRes.data.data as Forecast[];
   this.grid.mergeDomainRows('/crm-sales','forecast','db-fc-',forecast.map(f=>({
    __id:'db-fc-'+f.owner_id,owner:f.owner,pipeline:Number(f.pipeline),
    commit:Number(f.commit),best:Number(f.best),target:Number(f.target)
   })));
  } catch(error){
   console.error('CRM projection refresh error:',error);
  }
 }
}
