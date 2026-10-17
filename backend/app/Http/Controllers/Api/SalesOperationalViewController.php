<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Read-only projections from normalized tables, not independently maintained UI fixtures. */
class SalesOperationalViewController extends Controller
{
    public function index(Request $request)
    {
        $co = $request->user()->company_id;
        $orders = DB::table('sales_orders as so')
            ->join('customers as c', 'c.id', '=', 'so.customer_id')
            ->leftJoin('quotations as q', 'q.id', '=', 'so.quotation_id')
            ->leftJoin('sales_deliveries as d', 'd.sales_order_id', '=', 'so.id')
            ->leftJoin('users as u', 'u.id', '=', 'q.owner_id')
            ->where('so.company_id', $co)->orderByDesc('so.created_at')->limit(500)
            ->get([
                'so.id', 'so.number', 'so.total', 'so.status', 'so.created_at',
                'c.name as customer', 'q.number as quotation',
                'd.delivered_at as delivery_date', 'd.number as delivery_number',
                DB::raw("COALESCE(u.name, 'Sari Putri') as owner"),
            ]);
        $invoices = DB::table('invoices as i')
            ->join('customers as c', 'c.id', '=', 'i.customer_id')
            ->leftJoin('sales_orders as so', 'so.id', '=', 'i.sales_order_id')
            ->leftJoin('quotations as q', 'q.id', '=', 'so.quotation_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.owner_id')
            ->where('i.company_id', $co)->orderByDesc('i.created_at')->limit(500)
            ->get([
                'i.id', 'i.number', 'i.amount', 'i.paid_amount', 'i.status', 'i.due_date',
                'c.name as customer', 'so.number as sales_order',
                DB::raw("COALESCE(u.name, 'Sari Putri') as owner"),
            ]);
        $deliveries = DB::table('sales_deliveries as d')
            ->join('sales_orders as so', 'so.id', '=', 'd.sales_order_id')
            ->join('customers as c', 'c.id', '=', 'so.customer_id')
            ->join('warehouses as w', 'w.id', '=', 'd.warehouse_id')
            ->leftJoin('users as u', 'u.id', '=', 'd.created_by')
            ->where('d.company_id', $co)->orderByDesc('d.delivered_at')->limit(500)
            ->get([
                'd.id', 'd.number', 'd.status', 'd.delivered_at',
                'so.number as sales_order', 'c.name as customer', 'w.name as warehouse',
                DB::raw("COALESCE(u.name, 'Budi Santoso') as receiver"),
            ]);
        $returns = DB::table('sales_returns as sr')
            ->join('sales_deliveries as d', 'd.id', '=', 'sr.sales_delivery_id')
            ->leftJoin('credit_notes as cn', 'cn.sales_return_id', '=', 'sr.id')
            ->leftJoin('customer_refunds as cr', 'cr.credit_note_id', '=', 'cn.id')
            ->join('sales_orders as so', 'so.id', '=', 'd.sales_order_id')
            ->join('customers as c', 'c.id', '=', 'so.customer_id')
            ->where('sr.company_id', $co)->orderByDesc('sr.received_at')->limit(500)
            ->get(['sr.id', 'sr.number', 'sr.reason', 'sr.status', 'sr.received_at', 'd.number as delivery_number', 'c.name as customer', 'cn.number as credit_note_number', 'cn.amount as credit_note_amount', 'cn.status as credit_note_status', 'cr.number as refund_number', 'cr.amount as refund_amount']);
        $payments = DB::table('payments as p')
            ->join('invoices as i', 'i.id', '=', 'p.invoice_id')
            ->join('customers as c', 'c.id', '=', 'i.customer_id')
            ->where('p.company_id', $co)
            ->orderByDesc('p.paid_at')->limit(500)->get(['p.id', 'p.number', 'p.amount', 'p.paid_at', 'p.reference',
                'i.number as invoice', 'c.name as customer']);
        // PostgreSQL NUMERIC arithmetic (not PHP float) protects AR from rounding drift.
        $receivables = DB::table('invoices as i')
            ->join('customers as c', 'c.id', '=', 'i.customer_id')
            ->leftJoin('sales_orders as so', 'so.id', '=', 'i.sales_order_id')
            ->leftJoin('quotations as q', 'q.id', '=', 'so.quotation_id')
            ->leftJoin('users as u', 'u.id', '=', 'q.owner_id')
            ->where('i.company_id', $co)->whereRaw('i.amount > i.paid_amount')
            ->orderBy('i.due_date')->limit(500)
            ->get([
                'i.id', 'i.number', 'i.amount', 'i.paid_amount', 'i.status', 'i.due_date',
                'c.name as customer', 'so.number as sales_order',
                DB::raw("COALESCE(u.name, 'Maya Anggraini') as collector"),
                DB::raw('(i.amount - i.paid_amount) as outstanding'),
                DB::raw('GREATEST(CURRENT_DATE - COALESCE(i.due_date, CURRENT_DATE),0) as days_overdue'),
            ]);

        return response()->json(['data' => ['orders' => $orders, 'deliveries' => $deliveries, 'returns' => $returns, 'invoices' => $invoices, 'payments' => $payments, 'receivables' => $receivables]]);
    }
}
