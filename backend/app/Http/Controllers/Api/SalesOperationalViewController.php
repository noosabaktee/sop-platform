<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Read-only projections from normalized tables, not independently maintained UI fixtures. */
class SalesOperationalViewController extends Controller {
    public function index(Request $request){
        $co=$request->user()->company_id;
        $invoices=DB::table('invoices as i')
            ->join('customers as c','c.id','=','i.customer_id')
            ->leftJoin('sales_orders as so','so.id','=','i.sales_order_id')
            ->where('i.company_id',$co)->orderByDesc('i.created_at')->limit(500)
            ->get(['i.id','i.number','i.amount','i.paid_amount','i.status','i.due_date',
                'c.name as customer','so.number as sales_order']);
        $payments=DB::table('payments as p')->join('invoices as i','i.id','=','p.invoice_id')
            ->join('customers as c','c.id','=','i.customer_id')->where('p.company_id',$co)
            ->orderByDesc('p.paid_at')->limit(500)->get(['p.id','p.number','p.amount','p.paid_at','p.reference',
                'i.number as invoice','c.name as customer']);
        // PostgreSQL NUMERIC arithmetic (not PHP float) protects AR from rounding drift.
        $receivables=DB::table('invoices as i')->join('customers as c','c.id','=','i.customer_id')
            ->leftJoin('sales_orders as so','so.id','=','i.sales_order_id')
            ->where('i.company_id',$co)->whereRaw('i.amount > i.paid_amount')
            ->orderBy('i.due_date')->limit(500)
            ->get(['i.id','i.number','i.amount','i.paid_amount','i.status','i.due_date',
                'c.name as customer','so.number as sales_order',
                DB::raw('(i.amount - i.paid_amount) as outstanding'),
                DB::raw('GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE),0) as days_overdue')]);
        return response()->json(['data'=>['invoices'=>$invoices,'payments'=>$payments,'receivables'=>$receivables]]);
    }
}
