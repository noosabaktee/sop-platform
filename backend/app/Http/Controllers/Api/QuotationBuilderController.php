<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Server-authoritative quotation form; never trusts browser total or discount amounts. */
class QuotationBuilderController extends Controller {
    public function options(Request $request) {
        $co=$request->user()->company_id;
        return response()->json(['data'=>[
            'customers'=>DB::table('customers')->where('company_id',$co)->where('status','active')->orderBy('name')->get(['id','name','code']),
            'owners'=>DB::table('users')->where('company_id',$co)->where('is_active',true)->orderBy('name')->get(['id','name']),
            'products'=>DB::table('products')->where('company_id',$co)->where('is_active',true)->orderBy('name')->get(['id','name','sku','standard_price']),
        ]]);
    }
    private function cents(string $number): int {
        if(!preg_match('/^\d{1,12}(?:\.\d{1,2})?$/',$number))
            throw ValidationException::withMessages(['price'=>'Harga harus berupa bilangan nonnegatif (maksimal dua angka desimal).']);
        [$whole,$decimal]=array_pad(explode('.',$number,2),2,'');
        return ((int)$whole)*100 + (int)str_pad($decimal,2,'0');
    }
    private function money(int $cents): string {return sprintf('%d.%02d',intdiv($cents,100),$cents%100);}
    public function list(Request $request) {
        $co=$request->user()->company_id;
        $rows=DB::table('quotations as q')->join('customers as c','c.id','=','q.customer_id')
            ->join('users as u','u.id','=','q.owner_id')->where('q.company_id',$co)
            ->orderByDesc('q.created_at')->limit(500)
            ->get(['q.id','q.number','q.status','q.currency','q.total','q.valid_until','q.version',
                'c.name as customer','u.name as owner']);
        return response()->json(['data'=>$rows]);
    }
    public function save(Request $request) {
        abort_unless(in_array($request->user()->role,['super_admin','admin','manager','sales'],true),403,
            'Role ini tidak diizinkan membuat atau mengubah quotation.');
        $data=$request->validate([
            'id'=>['nullable','ulid'],
            'customer_id'=>['required','ulid',Rule::exists('customers','id')->where('company_id',$request->user()->company_id)],
            'owner_id'=>['nullable','ulid',Rule::exists('users','id')->where('company_id',$request->user()->company_id)],
            'contact_name'=>['nullable','string','max:255'],
            'payment_terms'=>['nullable','string','max:100'],
            'currency'=>['required',Rule::in(['IDR','USD'])],
            'valid_until'=>['required','date'],
            'tax_percent'=>['required','integer','between:0,100'],
            'discount_percent'=>['required','integer','between:0,100'],
            'items'=>['required','array','min:1','max:200'],
            'items.*.description'=>['required','string','max:255'],
            'items.*.product_id'=>['nullable','ulid',Rule::exists('products','id')->where('company_id',$request->user()->company_id)],
            'items.*.quantity'=>['required','integer','min:1','max:10000'],
            'items.*.unit_price'=>['required','numeric','min:0','max:10000000000','decimal:0,2'],
        ]);
        $co=$request->user()->company_id;
        // Totals calculated exactly in integer cents; no float tax/discount drift.
        $items=[];$subtotal=0;
        foreach($data['items'] as $line){
            $unit=$this->cents((string)$line['unit_price']);
            $lineTotal=$unit*(int)$line['quantity'];
            if($lineTotal>9000000000000000 || $subtotal+$lineTotal>9000000000000000)
                throw ValidationException::withMessages(['items'=>'Nilai quotation terlalu besar.']);
            $subtotal+=$lineTotal;
            $items[]=['product_id'=>$line['product_id']??null,'description'=>$line['description'],'quantity'=>$line['quantity'],
                'unit_price'=>$this->money($unit),'line_total'=>$this->money($lineTotal),'discount'=>'0.00'];
        }
        if($subtotal===0)throw ValidationException::withMessages(['items'=>'Total quotation harus lebih dari nol.']);
        $discount=intdiv($subtotal*(int)$data['discount_percent'],100);
        $tax=intdiv(($subtotal-$discount)*(int)$data['tax_percent'],100);
        $total=$subtotal-$discount+$tax;
        return DB::transaction(function() use ($request,$data,$co,$items,$subtotal,$discount,$tax,$total) {
            $id=$data['id']??(string)Str::ulid();
            $previous=null;
            if(!empty($data['id'])){
                $previous=DB::table('quotations')->where('company_id',$co)->where('id',$id)->lockForUpdate()->first();
                abort_unless($previous,404);
                abort_unless(in_array($previous->status,['draft','rejected','revision_requested'],true),409,'Quotation yang telah disubmit tidak boleh diedit langsung.');
            }
            $values=['customer_id'=>$data['customer_id'],'owner_id'=>$data['owner_id']??$request->user()->id,
                'contact_name'=>$data['contact_name']??null,'payment_terms'=>$data['payment_terms']??null,
                'currency'=>$data['currency'],'valid_until'=>$data['valid_until'],
                'subtotal'=>$this->money($subtotal),'discount_total'=>$this->money($discount),
                'tax'=>$this->money($tax),'total'=>$this->money($total),'updated_at'=>now()];
            if($previous){
                DB::table('quotations')->where('id',$id)->update($values+['status'=>'draft','version'=>$previous->version+1]);
                DB::table('quotation_items')->where('quotation_id',$id)->delete();
            }else{
                DB::table('quotations')->insert(['id'=>$id,'company_id'=>$co,'number'=>'Q-'.now()->format('Y').'-'.strtoupper((string)Str::ulid()),
                    'status'=>'draft','version'=>1,'created_at'=>now()]+$values);
            }
            $now=now();
            DB::table('quotation_items')->insert(array_map(fn($it)=>$it+['id'=>(string)Str::ulid(),
                'quotation_id'=>$id,'created_at'=>$now,'updated_at'=>$now],$items));
            AuditService::record($request->user(),$previous?'quotation.draft.updated':'quotation.draft.created',
                'quotation',$id,$previous?['total'=>$previous->total,'status'=>$previous->status]:null,
                ['total'=>$this->money($total),'item_count'=>count($items)]);
            return response()->json(['data'=>DB::table('quotations')->where('id',$id)->first()],$previous?200:201);
        });
    }

    public function show(Request $request, string $id) {
        $co = $request->user()->company_id;
        $quote = DB::table('quotations as q')
            ->join('customers as c', 'c.id', '=', 'q.customer_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.owner_id')
            ->where('q.company_id', $co)->where('q.id', $id)
            ->first([
                'q.*', 'c.name as customer_name', 'c.code as customer_code',
                'u.name as owner_name', 'u.email as owner_email'
            ]);
        abort_unless($quote, 404, 'Quotation tidak ditemukan.');
        $items = DB::table('quotation_items as qi')
            ->leftJoin('products as p', 'p.id', '=', 'qi.product_id')
            ->where('qi.quotation_id', $id)
            ->orderBy('qi.created_at')
            ->get(['qi.*', 'p.sku as product_sku', 'p.name as product_name']);
        $approvals = DB::table('transaction_approvals as ta')
            ->leftJoin('users as u', 'u.id', '=', 'ta.approver_id')
            ->where('ta.company_id', $co)
            ->where('ta.subject_type', 'quotation')
            ->where('ta.subject_id', $id)
            ->orderBy('ta.created_at')
            ->get(['ta.id', 'ta.status', 'ta.comment', 'ta.decided_at', 'u.name as approver_name']);
        return response()->json(['data' => [
            'quotation' => $quote,
            'items' => $items,
            'approvals' => $approvals,
        ]]);
    }

    public function revise(Request $request, string $id) {
        abort_unless(in_array($request->user()->role, ['super_admin','admin','manager','sales'], true), 403);
        $co = $request->user()->company_id;
        return DB::transaction(function() use ($request, $co, $id) {
            $old = DB::table('quotations')->where('company_id', $co)->where('id', $id)->first();
            abort_unless($old, 404, 'Quotation tidak ditemukan.');
            $items = DB::table('quotation_items')->where('quotation_id', $id)->get();
            abort_unless($items->isNotEmpty(), 422, 'Quotation sumber tidak memiliki item.');

            $newId = (string)Str::ulid();
            $newNumber = 'Q-'.now()->format('Y').'-'.strtoupper((string)Str::ulid());
            $now = now();
            DB::table('quotations')->insert([
                'id' => $newId,
                'company_id' => $co,
                'customer_id' => $old->customer_id,
                'owner_id' => $request->user()->id,
                'number' => $newNumber,
                'status' => 'draft',
                'currency' => $old->currency,
                'contact_name' => $old->contact_name,
                'payment_terms' => $old->payment_terms,
                'valid_until' => now()->addDays(30)->toDateString(),
                'subtotal' => $old->subtotal,
                'discount_total' => $old->discount_total,
                'tax' => $old->tax,
                'total' => $old->total,
                'version' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($items as $item) {
                DB::table('quotation_items')->insert([
                    'id' => (string)Str::ulid(),
                    'quotation_id' => $newId,
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                    'discount' => $item->discount,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            AuditService::record($request->user(), 'quotation.revised', 'quotation', $newId,
                ['source_quotation_id' => $id, 'source_number' => $old->number],
                ['number' => $newNumber, 'total' => $old->total]);

            return response()->json([
                'data' => DB::table('quotations')->where('id', $newId)->first(),
                'message' => 'Draft revisi dibuat dari '.$old->number
            ], 201);
        });
    }

    public function document(Request $request, string $id) {
        $co = $request->user()->company_id;
        $company = DB::table('companies')->where('id', $co)->first();
        abort_unless($company, 404);
        $quote = DB::table('quotations as q')
            ->join('customers as c', 'c.id', '=', 'q.customer_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.owner_id')
            ->where('q.company_id', $co)->where('q.id', $id)
            ->first([
                'q.*', 'c.name as customer_name', 'c.code as customer_code',
                'u.name as owner_name', 'u.email as owner_email'
            ]);
        abort_unless($quote, 404, 'Quotation tidak ditemukan.');
        $items = DB::table('quotation_items as qi')
            ->leftJoin('products as p', 'p.id', '=', 'qi.product_id')
            ->where('qi.quotation_id', $id)
            ->orderBy('qi.created_at')
            ->get(['qi.*', 'p.sku as product_sku', 'p.name as product_name']);
        $approval = DB::table('transaction_approvals as ta')
            ->leftJoin('users as u', 'u.id', '=', 'ta.approver_id')
            ->where('ta.company_id', $co)
            ->where('ta.subject_type', 'quotation')
            ->where('ta.subject_id', $id)
            ->where('ta.status', 'approved')
            ->latest('ta.decided_at')
            ->first(['ta.*', 'u.name as approver_name']);

        $fmtMoney = fn($val) => ($quote->currency === 'IDR' ? 'Rp ' : '$ ').number_format((float)$val, 2, ',', '.');
        $statusLabels = [
            'draft' => 'DRAFT',
            'pending_approval' => 'MENUNGGU APPROVAL',
            'approved' => 'DISETUJUI (APPROVED)',
            'rejected' => 'DITOLAK (REJECTED)',
            'revision_requested' => 'PERLU REVISI',
            'expired' => 'EXPIRED',
        ];
        $statusBadge = $statusLabels[$quote->status] ?? strtoupper($quote->status);

        $rowsHtml = '';
        foreach ($items as $idx => $line) {
            $num = $idx + 1;
            $desc = htmlspecialchars($line->description, ENT_QUOTES, 'UTF-8');
            $sku = $line->product_sku ? '<br><small style="color:#666;">SKU: '.htmlspecialchars($line->product_sku, ENT_QUOTES, 'UTF-8').'</small>' : '';
            $qty = number_format((float)$line->quantity, 0, ',', '.');
            $unitPrice = $fmtMoney($line->unit_price);
            $total = $fmtMoney($line->line_total);
            $rowsHtml .= "<tr>
                <td style=\"text-align:center;\">{$num}</td>
                <td><strong>{$desc}</strong>{$sku}</td>
                <td style=\"text-align:right;\">{$qty}</td>
                <td style=\"text-align:right;\">{$unitPrice}</td>
                <td style=\"text-align:right;\">{$total}</td>
            </tr>";
        }

        $subtotal = $fmtMoney($quote->subtotal);
        $discount = $fmtMoney($quote->discount_total);
        $tax = $fmtMoney($quote->tax);
        $grandTotal = $fmtMoney($quote->total);
        $dateCreated = date('d M Y', strtotime($quote->created_at));
        $validUntil = $quote->valid_until ? date('d M Y', strtotime($quote->valid_until)) : '-';
        $companyName = htmlspecialchars($company->name ?? 'SOP Platform', ENT_QUOTES, 'UTF-8');
        $customerName = htmlspecialchars($quote->customer_name, ENT_QUOTES, 'UTF-8');
        $contact = htmlspecialchars($quote->contact_name ?? '-', ENT_QUOTES, 'UTF-8');
        $terms = htmlspecialchars($quote->payment_terms ?? 'NET 30', ENT_QUOTES, 'UTF-8');
        $owner = htmlspecialchars($quote->owner_name ?? 'Sales Representative', ENT_QUOTES, 'UTF-8');
        $approver = $approval ? htmlspecialchars($approval->approver_name, ENT_QUOTES, 'UTF-8') : '—';
        $approvalDate = ($approval && $approval->decided_at) ? date('d M Y H:i', strtotime($approval->decided_at)) : '—';

        $html = "<!DOCTYPE html>
<html lang=\"id\">
<head>
<meta charset=\"utf-8\">
<title>Quotation {$quote->number}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #f8fafc; }
  .document { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
  .doc-brand h1 { margin: 0 0 4px 0; font-size: 24px; color: #0f172a; }
  .doc-brand p { margin: 0; color: #64748b; font-size: 14px; }
  .doc-title { text-align: right; }
  .doc-title h2 { margin: 0 0 4px 0; font-size: 28px; color: #2563eb; letter-spacing: 1px; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 14px; }
  .meta-box h3 { margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
  .meta-box p { margin: 3px 0; }
  table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
  table.items-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
  table.items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .summary-wrap { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .summary-table { width: 320px; font-size: 14px; border-collapse: collapse; }
  .summary-table td { padding: 6px 12px; }
  .summary-table tr.total-row { border-top: 2px solid #0f172a; font-weight: 700; font-size: 16px; color: #0f172a; }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; font-size: 13px; }
  .sign-box { border-top: 1px solid #cbd5e1; padding-top: 12px; }
  .actions-bar { max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 8px; }
  .btn-print { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
  @media print {
    body { background: #fff; padding: 0; }
    .document { box-shadow: none; padding: 0; max-width: 100%; }
    .actions-bar { display: none; }
  }
</style>
</head>
<body>
<div class=\"actions-bar\">
  <button type=\"button\" class=\"btn-print\" onclick=\"window.print()\">Cetak / Simpan PDF</button>
</div>
<div class=\"document\">
  <div class=\"doc-head\">
    <div class=\"doc-brand\">
      <h1>{$companyName}</h1>
      <p>Sistem Operasional Perusahaan</p>
    </div>
    <div class=\"doc-title\">
      <h2>QUOTATION</h2>
      <p><strong>{$quote->number}</strong> (v{$quote->version})</p>
      <span class=\"status-badge\">{$statusBadge}</span>
    </div>
  </div>

  <div class=\"meta-grid\">
    <div class=\"meta-box\">
      <h3>Kepada Customer</h3>
      <p><strong>{$customerName}</strong> ({$quote->customer_code})</p>
      <p>Kontak: {$contact}</p>
      <p>Syarat Pembayaran: {$terms}</p>
    </div>
    <div class=\"meta-box\" style=\"text-align:right;\">
      <h3>Informasi Penawaran</h3>
      <p>Tanggal: {$dateCreated}</p>
      <p>Berlaku Sampai: {$validUntil}</p>
      <p>Mata Uang: {$quote->currency}</p>
      <p>Sales PIC: {$owner}</p>
    </div>
  </div>

  <table class=\"items-table\">
    <thead>
      <tr>
        <th style=\"width:40px;text-align:center;\">No</th>
        <th>Deskripsi Item</th>
        <th style=\"width:70px;text-align:right;\">Qty</th>
        <th style=\"width:130px;text-align:right;\">Harga Satuan</th>
        <th style=\"width:140px;text-align:right;\">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {$rowsHtml}
    </tbody>
  </table>

  <div class=\"summary-wrap\">
    <table class=\"summary-table\">
      <tr><td>Subtotal</td><td style=\"text-align:right;\">{$subtotal}</td></tr>
      <tr><td>Diskon Total</td><td style=\"text-align:right;color:#dc2626;\">-{$discount}</td></tr>
      <tr><td>PPN (Tax)</td><td style=\"text-align:right;\">{$tax}</td></tr>
      <tr class=\"total-row\"><td>Grand Total</td><td style=\"text-align:right;\">{$grandTotal}</td></tr>
    </table>
  </div>

  <div class=\"sign-grid\">
    <div>
      <div style=\"height:60px;\"></div>
      <div class=\"sign-box\">
        <strong>{$owner}</strong><br>
        <span>Prepared by Sales</span>
      </div>
    </div>
    <div>
      <div style=\"height:60px;display:flex;align-items:flex-end;justify-content:center;\">
        ".($approval ? "<span style=\"color:#16a34a;font-weight:600;border:1px solid #16a34a;padding:2px 8px;border-radius:4px;font-size:11px;\">APPROVED {$approvalDate}</span>" : "")."
      </div>
      <div class=\"sign-box\">
        <strong>{$approver}</strong><br>
        <span>Approved by Manager</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>";

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
}
