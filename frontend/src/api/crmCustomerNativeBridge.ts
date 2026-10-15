import {api} from './client';
import type {GridBridge} from './gridBridge';

type Customer={id:string;name:string;status:string;revenue:string;outstanding_ar:string};
const label=(value:string)=>value.replace(/\b\w/g,letter=>letter.toUpperCase());

/** Customer 360 grid is a read-only projection of master data and AR. */
export class CrmCustomerNativeBridge {
 constructor(private readonly grid:GridBridge){}
 install(){void this.refresh()}
 async refresh(){
  const customers=(await api.get('/api/v1/operational/crm/customers')).data.data as Customer[];
  this.grid.mergeDomainRows('/crm-sales','customers','db-',customers.map(customer=>({
   __id:'db-'+customer.id,name:customer.name,segment:'—',contacts:'—',
   revenue:Number(customer.revenue)/1_000_000,ar:Number(customer.outstanding_ar)/1_000_000,status:label(customer.status)
  })));
 }
}
