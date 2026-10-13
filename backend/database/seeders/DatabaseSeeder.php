<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\Invoice;
use App\Models\BusinessRecord;
use Carbon\Carbon;
class DatabaseSeeder extends Seeder {
 private function put(string $table,array $key,array $values=[]):string{
  $existing=DB::table($table)->where($key)->value('id');if($existing)return (string)$existing;
  $id=(string)Str::ulid();DB::table($table)->insert(array_merge(['id'=>$id],$key,$values,['created_at'=>now(),'updated_at'=>now()]));return $id;
 }
 public function run():void{
  DB::transaction(function(){
   $company=Company::firstOrCreate(['code'=>'SOP-DEMO'],['name'=>'PT Sinergi Operasional Prima','currency'=>'IDR']);
   $user=User::firstOrCreate(['email'=>'admin@sop.local'],['company_id'=>$company->id,'name'=>'Aditya Pratama','password'=>env('SOP_SEED_PASSWORD','ChangeMe-2026!'),'role'=>'super_admin','is_active'=>true,'email_verified_at'=>now()]);
   foreach([['rina@sop.local','Rina Wijaya','sales'],['bagus@sop.local','Bagus Santoso','manager'],['sari@sop.local','Sari Putri','finance']] as [$email,$name,$role])User::firstOrCreate(['email'=>$email],['company_id'=>$company->id,'name'=>$name,'password'=>env('SOP_SEED_PASSWORD','ChangeMe-2026!'),'role'=>$role,'is_active'=>true,'email_verified_at'=>now()]);
   $customers=[];
   foreach(['PT Nusantara Teknologi','PT Telaga Biru','PT Mandiri Integrasi','PT Cakra Solusi','PT Delta Industri','PT Sentosa Digital'] as $i=>$name){$customers[]=Customer::firstOrCreate(['company_id'=>$company->id,'code'=>'CST-'.sprintf('%04d',$i+1)],['name'=>$name,'email'=>'purchasing'.($i+1).'@example.com','phone'=>'+6221555000'.($i+1),'status'=>'active']);}
   $vendors=[];foreach(['PT Prima Logistik','CV Mitra Elektrik','PT Sumber Komponen','PT Arta Sarana'] as $i=>$name)$vendors[]=$this->put('vendors',['company_id'=>$company->id,'code'=>'VEN-'.sprintf('%03d',$i+1)],['name'=>$name,'email'=>'sales'.($i+1).'@vendor.example','status'=>'active']);
   $products=[];foreach([['SOP-SRV-01','Implementasi ERP',95000000,45000000],['SOP-SRV-02','Jasa Integrasi Sistem',65000000,25000000],['HW-001','Industrial Controller',15000000,10000000],['HW-002','Scanner UHF',8000000,5000000],['SOP-SRV-03','Maintenance Tahunan',24000000,9000000]] as $i=>$item){[$sku,$name,$price,$cost]=$item;$products[]=$this->put('products',['company_id'=>$company->id,'sku'=>$sku],['name'=>$name,'standard_price'=>$price,'standard_cost'=>$cost,'unit'=>'unit']);}
   $warehouse=$this->put('warehouses',['company_id'=>$company->id,'code'=>'WH-MAIN'],['name'=>'Gudang Utama']);
   foreach($products as $i=>$product)$this->put('inventory_movements',['company_id'=>$company->id,'reference'=>'INIT-'.($i+1)],['product_id'=>$product,'warehouse_id'=>$warehouse,'actor_id'=>$user->id,'quantity'=>10+$i*3,'unit_cost'=>($i+1)*1000000,'movement_type'=>'opening','posted_at'=>now()]);
   foreach($customers as $i=>$customer){
    $lead=$this->put('leads',['company_id'=>$company->id,'email'=>'lead'.($i+1).'@example.com'],['owner_id'=>$user->id,'customer_id'=>$customer->id,'name'=>'Prospek '.$customer->name,'source'=>'Web','status'=>'qualified','score'=>70+$i]);
    $this->put('opportunities',['company_id'=>$company->id,'lead_id'=>$lead],['customer_id'=>$customer->id,'owner_id'=>$user->id,'name'=>'Digitalisasi '.$customer->name,'stage'=>'proposal','amount'=>125000000+$i*23000000,'probability'=>60+$i*4,'expected_close'=>today()->addDays(30+$i)]);
    $quote=Quotation::firstOrCreate(['company_id'=>$company->id,'number'=>'QT-2026-'.sprintf('%04d',$i+1)],['customer_id'=>$customer->id,'owner_id'=>$user->id,'status'=>$i%2?'sent':'approved','currency'=>'IDR','subtotal'=>100000000+$i*15000000,'tax'=>11000000+$i*1650000,'total'=>111000000+$i*16650000,'valid_until'=>today()->addDays(30)]);
    $this->put('quotation_items',['quotation_id'=>$quote->id,'description'=>'Implementasi ERP'],['product_id'=>$products[0],'quantity'=>1,'unit_price'=>100000000+$i*15000000,'discount'=>0,'line_total'=>100000000+$i*15000000]);
    $order=$this->put('sales_orders',['company_id'=>$company->id,'number'=>'SO-2026-'.sprintf('%04d',$i+1)],['quotation_id'=>$quote->id,'customer_id'=>$customer->id,'status'=>'confirmed','total'=>$quote->total]);
    $invoice=Invoice::firstOrCreate(['company_id'=>$company->id,'number'=>'INV-2026-'.sprintf('%04d',$i+1)],['sales_order_id'=>$order,'customer_id'=>$customer->id,'amount'=>$quote->total,'paid_amount'=>$i%2?50000000:0,'status'=>$i%2?'partial':'posted','due_date'=>today()->addDays(20+$i)]);
    if($i%2)$this->put('payments',['company_id'=>$company->id,'number'=>'PAY-2026-'.sprintf('%04d',$i+1)],['invoice_id'=>$invoice->id,'amount'=>50000000,'paid_at'=>today()->subDays(2),'reference'=>'BCA-TRX-'.$i]);
    $project=$this->put('projects',['company_id'=>$company->id,'code'=>'PRJ-2026-'.sprintf('%03d',$i+1)],['customer_id'=>$customer->id,'manager_id'=>$user->id,'name'=>'Implementasi ERP '.$customer->name,'status'=>'active','contract_value'=>$quote->total,'budget'=>50000000+$i*10000000,'started_at'=>today()->subDays(14),'due_at'=>today()->addDays(90+$i*10)]);
    $this->put('project_tasks',['project_id'=>$project,'title'=>'Requirement Analysis'],['assignee_id'=>$user->id,'status'=>'in_progress','progress'=>45+$i*8,'due_at'=>today()->addDays(7)]);
    $pr=$this->put('purchase_requests',['company_id'=>$company->id,'number'=>'PR-2026-'.sprintf('%04d',$i+1)],['requester_id'=>$user->id,'project_id'=>$project,'status'=>'approved','estimated_total'=>20000000+$i*3000000]);
    $this->put('purchase_orders',['company_id'=>$company->id,'number'=>'PO-2026-'.sprintf('%04d',$i+1)],['purchase_request_id'=>$pr,'vendor_id'=>$vendors[$i%count($vendors)],'status'=>'confirmed','total'=>20000000+$i*3000000]);
   }
   foreach([['1100','Cash','asset'],['1200','Accounts Receivable','asset'],['1300','Inventory','asset'],['2100','Accounts Payable','liability'],['2200','Goods Received Not Invoiced','liability'],['2300','Output VAT Payable','liability'],['4100','Revenue','income'],['5100','Cost of Sales','expense']] as [$code,$name,$type])$this->put('chart_of_accounts',['company_id'=>$company->id,'code'=>$code],['name'=>$name,'type'=>$type]);
   $journal=$this->put('journal_entries',['company_id'=>$company->id,'number'=>'JRN-2026-0001'],['posting_date'=>today(),'status'=>'posted','description'=>'Sample revenue recognition']);
   $ar=DB::table('chart_of_accounts')->where('company_id',$company->id)->where('code','1200')->value('id');$rev=DB::table('chart_of_accounts')->where('company_id',$company->id)->where('code','4100')->value('id');
   $this->put('journal_lines',['journal_entry_id'=>$journal,'account_id'=>$ar],['debit'=>111000000,'credit'=>0]);$this->put('journal_lines',['journal_entry_id'=>$journal,'account_id'=>$rev],['debit'=>0,'credit'=>111000000]);
   $this->seedViews($company->id,$user->id,$customers);
  });
 }
 private function seedViews(string $company,string $user,array $customers):void{
  $raw=json_decode(file_get_contents(__DIR__.'/data/prototype_seed.json'),true,512,JSON_THROW_ON_ERROR);
  foreach($raw as $key=>$view){$cols=$view['columns']??[];if(!$cols)continue;
   for($i=0;$i<4;$i++){
    $cells=[];foreach($cols as $col){$h=strtolower(trim((string)$col));$cells[]=$this->valueForColumn($h,$i,$customers,$view['route']);}
    $recordKey=['company_id'=>$company,'route'=>$view['route'],'view_key'=>(string)$view['view'],'table_index'=>(int)$view['table']];
    // Preserve repeatability by identifying the seed row inside JSON fields.
    $existing=BusinessRecord::where($recordKey)->where('fields->seed_index',$i)->first();
    if($existing)continue;
    $fields=['seed_index'=>$i,'label'=>$view['label']??''];foreach($cols as $j=>$col)$fields[trim((string)$col)?:'column_'.$j]=$cells[$j];
    BusinessRecord::create(array_merge($recordKey,['created_by'=>$user,'updated_by'=>$user,'cells'=>$cells,'fields'=>$fields,'status'=>'draft','version'=>1]));
   }
  }
 }
 private function valueForColumn(string $name,int $i,array $customers,string $route):string{
  $customer=$customers[$i%count($customers)];
  if($name===''||in_array($name,['aksi','action','actions'],true))return '';
  if(str_contains($name,'customer')||str_contains($name,'pelanggan')||str_contains($name,'perusahaan')||str_contains($name,'company'))return $customer->name;
  if(str_contains($name,'nama')||str_contains($name,'name')||str_contains($name,'lead')||str_contains($name,'prospect'))return ['Aditya Pratama','Rina Wijaya','Bagus Santoso','Sari Putri'][$i];
  if(str_contains($name,'project')||str_contains($name,'proyek'))return 'Implementasi ERP '.$customer->name;
  if(str_contains($name,'vendor'))return ['PT Prima Logistik','CV Mitra Elektrik','PT Arta Sarana','PT Sumber Komponen'][$i];
  if(str_contains($name,'item')||str_contains($name,'produk')||str_contains($name,'product'))return ['Implementasi ERP','Scanner UHF','Industrial Controller','Integrasi Sistem'][$i];
  if(str_contains($name,'email'))return 'user'.($i+1).'@example.com';
  if(str_contains($name,'nilai')||str_contains($name,'amount')||str_contains($name,'revenue')||str_contains($name,'total')||str_contains($name,'budget')||str_contains($name,'harga'))return 'Rp '.number_format(25000000+$i*17000000,0,',','.');
  if(str_contains($name,'nomor')||str_contains($name,'number')||str_contains($name,'kode')||str_contains($name,'no.'))return strtoupper(substr(trim($route,'/'),0,3)).'-2026-'.sprintf('%04d',$i+1);
  if(str_contains($name,'owner')||str_contains($name,'pemilik')||str_contains($name,'pic')||str_contains($name,'assignee'))return ['Aditya Pratama','Rina Wijaya','Bagus Santoso','Sari Putri'][$i];
  if(str_contains($name,'status')||str_contains($name,'health'))return ['Draft','Active','Pending','Approved'][$i];
  if(str_contains($name,'tanggal')||str_contains($name,'date')||str_contains($name,'due')||str_contains($name,'deadline')||str_contains($name,'mulai')||str_contains($name,'selesai'))return today()->addDays($i*7)->format('d M Y');
  if(str_contains($name,'progress')||str_contains($name,'score')||str_contains($name,'probability'))return (50+$i*10).'%';
  if(str_contains($name,'qty')||str_contains($name,'quantity')||str_contains($name,'stok'))return (string)(10+$i*5);
  if(str_contains($name,'priority')||str_contains($name,'prioritas'))return ['High','Medium','Low','Medium'][$i];
  return ['Aktif','Dalam proses','Menunggu review','Selesai'][$i];
 }
}
