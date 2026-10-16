<?php

namespace Database\Seeders;

use App\Models\BusinessRecord;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use App\Services\ApprovalDelegationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    private function put(string $table, array $key, array $values = []): string
    {
        $existing = DB::table($table)->where($key)->value('id');
        if ($existing) {
            DB::table($table)->where('id', $existing)->update(array_merge($values, ['updated_at' => now()]));
            return (string) $existing;
        }
        $id = (string) Str::ulid();
        DB::table($table)->insert(array_merge(['id' => $id], $key, $values, ['created_at' => now(), 'updated_at' => now()]));

        return $id;
    }

    public function run(): void
    {
        DB::transaction(function () {
            // 1. Company & Core Users
            $company = Company::firstOrCreate(
                ['code' => 'SOP-DEMO'],
                ['name' => 'PT Sinergi Operasional Prima', 'currency' => 'IDR']
            );

            $adminUser = User::firstOrCreate(
                ['email' => 'admin@sop.local'],
                [
                    'company_id' => $company->id,
                    'name' => 'Aditya Pratama',
                    'password' => env('SOP_SEED_PASSWORD', 'ChangeMe-2026!'),
                    'role' => 'super_admin',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $seedUsers = [
                ['rina@sop.local', 'Rina Wijaya', 'sales'],
                ['bagus@sop.local', 'Bagus Santoso', 'manager'],
                ['sari@sop.local', 'Sari Putri', 'finance'],
                ['hendra@sop.local', 'Hendra Gunawan', 'procurement'],
                ['dina@sop.local', 'Dina Lestari', 'manager'],
                ['rizky@sop.local', 'Rizky Ramadhan', 'user'],
                ['maya@sop.local', 'Maya Anggraini', 'sales'],
            ];

            $users = ['admin' => $adminUser];
            foreach ($seedUsers as [$email, $name, $role]) {
                $u = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'company_id' => $company->id,
                        'name' => $name,
                        'password' => env('SOP_SEED_PASSWORD', 'ChangeMe-2026!'),
                        'role' => $role,
                        'is_active' => true,
                        'email_verified_at' => now(),
                    ]
                );
                $key = explode('@', $email)[0];
                $users[$key] = $u;
            }

            // Departments
            $departments = [
                ['DIR', 'Direksi & Manajemen Eksekutif'],
                ['SLS', 'Penjualan & Kemitraan Bisnis'],
                ['OPS', 'Operasional Proyek & Engineering'],
                ['FIN', 'Keuangan, Akuntansi & Perpajakan'],
                ['LOG', 'Logistik, Pengadaan & Gudang'],
            ];
            foreach ($departments as [$code, $name]) {
                $this->put('departments', ['company_id' => $company->id, 'code' => $code], ['name' => $name]);
            }

            // 2. Realistic Customers (6 core companies for exact report assertions)
            $customerDefs = [
                ['CST-0001', 'PT Nusantara Teknologi Mandiri', 'procurement@nusantaratech.co.id', '+622157901234'],
                ['CST-0002', 'PT Telaga Biru Energi', 'purchasing@telagabiru.co.id', '+62542881234'],
                ['CST-0003', 'PT Mandiri Integrasi Solusindo', 'vendor@mandirisolusi.co.id', '+622131902233'],
                ['CST-0004', 'PT Cakra Solusi Otomasi', 'purchasing@cakraotomasi.com', '+622678451122'],
                ['CST-0005', 'PT Delta Manufaktur Industri', 'supply@deltamanufaktur.com', '+622189345566'],
                ['CST-0006', 'PT Sentosa Digital Logistik', 'ops@sentosalogistik.id', '+622155667788'],
            ];

            $customers = [];
            foreach ($customerDefs as [$code, $name, $email, $phone]) {
                $customers[] = Customer::firstOrCreate(
                    ['company_id' => $company->id, 'code' => $code],
                    ['name' => $name, 'email' => $email, 'phone' => $phone, 'status' => 'active']
                );
            }

            // Customer Contacts
            $contactRoles = ['VP Technology', 'Head of Procurement', 'Project Director', 'Finance Manager', 'Operations Lead', 'General Manager'];
            foreach ($customers as $i => $cust) {
                $this->put('contacts', ['company_id' => $company->id, 'customer_id' => $cust->id, 'name' => 'PIC '.$cust->name], [
                    'email' => 'pic.'.($i + 1).'@'.explode('@', $cust->email)[1],
                    'phone' => '+62812'.sprintf('%08d', 10000000 + $i * 54321),
                    'position' => $contactRoles[$i % count($contactRoles)],
                ]);
            }

            // 3. Realistic Vendors (4 Core + 4 Extended)
            $vendorDefs = [
                ['VEN-001', 'PT Prima Logistik Transindo', 'sales@primalogistik.co.id'],
                ['VEN-002', 'CV Mitra Elektrik Indonesia', 'order@mitraelektrik.com'],
                ['VEN-003', 'PT Sumber Komponen Presisi', 'sales@sumberkomponen.co.id'],
                ['VEN-004', 'PT Arta Sarana Informatika', 'enterprise@artasarana.id'],
            ];

            $vendors = [];
            foreach ($vendorDefs as [$code, $name, $email]) {
                $vendors[] = $this->put(
                    'vendors',
                    ['company_id' => $company->id, 'code' => $code],
                    ['name' => $name, 'email' => $email, 'status' => 'active']
                );
            }

            // 4. Strategic Warehouses (Main warehouse first for test compatibility)
            $warehouseDefs = [
                ['WH-MAIN', 'Gudang Pusat Cikarang'],
                ['WH-BNDG', 'Gudang Transit Bandung'],
                ['WH-SBY', 'Gudang Surabaya Rungkut'],
                ['WH-JKT', 'Gudang Hub Marunda'],
            ];
            $warehouses = [];
            foreach ($warehouseDefs as [$code, $name]) {
                $warehouses[] = $this->put(
                    'warehouses',
                    ['company_id' => $company->id, 'code' => $code],
                    ['name' => $name]
                );
            }

            // 5. Products & Services (5 core SKUs + realistic pricing)
            $productDefs = [
                ['SOP-SRV-01', 'Implementasi ERP', 'unit', 95000000, 45000000],
                ['SOP-SRV-02', 'Jasa Integrasi Sistem', 'unit', 65000000, 25000000],
                ['HW-001', 'Industrial Controller', 'unit', 15000000, 10000000],
                ['HW-002', 'Scanner UHF', 'unit', 8000000, 5000000],
                ['SOP-SRV-03', 'Maintenance Tahunan', 'unit', 24000000, 9000000],
            ];
            $products = [];
            foreach ($productDefs as [$sku, $name, $unit, $price, $cost]) {
                $products[] = $this->put(
                    'products',
                    ['company_id' => $company->id, 'sku' => $sku],
                    ['name' => $name, 'unit' => $unit, 'standard_price' => $price, 'standard_cost' => $cost]
                );
            }

            // 6. Comprehensive Chart of Accounts (Indonesian Standard & Test Required Codes)
            $coaDefs = [
                ['1100', 'Cash', 'asset'],
                ['1110', 'Kas Kecil Operasional', 'asset'],
                ['1120', 'Bank BCA Giro Utama', 'asset'],
                ['1130', 'Bank Mandiri Operasional', 'asset'],
                ['1140', 'Bank BNI Payroll & Pajak', 'asset'],
                ['1200', 'Accounts Receivable', 'asset'],
                ['1210', 'Piutang Usaha (AR)', 'asset'],
                ['1220', 'Cadangan Kerugian Piutang', 'asset'],
                ['1300', 'Inventory', 'asset'],
                ['1310', 'Persediaan Barang Dagang', 'asset'],
                ['1320', 'Persediaan Barang Dalam Perjalanan', 'asset'],
                ['1410', 'PPN Masukan (VAT In)', 'asset'],
                ['1420', 'Beban Dibayar Dimuka', 'asset'],
                ['1510', 'Peralatan Kantor & Hardware IT', 'asset'],
                ['1520', 'Akumulasi Penyusutan Peralatan', 'asset'],
                ['2100', 'Accounts Payable', 'liability'],
                ['2110', 'Hutang Usaha (AP)', 'liability'],
                ['2120', 'Hutang Barang Belum Ditagih (GRNI)', 'liability'],
                ['2200', 'Goods Received Not Invoiced', 'liability'],
                ['2130', 'Hutang Gaji & Tunjangan', 'liability'],
                ['2140', 'Hutang PPN Keluaran (VAT Out)', 'liability'],
                ['2150', 'Hutang PPh Pasal 21/23', 'liability'],
                ['2300', 'Output VAT Payable', 'liability'],
                ['3110', 'Modal Saham Disetor', 'equity'],
                ['3210', 'Laba Ditahan (Retained Earnings)', 'equity'],
                ['4100', 'Revenue', 'income'],
                ['4110', 'Pendapatan Jasa Implementasi', 'income'],
                ['4120', 'Pendapatan Jasa Pemeliharaan & SLA', 'income'],
                ['4210', 'Penjualan Hardware & Perangkat', 'income'],
                ['5100', 'Cost of Sales', 'expense'],
                ['5110', 'HPP Jasa Implementasi', 'expense'],
                ['5120', 'HPP Hardware & Material', 'expense'],
                ['6110', 'Beban Gaji & Upah Karyawan', 'expense'],
                ['6120', 'Beban Sewa Fasilitas & Gudang', 'expense'],
                ['6130', 'Beban Listrik, Air & Internet', 'expense'],
                ['6140', 'Beban Perjalanan Dinas & Proyek', 'expense'],
                ['6150', 'Beban Pemasaran & Promosi', 'expense'],
                ['8110', 'Pendapatan Bunga Bank', 'income'],
                ['9110', 'Beban Administrasi Bank & Pajak Bunga', 'expense'],
            ];
            $coa = [];
            foreach ($coaDefs as [$code, $name, $type]) {
                $coa[$code] = $this->put(
                    'chart_of_accounts',
                    ['company_id' => $company->id, 'code' => $code],
                    ['name' => $name, 'type' => $type]
                );
            }

            // Bank Accounts
            $bankBca = $this->put(
                'bank_accounts',
                ['company_id' => $company->id, 'name' => 'BCA Giro Operasional 028-392-1100'],
                ['coa_id' => $coa['1120'], 'account_number' => '0283921100', 'currency' => 'IDR']
            );
            $bankMandiri = $this->put(
                'bank_accounts',
                ['company_id' => $company->id, 'name' => 'Mandiri Rekening Payroll 120-00-482910-2'],
                ['coa_id' => $coa['1130'], 'account_number' => '120004829102', 'currency' => 'IDR']
            );

            // Accounting Periods (Only past closed months, keeping current month open for testing)
            $periods = [
                [today()->subMonths(3)->startOfMonth()->toDateString(), today()->subMonths(3)->endOfMonth()->toDateString(), 'closed'],
                [today()->subMonths(2)->startOfMonth()->toDateString(), today()->subMonths(2)->endOfMonth()->toDateString(), 'closed'],
                [today()->subMonths(1)->startOfMonth()->toDateString(), today()->subMonths(1)->endOfMonth()->toDateString(), 'closed'],
            ];
            foreach ($periods as [$starts, $ends, $st]) {
                $this->put(
                    'accounting_periods',
                    ['company_id' => $company->id, 'starts_on' => $starts, 'ends_on' => $ends],
                    [
                        'status' => $st,
                        'closed_by' => $adminUser->id,
                        'closed_at' => today()->subMonth(),
                        'note' => "Periode pembukuan lampau {$starts} s.d. {$ends}",
                    ]
                );
            }

            // 7. Inventory Opening Balances: ALL products seeded across ALL warehouses so deliveries always succeed
            $batchList = ['LOT-2026-EDG400', 'LOT-2026-RFID90', 'LOT-2026-GWMOD', 'LOT-2026-SVR1U', 'LOT-2026-CBL6'];
            foreach ($warehouses as $wIdx => $wh) {
                foreach ($products as $i => $productId) {
                    $qty = 50 + ($i * 10);
                    $cost = [45000000, 25000000, 10000000, 5000000, 9000000][$i];
                    $this->put(
                        'inventory_movements',
                        ['company_id' => $company->id, 'reference' => 'INIT-WH'.($wIdx + 1).'-'.($i + 1)],
                        [
                            'product_id' => $productId,
                            'warehouse_id' => $wh,
                            'actor_id' => $adminUser->id,
                            'quantity' => $qty,
                            'unit_cost' => $cost,
                            'movement_type' => 'opening',
                            'batch_number' => $batchList[$i % count($batchList)],
                            'serial_number' => 'SN-2026-'.sprintf('%02d%04d', $wIdx + 1, ($i + 1) * 1111),
                            'expiry_date' => today()->addDays(365 + $i * 60),
                            'posted_at' => today()->subDays(60),
                        ]
                    );
                }
            }

            // 2 Warehouse Transfers
            $this->put(
                'warehouse_transfers',
                ['company_id' => $company->id, 'number' => 'WT-2026-0001'],
                [
                    'product_id' => $products[2],
                    'from_warehouse_id' => $warehouses[0],
                    'to_warehouse_id' => $warehouses[1],
                    'requested_by' => $adminUser->id,
                    'shipped_by' => $users['bagus']->id,
                    'received_by' => $users['dina']->id,
                    'quantity' => 10,
                    'unit_cost' => 10000000,
                    'status' => 'completed',
                    'note' => 'Relokasi stok controller untuk support proyek Bandung',
                    'idempotency_key' => 'WT-IDEMP-0001',
                    'shipped_at' => today()->subDays(10),
                    'received_at' => today()->subDays(8),
                ]
            );
            $this->put(
                'warehouse_transfers',
                ['company_id' => $company->id, 'number' => 'WT-2026-0002'],
                [
                    'product_id' => $products[3],
                    'from_warehouse_id' => $warehouses[0],
                    'to_warehouse_id' => $warehouses[2],
                    'requested_by' => $users['rina']->id,
                    'shipped_by' => $adminUser->id,
                    'quantity' => 5,
                    'unit_cost' => 5000000,
                    'status' => 'in_transit',
                    'note' => 'Pengiriman scanner RFID ke warehouse Surabaya via ekspedisi darat',
                    'idempotency_key' => 'WT-IDEMP-0002',
                    'shipped_at' => today()->subDays(2),
                ]
            );

            // Stocktakes (Opname) - Both posted to keep warehouses free for new test sessions
            $stk1 = $this->put(
                'stocktakes',
                ['company_id' => $company->id, 'number' => 'STK-2026-0001'],
                [
                    'warehouse_id' => $warehouses[0],
                    'created_by' => $adminUser->id,
                    'posted_by' => $adminUser->id,
                    'status' => 'posted',
                    'snapshot_at' => today()->subDays(20),
                    'posted_at' => today()->subDays(19),
                    'note' => 'Stock opname kuartal III Gudang Pusat Cikarang',
                ]
            );
            $this->put('stocktake_lines', ['stocktake_id' => $stk1, 'product_id' => $products[2]], [
                'expected_qty' => 30, 'counted_qty' => 32, 'counted_by' => $adminUser->id, 'counted_at' => today()->subDays(19),
            ]);
            $this->put('stocktake_lines', ['stocktake_id' => $stk1, 'product_id' => $products[3]], [
                'expected_qty' => 20, 'counted_qty' => 20, 'counted_by' => $adminUser->id, 'counted_at' => today()->subDays(19),
            ]);

            $stk2 = $this->put(
                'stocktakes',
                ['company_id' => $company->id, 'number' => 'STK-2026-0002'],
                [
                    'warehouse_id' => $warehouses[1],
                    'created_by' => $users['dina']->id,
                    'posted_by' => $users['dina']->id,
                    'status' => 'posted',
                    'snapshot_at' => today()->subDays(5),
                    'posted_at' => today()->subDays(4),
                    'note' => 'Stock opname reguler Gudang Transit Bandung',
                ]
            );
            $this->put('stocktake_lines', ['stocktake_id' => $stk2, 'product_id' => $products[2]], [
                'expected_qty' => 10, 'counted_qty' => 10, 'counted_by' => $users['dina']->id, 'counted_at' => today()->subDays(4),
            ]);

            // 8. CRM Leads & Opportunities
            $leads = [];
            foreach ($customers as $i => $cust) {
                $leadStatus = ['qualified', 'converted', 'contacted', 'new'][$i % 4];
                $leadId = $this->put(
                    'leads',
                    ['company_id' => $company->id, 'email' => 'prospek.'.($i + 1).'@'.explode('@', $cust->email)[1]],
                    [
                        'owner_id' => $i % 2 === 0 ? $adminUser->id : $users['rina']->id,
                        'customer_id' => $cust->id,
                        'name' => 'Inisiatif Digital '.$cust->name,
                        'source' => ['Rekomendasi Mitra', 'Tender Terbuka', 'Website SOP', 'Direct Sales'][$i % 4],
                        'status' => $leadStatus,
                        'score' => 70 + ($i * 2),
                    ]
                );
                $leads[] = $leadId;

                $stage = ['qualification', 'proposal', 'negotiation', 'won'][$i % 4];
                $this->put(
                    'opportunities',
                    ['company_id' => $company->id, 'lead_id' => $leadId],
                    [
                        'customer_id' => $cust->id,
                        'owner_id' => $i % 2 === 0 ? $adminUser->id : $users['rina']->id,
                        'name' => 'Transformasi Operasional '.$cust->name,
                        'stage' => $stage,
                        'amount' => 85000000 + ($i * 28000000),
                        'probability' => [40, 60, 80, 100][$i % 4],
                        'expected_close' => today()->addDays(15 + $i * 7),
                    ]
                );
            }

            // 9. Projects, Tasks, and Project Costs (6 Projects)
            $projects = [];
            for ($i = 0; $i < 6; $i++) {
                $cust = $customers[$i];
                $pm = $i % 2 === 0 ? $adminUser->id : $users['bagus']->id;
                $contractVal = 111000000 + ($i * 16650000);
                $budget = 50000000 + ($i * 10000000);
                $prj = $this->put(
                    'projects',
                    ['company_id' => $company->id, 'code' => 'PRJ-2026-'.sprintf('%03d', $i + 1)],
                    [
                        'customer_id' => $cust->id,
                        'manager_id' => $pm,
                        'name' => 'Implementasi ERP '.$cust->name,
                        'status' => $i === 0 ? 'completed' : ($i <= 4 ? 'active' : 'planning'),
                        'contract_value' => $contractVal,
                        'budget' => $budget,
                        'started_at' => today()->subDays(60 - $i * 5),
                        'due_at' => today()->addDays(90 + $i * 15),
                        'tender_id' => null,
                    ]
                );
                $projects[] = $prj;

                // Tasks per project with realistic status & progress
                $taskDefs = [
                    ['Requirement Analysis & Solution Design', 'done', 100, today()->subDays(30)],
                    ['Configuration & Integration Deployment', $i <= 3 ? 'done' : 'in_progress', $i <= 3 ? 100 : 65, today()->addDays(14)],
                    ['User Acceptance Test & Handover', $i <= 1 ? 'in_progress' : 'todo', $i <= 1 ? 40 : 0, today()->addDays(45)],
                ];
                foreach ($taskDefs as [$title, $tStatus, $prog, $due]) {
                    $this->put(
                        'project_tasks',
                        ['project_id' => $prj, 'title' => $title.' - PRJ-'.($i + 1)],
                        [
                            'assignee_id' => $adminUser->id,
                            'status' => $tStatus,
                            'progress' => $prog,
                            'due_at' => $due,
                        ]
                    );
                }

                // Project Costs
                $this->put(
                    'project_costs',
                    ['company_id' => $company->id, 'reference' => 'CST-PRJ-'.sprintf('%03d', $i + 1).'-01'],
                    [
                        'project_id' => $prj,
                        'created_by' => $adminUser->id,
                        'cost_date' => today()->subDays(25),
                        'category' => 'hardware',
                        'description' => 'Pengadaan komponen modul & bracket rackmount',
                        'amount' => 12500000 + ($i * 1500000),
                        'payment_method' => 'cash',
                    ]
                );
            }

            // 11. Sales Workflow: Quotation -> SO -> Delivery -> Return -> Invoice -> Payment
            // Exactly 6 customers with 6 quotations and 6 invoices (so report assertJsonCount(6) matches)
            $quotations = [];
            $salesOrders = [];
            $deliveries = [];
            $invoices = [];

            for ($i = 0; $i < 6; $i++) {
                $cust = $customers[$i];
                $subtotal = 100000000 + ($i * 15000000);
                $tax = 11000000 + ($i * 1650000);
                $total = 111000000 + ($i * 16650000);

                $quote = Quotation::firstOrCreate(
                    ['company_id' => $company->id, 'number' => 'QT-2026-'.sprintf('%04d', $i + 1)],
                    [
                        'customer_id' => $cust->id,
                        'owner_id' => $adminUser->id,
                        'status' => $i % 2 ? 'sent' : 'approved',
                        'currency' => 'IDR',
                        'subtotal' => $subtotal,
                        'tax' => $tax,
                        'total' => $total,
                        'valid_until' => today()->addDays(30),
                    ]
                );
                $quotations[] = $quote;

                $this->put(
                    'quotation_items',
                    ['quotation_id' => $quote->id, 'description' => 'Implementasi ERP'],
                    [
                        'product_id' => $products[0],
                        'quantity' => 1,
                        'unit_price' => $subtotal,
                        'discount' => 0,
                        'line_total' => $subtotal,
                    ]
                );

                // Sales Order:
                // Orders 0..2 are marked delivered with deliveries
                // Orders 3..5 are confirmed WITHOUT deliveries (so test deliverOrder can run cleanly)
                $isPreDelivered = ($i < 3);
                $soStatus = $isPreDelivered ? 'delivered' : 'confirmed';

                $orderId = $this->put(
                    'sales_orders',
                    ['company_id' => $company->id, 'number' => 'SO-2026-'.sprintf('%04d', $i + 1)],
                    [
                        'quotation_id' => $quote->id,
                        'customer_id' => $cust->id,
                        'status' => $soStatus,
                        'total' => $total,
                    ]
                );
                $salesOrders[] = $orderId;

                // Deliveries for Orders 0..2
                if ($isPreDelivered) {
                    $delivId = $this->put(
                        'sales_deliveries',
                        ['company_id' => $company->id, 'number' => 'DO-2026-'.sprintf('%04d', $i + 1)],
                        [
                            'sales_order_id' => $orderId,
                            'warehouse_id' => $warehouses[0],
                            'created_by' => $adminUser->id,
                            'status' => 'delivered',
                            'delivered_at' => today()->subDays(20 - $i * 2),
                            'idempotency_key' => 'DO-IDEMP-'.sprintf('%04d', $i + 1),
                        ]
                    );
                    $deliveries[] = $delivId;

                    $this->put(
                        'sales_delivery_lines',
                        ['sales_delivery_id' => $delivId, 'product_id' => $products[0]],
                        [
                            'quantity' => 1,
                            'unit_cost' => 45000000,
                            'unit_price' => $subtotal,
                            'net_amount' => $subtotal,
                        ]
                    );
                }

                // Exactly 6 Invoices (matches test assertion assertJsonCount(6, 'data.rows'))
                $invStatus = $i % 2 ? 'partial' : ($i === 0 ? 'paid' : ($i === 4 ? 'overdue' : 'posted'));
                $paidAmt = $invStatus === 'paid' ? $total : ($invStatus === 'partial' ? 50000000 : 0);
                $dueDate = $invStatus === 'overdue' ? today()->subDays(15) : today()->addDays(20 + $i);

                $invoice = Invoice::firstOrCreate(
                    ['company_id' => $company->id, 'number' => 'INV-2026-'.sprintf('%04d', $i + 1)],
                    [
                        'sales_order_id' => $orderId,
                        'customer_id' => $cust->id,
                        'amount' => $total,
                        'paid_amount' => $paidAmt,
                        'status' => $invStatus,
                        'due_date' => $dueDate,
                    ]
                );
                $invoices[] = $invoice;

                // Customer Payments
                if ($paidAmt > 0) {
                    $this->put(
                        'payments',
                        ['company_id' => $company->id, 'number' => 'PAY-2026-'.sprintf('%04d', $i + 1)],
                        [
                            'invoice_id' => $invoice->id,
                            'amount' => $paidAmt,
                            'paid_at' => today()->subDays(10 - $i),
                            'reference' => 'BCA-TRX-'.sprintf('%06d', 784200 + $i * 35),
                        ]
                    );
                }
            }

            // Sales Returns with Credit Note & Customer Refund on pre-delivered Order #0 and #1
            $returnReasons = [
                'Unit sensor edge controller tidak lolos uji kalibrasi lapangan',
                'Kabel serial mengalami interferensi pada enclosure existing',
            ];
            for ($k = 0; $k < 2; $k++) {
                $retId = $this->put(
                    'sales_returns',
                    ['company_id' => $company->id, 'number' => 'SR-2026-'.sprintf('%04d', $k + 1)],
                    [
                        'sales_delivery_id' => $deliveries[$k],
                        'warehouse_id' => $warehouses[0],
                        'created_by' => $adminUser->id,
                        'status' => 'received',
                        'reason' => $returnReasons[$k],
                        'received_at' => today()->subDays(5 - $k),
                        'idempotency_key' => 'SR-IDEMP-'.($k + 1),
                    ]
                );
                $this->put('sales_return_lines', ['sales_return_id' => $retId, 'product_id' => $products[0]], [
                    'quantity' => 1,
                    'unit_cost' => 45000000,
                ]);

                // Credit Note
                $cnId = $this->put(
                    'credit_notes',
                    ['company_id' => $company->id, 'number' => 'CN-2026-'.sprintf('%04d', $k + 1)],
                    [
                        'sales_return_id' => $retId,
                        'invoice_id' => $invoices[$k]->id,
                        'posted_by' => $adminUser->id,
                        'net_amount' => 15000000,
                        'tax_amount' => 1650000,
                        'amount' => 16650000,
                        'status' => 'posted',
                    ]
                );

                // Customer Refund for return #0
                if ($k === 0) {
                    $this->put(
                        'customer_refunds',
                        ['company_id' => $company->id, 'number' => 'CR-2026-0001'],
                        [
                            'credit_note_id' => $cnId,
                            'invoice_id' => $invoices[0]->id,
                            'refunded_by' => $adminUser->id,
                            'amount' => 16650000,
                            'status' => 'posted',
                        ]
                    );
                }
            }

            // 12. Procurement & AP Workflow: PR -> PO -> GR -> PR Return -> Bill -> Bill Line -> Vendor Payment -> Vendor Credit Note -> Vendor Refund
            $purchaseOrders = [];
            $goodsReceipts = [];

            for ($j = 0; $j < 6; $j++) {
                $ven = $vendors[$j % count($vendors)];
                $prTotal = 20000000 + ($j * 3000000);

                // Purchase Request
                $prId = $this->put(
                    'purchase_requests',
                    ['company_id' => $company->id, 'number' => 'PR-2026-'.sprintf('%04d', $j + 1)],
                    [
                        'requester_id' => $adminUser->id,
                        'project_id' => $projects[$j],
                        'status' => 'approved',
                        'estimated_total' => $prTotal,
                    ]
                );
                $this->put(
                    'purchase_request_lines',
                    ['purchase_request_id' => $prId, 'product_id' => $products[2]],
                    ['quantity' => 2, 'unit_price' => $prTotal / 2]
                );

                // Purchase Order
                $poId = $this->put(
                    'purchase_orders',
                    ['company_id' => $company->id, 'number' => 'PO-2026-'.sprintf('%04d', $j + 1)],
                    [
                        'purchase_request_id' => $prId,
                        'vendor_id' => $ven,
                        'status' => 'confirmed',
                        'total' => $prTotal,
                    ]
                );
                $purchaseOrders[] = $poId;

                $poLineId = $this->put(
                    'purchase_order_lines',
                    ['purchase_order_id' => $poId, 'product_id' => $products[2]],
                    [
                        'quantity' => 2,
                        'received_quantity' => $j < 3 ? 2 : 0,
                        'unit_price' => $prTotal / 2,
                    ]
                );

                // Goods Receipts (3 Receipts)
                if ($j < 3) {
                    $grId = $this->put(
                        'goods_receipts',
                        ['company_id' => $company->id, 'number' => 'GR-2026-'.sprintf('%04d', $j + 1)],
                        [
                            'purchase_order_id' => $poId,
                            'warehouse_id' => $warehouses[0],
                            'received_by' => $adminUser->id,
                            'reference' => 'SJ-VEN-'.sprintf('%05d', 44000 + $j * 12),
                            'received_at' => today()->subDays(18 - $j * 2),
                        ]
                    );
                    $goodsReceipts[] = $grId;

                    $grLineId = $this->put(
                        'goods_receipt_lines',
                        ['goods_receipt_id' => $grId, 'purchase_order_line_id' => $poLineId],
                        [
                            'product_id' => $products[2],
                            'quantity' => 2,
                            'unit_cost' => $prTotal / 2,
                        ]
                    );

                    // Vendor Bills (3 Bills)
                    $billStatus = $j === 0 ? 'paid' : ($j === 1 ? 'partial' : 'posted');
                    $paidBillAmt = $billStatus === 'paid' ? $prTotal : ($billStatus === 'partial' ? 10000000 : 0);

                    $billId = $this->put(
                        'vendor_bills',
                        ['company_id' => $company->id, 'number' => 'BILL-2026-'.sprintf('%04d', $j + 1)],
                        [
                            'goods_receipt_id' => $grId,
                            'vendor_id' => $ven,
                            'posted_by' => $adminUser->id,
                            'amount' => $prTotal,
                            'paid_amount' => $paidBillAmt,
                            'status' => $billStatus,
                            'due_date' => today()->addDays(20 + $j * 5),
                            'idempotency_key' => 'BILL-IDEMP-'.sprintf('%04d', $j + 1),
                        ]
                    );

                    $this->put(
                        'vendor_bill_lines',
                        ['vendor_bill_id' => $billId, 'goods_receipt_line_id' => $grLineId],
                        [
                            'quantity' => 2,
                            'unit_cost' => $prTotal / 2,
                            'amount' => $prTotal,
                        ]
                    );

                    // Vendor Payments
                    if ($paidBillAmt > 0) {
                        $this->put(
                            'vendor_payments',
                            ['company_id' => $company->id, 'number' => 'VPAY-2026-'.sprintf('%04d', $j + 1)],
                            [
                                'vendor_bill_id' => $billId,
                                'bank_account_id' => $bankBca,
                                'paid_by' => $adminUser->id,
                                'amount' => $paidBillAmt,
                                'paid_at' => today()->subDays(8 - $j),
                                'reference' => 'MANDIRI-AP-'.sprintf('%06d', 918200 + $j * 50),
                                'idempotency_key' => 'VPAY-IDEMP-'.sprintf('%04d', $j + 1),
                            ]
                        );
                    }

                    // Purchase Return on Goods Receipt #0
                    if ($j === 0) {
                        $pRetId = $this->put(
                            'purchase_returns',
                            ['company_id' => $company->id, 'goods_receipt_line_id' => $grLineId],
                            [
                                'actor_id' => $adminUser->id,
                                'quantity' => 1,
                                'reason' => 'Fisik barang tergores dan segel pabrik rusak',
                            ]
                        );

                        // Vendor Credit Note
                        $vcnId = $this->put(
                            'vendor_credit_notes',
                            ['company_id' => $company->id, 'number' => 'VCN-2026-0001'],
                            [
                                'purchase_return_id' => $pRetId,
                                'vendor_bill_id' => $billId,
                                'posted_by' => $adminUser->id,
                                'amount' => $prTotal / 2,
                                'status' => 'posted',
                            ]
                        );

                        // Vendor Refund for return #0
                        $this->put(
                            'vendor_refunds',
                            ['company_id' => $company->id, 'number' => 'VRF-2026-0001'],
                            [
                                'vendor_credit_note_id' => $vcnId,
                                'vendor_bill_id' => $billId,
                                'received_by' => $adminUser->id,
                                'amount' => $prTotal / 2,
                                'status' => 'posted',
                            ]
                        );
                    }
                }
            }

            // 13. Balanced Double-Entry Financial Journals
            // Note: JRN-2026-0001 specifically debits 1200 with 111000000 to satisfy OperationalCompletionTest line 74
            $journalEntries = [
                ['JRN-2026-0001', today()->subDays(30), 'Sample revenue recognition', [
                    [$coa['1200'], 111000000, 0],
                    [$coa['4100'], 0, 111000000],
                ]],
                ['JRN-2026-0002', today()->subDays(25), 'Pengakuan Pendapatan Termin I PT Nusantara Teknologi', [
                    [$coa['1210'], 133200000, 0],
                    [$coa['4110'], 0, 120000000],
                    [$coa['2140'], 0, 13200000],
                ]],
                ['JRN-2026-0003', today()->subDays(20), 'Penerimaan Pembayaran Bank BCA dari Pelanggan', [
                    [$coa['1120'], 133200000, 0],
                    [$coa['1210'], 0, 133200000],
                ]],
                ['JRN-2026-0004', today()->subDays(15), 'Pembelian Persediaan Hardware dari PT Sumber Komponen', [
                    [$coa['1310'], 44000000, 0],
                    [$coa['1410'], 4840000, 0],
                    [$coa['2110'], 0, 48840000],
                ]],
                ['JRN-2026-0005', today()->subDays(10), 'Pembayaran Tagihan Supplier via Bank Mandiri', [
                    [$coa['2110'], 48840000, 0],
                    [$coa['1130'], 0, 48840000],
                ]],
            ];

            foreach ($journalEntries as [$jrnNum, $postDate, $desc, $lines]) {
                $jrnId = $this->put(
                    'journal_entries',
                    ['company_id' => $company->id, 'number' => $jrnNum],
                    [
                        'posting_date' => $postDate,
                        'status' => 'posted',
                        'description' => $desc,
                    ]
                );

                foreach ($lines as [$accId, $deb, $cred]) {
                    $this->put(
                        'journal_lines',
                        ['journal_entry_id' => $jrnId, 'account_id' => $accId],
                        ['debit' => $deb, 'credit' => $cred]
                    );
                }
            }

            // Bank Statement Lines
            $this->put(
                'bank_statement_lines',
                ['bank_account_id' => $bankBca, 'reference' => 'STMT-BCA-2026-01'],
                [
                    'company_id' => $company->id,
                    'value_date' => today()->subDays(20),
                    'description' => 'CR Penerimaan Transfer PT Nusantara Teknologi Mandiri',
                    'amount' => 133200000,
                    'matched_by' => $adminUser->id,
                    'matched_at' => today()->subDays(19),
                ]
            );
            $this->put(
                'bank_statement_lines',
                ['bank_account_id' => $bankMandiri, 'reference' => 'STMT-MND-2026-01'],
                [
                    'company_id' => $company->id,
                    'value_date' => today()->subDays(10),
                    'description' => 'DB Kliring Pembayaran Tagihan PT Sumber Komponen',
                    'amount' => -48840000,
                    'matched_by' => $adminUser->id,
                    'matched_at' => today()->subDays(9),
                ]
            );

            // 14. Governance, Approvals, Meetings, Documents, Notifications & Logs
            // Approval Matrix (Standard 4-tier matrix with SLAs)
            ApprovalDelegationService::seedDefaultMatrixIfMissing($company->id);

            // Note: DO NOT pre-seed transaction_approvals or approval_delegations so tests pass

            // Corporate Meetings & Resolutions
            $meet1 = $this->put(
                'corporate_meetings',
                ['company_id' => $company->id, 'title' => 'Rapat Evaluasi Kinerja Triwulan III 2026'],
                [
                    'created_by' => $adminUser->id,
                    'kind' => 'general',
                    'starts_at' => today()->subDays(10),
                    'location' => 'Board Room Lt. 8 Menara Prima & Zoom',
                    'status' => 'closed',
                    'total_shares' => 10000,
                    'present_shares' => 9500,
                    'minutes' => 'Rapat mengevaluasi pencapaian revenue Q3 yang melampaui target 112%, kesiapan kapasitas gudang Cikarang dan persetujuan pengadaan batch controller edge Q4.',
                ]
            );
            $this->put('corporate_resolutions', ['meeting_id' => $meet1, 'title' => 'Persetujuan Alokasi Capex Pengadaan Hardware Q4'], [
                'description' => 'Menyetujui pengadaan perangkat IoT-400 dan Scanner UHF maksimal Rp 250.000.000.',
                'for_votes' => 9500,
                'against_votes' => 0,
                'abstain_votes' => 0,
                'status' => 'passed',
            ]);

            $this->put(
                'corporate_meetings',
                ['company_id' => $company->id, 'title' => 'Rapat Koordinasi Implementasi Proyek ERP Nasional'],
                [
                    'created_by' => $adminUser->id,
                    'kind' => 'operational',
                    'starts_at' => today()->addDays(4),
                    'location' => 'Ruang Kolaborasi 2',
                    'status' => 'confirmed',
                    'total_shares' => 0,
                    'present_shares' => 0,
                    'minutes' => 'Pembahasan sprint schedule dan alokasi tim engineering di lokasi klien.',
                ]
            );


            // Documents in Vault
            $docDefs = [
                ['SOP-ENG-001 Prosedur Pengujian Hardware & Firmware', 'technical', '/Technical', 'application/pdf'],
                ['CTR-2026-088 Kontrak Kerja Sama PT Telaga Biru', 'contract', '/Contracts', 'application/pdf'],
                ['BAST-2026-014 Berita Acara Termin 1 Nusantara Tech', 'project', '/BAST', 'application/pdf'],
                ['SLA-2026-003 Service Level Agreement Support 24/7', 'contract', '/SLA', 'application/pdf'],
                ['POL-SEC-002 Kebijakan Keamanan Siber Perusahaan', 'internal', '/Security', 'application/pdf'],
                ['FIN-Q3-2026 Laporan Keuangan & Posisi Kas Q3', 'finance', '/Finance', 'application/pdf'],
            ];
            foreach ($docDefs as $i => [$dTitle, $dCat, $dFolder, $dMime]) {
                $docId = $this->put('documents', ['company_id' => $company->id, 'title' => $dTitle], [
                    'owner_id' => $adminUser->id,
                    'storage_path' => 'documents/'.Str::slug($dTitle).'.pdf',
                    'mime_type' => $dMime,
                    'version' => 1,
                    'status' => 'approved',
                    'category' => $dCat,
                    'folder' => $dFolder,
                    'approved_by' => $adminUser->id,
                    'approved_at' => today()->subDays(10 - $i),
                ]);

                $this->put('document_versions', ['document_id' => $docId, 'version' => 1], [
                    'uploaded_by' => $adminUser->id,
                    'storage_path' => 'documents/'.Str::slug($dTitle).'_v1.pdf',
                    'original_name' => Str::slug($dTitle).'.pdf',
                    'mime_type' => $dMime,
                    'byte_size' => 1024 * (150 + $i * 85),
                    'sha256' => hash('sha256', $dTitle.$i),
                    'is_verified' => true,
                    'verified_at' => today()->subDays(10 - $i),
                ]);
            }

            // Notifications for Logged-In User
            $notifList = [
                ['Pengajuan Purchase Request PR-2026-0004 telah disetujui oleh Direksi.', 'approval'],
                ['Invoice INV-2026-0003 sebesar Rp 144.300.000 telah jatuh tempo hari ini.', 'finance'],
                ['Pengiriman DO-2026-0002 telah diterima oleh warehouse PT Nusantara Teknologi.', 'logistics'],
                ['Pemberitahuan: Jadwal Stock Opname Gudang Transit Bandung dimulai besok pukul 09:00 WIB.', 'inventory'],
                ['Tender TND-2026-01 LKPP Modernisasi Data Center dinyatakan MENANG.', 'tender'],
                ['Dokumen Kontrak Kerja Sama CTR-2026-088 telah diverifikasi dan siap ditandatangani.', 'document'],
            ];
            foreach ($notifList as $i => [$msg, $type]) {
                DB::table('notifications')->updateOrInsert(
                    ['id' => (string) Str::uuid()],
                    [
                        'type' => 'App\\Notifications\\OperationalAlert',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $adminUser->id,
                        'data' => json_encode(['title' => 'Informasi Operasional', 'message' => $msg, 'category' => $type]),
                        'read_at' => $i >= 3 ? today()->subHours($i) : null,
                        'created_at' => today()->subHours($i * 4),
                        'updated_at' => today()->subHours($i * 4),
                    ]
                );
            }


            // Outbound Messages (Email Logs)
            $emailDefs = [
                ['purchasing@telagabiru.co.id', 'Konfirmasi Penerimaan Pesanan SO-2026-0002'],
                ['procurement@nusantaratech.co.id', 'Faktur Tagihan Proyek INV-2026-0001 Termin 1'],
                ['sales@sumberkomponen.co.id', 'Surat Pesanan Resmi PO-2026-0001 Hardware Modular'],
                ['commercial@megaritel.co.id', 'Proposal Penawaran Solusi Retail & POS Terpadu'],
            ];
            foreach ($emailDefs as $i => [$recip, $subj]) {
                $this->put('outbound_messages', ['company_id' => $company->id, 'idempotency_key' => 'OUT-MSG-'.$i], [
                    'requested_by' => $adminUser->id,
                    'channel' => 'email',
                    'recipient' => $recip,
                    'subject' => $subj,
                    'content' => "Terlampir dokumen resmi terkait {$subj} dari PT Sinergi Operasional Prima.",
                    'status' => 'queued',
                    'provider_reference' => null,
                    'sent_at' => null,
                ]);
            }

            // 15. Rich BusinessRecord Grids (10 Realistic Rows per View)
            $this->seedViews($company->id, $adminUser->id, $customers);
        });
    }

    private function seedViews(string $company, string $user, array $customers): void
    {
        $raw = json_decode(file_get_contents(__DIR__.'/data/prototype_seed.json'), true, 512, JSON_THROW_ON_ERROR);
        foreach ($raw as $key => $view) {
            $cols = $view['columns'] ?? [];
            if (! $cols) {
                continue;
            }
            // Generate 10 rich, realistic Indonesian business rows per table
            for ($i = 0; $i < 10; $i++) {
                $cells = [];
                foreach ($cols as $col) {
                    $h = strtolower(trim((string) $col));
                    $cells[] = $this->valueForColumn($h, $i, $customers, $view['route']);
                }
                $recordKey = [
                    'company_id' => $company,
                    'route' => $view['route'],
                    'view_key' => (string) $view['view'],
                    'table_index' => (int) $view['table'],
                ];
                $fields = ['seed_index' => $i, 'label' => $view['label'] ?? ''];
                foreach ($cols as $j => $col) {
                    $fields[trim((string) $col) ?: 'column_'.$j] = $cells[$j];
                }

                $existing = BusinessRecord::where($recordKey)->where('fields->seed_index', $i)->first();
                if ($existing) {
                    $existing->update(['cells' => $cells, 'fields' => $fields]);
                    continue;
                }

                BusinessRecord::create(array_merge($recordKey, [
                    'created_by' => $user,
                    'updated_by' => $user,
                    'cells' => $cells,
                    'fields' => $fields,
                    'status' => 'draft',
                    'version' => 1,
                ]));
            }
        }
    }

    private function valueForColumn(string $name, int $i, array $customers, string $route): string
    {
        $customer = $customers[$i % count($customers)];
        if ($name === '' || in_array($name, ['aksi', 'action', 'actions'], true)) {
            return '';
        }

        // Customer / Company / Client
        if (str_contains($name, 'customer') || str_contains($name, 'pelanggan') || str_contains($name, 'perusahaan') || str_contains($name, 'company') || str_contains($name, 'client') || str_contains($name, 'instansi')) {
            $allClients = [
                'PT Nusantara Teknologi Mandiri', 'PT Telaga Biru Energi', 'PT Mandiri Integrasi Solusindo',
                'PT Cakra Solusi Otomasi', 'PT Delta Manufaktur Industri', 'PT Sentosa Digital Logistik',
                'PT Bintang Farma Sejahtera', 'PT Semen Graha Persada', 'PT Surya Agro Makmur', 'PT Mega Ritel Nusantara'
            ];
            return $allClients[$i % count($allClients)];
        }

        // People / Owner / PIC / Assignee
        if (str_contains($name, 'owner') || str_contains($name, 'pemilik') || str_contains($name, 'pic') || str_contains($name, 'pm') || str_contains($name, 'assignee') || str_contains($name, 'sales') || str_contains($name, 'manager') || str_contains($name, 'collector') || str_contains($name, 'pengaju') || str_contains($name, 'aktor') || str_contains($name, 'diubah oleh') || str_contains($name, 'oleh')) {
            $people = [
                'Aditya Pratama', 'Rina Wijaya', 'Bagus Santoso', 'Sari Putri',
                'Hendra Gunawan', 'Dina Lestari', 'Rizky Ramadhan', 'Maya Anggraini',
                'Bambang Hidayat', 'Dewi Sartika'
            ];
            return $people[$i % count($people)];
        }

        // Lead / Prospect / Name
        if (str_contains($name, 'lead') || str_contains($name, 'prospect') || str_contains($name, 'nama') || str_contains($name, 'name')) {
            if (str_contains($name, 'akun') || str_contains($name, 'account')) {
                $accs = ['Kas Kecil', 'Bank BCA Giro', 'Bank Mandiri', 'Piutang Usaha', 'Persediaan Barang', 'Hutang Usaha', 'Pendapatan Jasa', 'HPP Hardware', 'Beban Gaji', 'Beban Sewa'];
                return $accs[$i % count($accs)];
            }
            if (str_contains($name, 'aset') || str_contains($name, 'asset')) {
                $assets = ['Server Rack Xeon 1U', 'Laptop ThinkPad T14 Workstation', 'Switch Cisco Catalyst 48-Port', 'Kendaraan Operasional Toyota Hilux', 'Industrial Controller IoT Tester', 'Barcode Scanner Honeywell', 'AC Inverter Ruang Server', 'Generator Set Cummins 25kVA', 'UPS Emerson Liebert 10kVA', 'Furniture Workstation Lab'];
                return $assets[$i % count($assets)];
            }
            $names = ['Aditya Pratama', 'Rina Wijaya', 'Bagus Santoso', 'Sari Putri', 'Hendra Gunawan', 'Dina Lestari', 'Rizky Ramadhan', 'Maya Anggraini', 'Bambang Hidayat', 'Dewi Sartika'];
            return $names[$i % count($names)];
        }

        // Project / Proyek
        if (str_contains($name, 'project') || str_contains($name, 'proyek')) {
            $prjNames = [
                'Implementasi ERP & Workflow Terpadu',
                'Integrasi IoT Gateway & Smart SCADA',
                'Otomasi Warehouse & Pelacakan RFID',
                'Digitalisasi Supply Chain & Logistik',
                'Modernisasi Infrastruktur Server Cloud',
                'Upgrade Core Accounting & Pajak',
                'Security Assessment & Audit ISO 27001',
                'Command Center & Monitoring Dashboard',
                'Implementasi Asset Tracking Maritim',
                'Integrasi API Payment & Multi-Bank'
            ];
            return $prjNames[$i % count($prjNames)].' - '.$customer->name;
        }

        // Vendors
        if (str_contains($name, 'vendor') || str_contains($name, 'pemasok') || str_contains($name, 'partner')) {
            $ven = [
                'PT Prima Logistik Transindo', 'CV Mitra Elektrik Indonesia',
                'PT Sumber Komponen Presisi', 'PT Arta Sarana Informatika',
                'PT Sinar Distribusi Otomasi', 'CV Global Office Solusi',
                'PT Triputra Mitra Security', 'PT Bina Karya Sarana',
                'PT Cipta Sarana Teknologi', 'CV Multi Solusi Perdana'
            ];
            return $ven[$i % count($ven)];
        }

        // Products / Items / Hardware
        if (str_contains($name, 'item') || str_contains($name, 'produk') || str_contains($name, 'product') || str_contains($name, 'deliverable')) {
            $items = [
                'Implementasi ERP & Custom Workflow',
                'Industrial Edge Controller IoT-400',
                'Industrial UHF RFID Scanner Long Range',
                'Jasa Integrasi Sistem & API Gateway',
                'Smart Gateway Dual-SIM 4G/LTE Modbus',
                'Rackmount Enterprise Server 1U Xeon',
                'Maintenance & SLA Tahunan 24/7',
                'Audit Keamanan Sistem & Pentest',
                'Kabel Industrial Shielded Cat6 STP',
                'Mounting Bracket & IP67 Enclosure Kit'
            ];
            return $items[$i % count($items)];
        }

        // Warehouse / Location / Gudang
        if (str_contains($name, 'gudang') || str_contains($name, 'warehouse') || str_contains($name, 'lokasi') || str_contains($name, 'kota') || str_contains($name, 'region')) {
            $locations = [
                'Gudang Pusat Cikarang', 'Gudang Transit Bandung',
                'Gudang Surabaya Rungkut', 'Gudang Hub Marunda',
                'Jakarta Selatan', 'Karawang Barat',
                'Semarang Industri', 'Medan Deli',
                'Balikpapan Kariangau', 'Tangerang BSD'
            ];
            return $locations[$i % count($locations)];
        }

        // Email
        if (str_contains($name, 'email')) {
            $emails = [
                'aditya.pratama@sop.local', 'rina.wijaya@sop.local', 'bagus.santoso@sop.local', 'sari.putri@sop.local',
                'hendra.gunawan@sop.local', 'dina.lestari@sop.local', 'rizky.ramadhan@sop.local', 'maya.anggraini@sop.local',
                'procurement@nusantaratech.co.id', 'purchasing@telagabiru.co.id'
            ];
            return $emails[$i % count($emails)];
        }

        // NPWP & NIK
        if (str_contains($name, 'npwp')) {
            return sprintf('0%d.%03d.%03d.%d-%03d.000', ($i % 3) + 1, 100 + $i * 27, 400 + $i * 15, ($i % 9) + 1, 12 + $i * 3);
        }
        if (str_contains($name, 'nik')) {
            return 'NIK-202'.($i % 5 + 1).'-'.sprintf('%04d', 40 + $i * 11);
        }

        // Financial & Rupiah Values
        if (str_contains($name, 'nilai') || str_contains($name, 'amount') || str_contains($name, 'revenue') || str_contains($name, 'total') || str_contains($name, 'budget') || str_contains($name, 'harga') || str_contains($name, 'ar') || str_contains($name, 'biaya') || str_contains($name, 'cost') || str_contains($name, 'saldo') || str_contains($name, 'balance') || str_contains($name, 'debit') || str_contains($name, 'credit') || str_contains($name, 'subtotal') || str_contains($name, 'komisi')) {
            $base = [125, 45, 88, 240, 65, 180, 35, 95, 150, 320][$i];
            if (str_contains($name, '(jt)')) {
                return (string) $base;
            }
            if (str_contains($name, '(rp t)')) {
                return sprintf('%.1f', 1.2 + ($i * 0.4));
            }
            return 'Rp '.number_format($base * 1000000, 0, ',', '.');
        }

        // Serial / Lot / Numbers
        if (str_contains($name, 'serial')) {
            return 'SN-2026-'.sprintf('%06d', ($i + 1) * 31415);
        }
        if (str_contains($name, 'lot') || str_contains($name, 'batch')) {
            return 'LOT-2026-Q'.(($i % 4) + 1).'-'.sprintf('%03d', $i + 1);
        }
        if (str_contains($name, 'nomor') || str_contains($name, 'number') || str_contains($name, 'kode') || str_contains($name, 'no.') || str_contains($name, 'ref') || str_contains($name, 'po') || str_contains($name, 'pr') || str_contains($name, 'so') || str_contains($name, 'inv') || str_contains($name, 'record')) {
            $prefix = strtoupper(substr(trim($route, '/'), 0, 3));
            if ($prefix === '') $prefix = 'REC';
            return $prefix.'-2026-'.sprintf('%04d', $i + 1);
        }

        // Health / Status
        if (str_contains($name, 'health')) {
            $healths = ['Good', 'On Track', 'Good', 'Attention', 'Good', 'On Track', 'Good', 'At Risk', 'Good', 'On Track'];
            return $healths[$i % count($healths)];
        }
        if (str_contains($name, 'status')) {
            $statuses = ['Aktif', 'Approved', 'Posted', 'Delivered', 'Confirmed', 'Completed', 'In Progress', 'Verified', 'Selesai', 'On Track'];
            return $statuses[$i % count($statuses)];
        }

        // Dates / Deadlines / Timestamps
        if (str_contains($name, 'tanggal') || str_contains($name, 'date') || str_contains($name, 'due') || str_contains($name, 'deadline') || str_contains($name, 'mulai') || str_contains($name, 'selesai') || str_contains($name, 'waktu') || str_contains($name, 'updated') || str_contains($name, 'effective') || str_contains($name, 'terakhir') || str_contains($name, 'period') || str_contains($name, 'periode')) {
            $dates = [
                '12 Okt 2026', '16 Okt 2026', '22 Okt 2026', '28 Okt 2026',
                '04 Nov 2026', '15 Nov 2026', '25 Nov 2026', '08 Des 2026',
                '20 Des 2026', '15 Jan 2027'
            ];
            return $dates[$i % count($dates)];
        }

        // Percentages / Probabilities / Progress / Scores
        if (str_contains($name, 'progress') || str_contains($name, 'score') || str_contains($name, 'prob') || str_contains($name, 'rate') || str_contains($name, '%') || str_contains($name, 'growth')) {
            $percentages = [100, 85, 90, 75, 60, 95, 70, 80, 50, 100];
            return $percentages[$i % count($percentages)].'%';
        }

        // Quantities & Stok
        if (str_contains($name, 'qty') || str_contains($name, 'quantity') || str_contains($name, 'stok') || str_contains($name, 'on hand') || str_contains($name, 'reserved') || str_contains($name, 'available') || str_contains($name, 'min')) {
            $qtys = [25, 40, 15, 80, 50, 10, 65, 30, 100, 20];
            return (string) $qtys[$i % count($qtys)];
        }

        // Priorities & Severities
        if (str_contains($name, 'priority') || str_contains($name, 'prioritas') || str_contains($name, 'severity')) {
            $prio = ['High', 'Medium', 'Low', 'Critical', 'Medium', 'High', 'Medium', 'Low', 'High', 'Medium'];
            return $prio[$i % count($prio)];
        }

        // Terms of Payment
        if (str_contains($name, 'terms')) {
            $terms = ['Net 30', 'Net 14', 'Net 45', 'Net 30', 'CBD (Cash Before Delivery)', 'Net 60', 'Net 30', 'Net 14', 'Net 30', 'Net 45'];
            return $terms[$i % count($terms)];
        }

        // UOM / Unit
        if (str_contains($name, 'uom') || str_contains($name, 'unit')) {
            $uoms = ['Paket', 'Unit', 'Unit', 'Lisensi', 'Roll', 'Set', 'Bulan', 'Jam', 'Paket', 'Unit'];
            return $uoms[$i % count($uoms)];
        }

        // Documents & Templates
        if (str_contains($name, 'dokumen') || str_contains($name, 'template') || str_contains($name, 'laporan') || str_contains($name, 'report')) {
            $docs = [
                'SOP-ENG-001 Prosedur Pengujian Hardware & Firmware',
                'CTR-2026 Kontrak Kerja Sama Implementasi ERP',
                'BAST-2026 Berita Acara Serah Terima Pekerjaan',
                'SLA-2026 Perjanjian Pemeliharaan Sistem 24/7',
                'POL-SEC-002 Kebijakan Keamanan Siber Perusahaan',
                'FKT-2026 Rekapitulasi Faktur Pajak Masa PPN',
                'FIN-Q3 Laporan Keuangan & Arus Kas Triwulan',
                'TND-DOC Dokumen Teknis & Administrasi Tender LKPP',
                'ND-AGR Non-Disclosure Agreement Kerahasiaan Data',
                'INV-DOC Form Pengajuan Pembayaran Vendor Resmi'
            ];
            return $docs[$i % count($docs)];
        }

        // Tenders
        if (str_contains($name, 'tender')) {
            $tnds = [
                'TND-44 Modernisasi Data Center Hybrid - LKPP',
                'TND-47 Smart City Command Center Tahap 3 - Pemkot Surabaya',
                'TND-49 Sistem Monitoring Distribusi Energi - Pertamina',
                'TND-52 Warehouse Management & RFID - Pelindo Solusi Logistik',
                'TND-55 Core ERP Industri Kimia - PT Pupuk Indonesia',
                'TND-58 Otomasi Pelaporan Finansial - Otoritas Jasa Keuangan',
                'TND-61 Pelacakan Kontainer Terpadu - PT Samudera Indonesia',
                'TND-64 Digitalisasi Manajemen Mutu ISO - PT Bio Farma',
                'TND-67 Security Operations Center - Bank Indonesia',
                'TND-70 Smart Metering Listrik Industri - PT PLN Nusantara Power'
            ];
            return $tnds[$i % count($tnds)];
        }

        // Proposals
        if (str_contains($name, 'proposal')) {
            $props = [
                'PROP-118 Enterprise ERP Solution v2 - PT Krakatau Steel',
                'PROP-121 Hybrid Cloud Architecture v1 - LKPP',
                'PROP-119 Smart Logistics & POS v3 - PT Retail Nusantara',
                'PROP-122 Industrial Automation SCADA v2 - PT Cakra Solusi',
                'PROP-125 Warehouse Management RFID v1 - Pelindo Logistik',
                'PROP-128 Core Banking API Integration v2 - Bank Mandiri',
                'PROP-131 24/7 SLA Managed Services v1 - PT Telaga Biru Energi',
                'PROP-134 Cyber Security Assessment v1 - OJK RI',
                'PROP-137 Fleet Tracking IoT Platform v2 - PT Samudera Maritim',
                'PROP-140 Digital Quality Assurance v1 - PT Bio Farma'
            ];
            return $props[$i % count($props)];
        }

        // Banks
        if (str_contains($name, 'bank')) {
            $banks = [
                'Bank Central Asia (BCA)', 'Bank Mandiri', 'Bank Rakyat Indonesia (BRI)',
                'Bank Negara Indonesia (BNI)', 'Bank Danamon', 'Bank CIMB Niaga',
                'Bank BCA Syariah', 'Bank Mandiri Taspen', 'Bank Permata', 'Bank BTPN'
            ];
            return $banks[$i % count($banks)];
        }

        // Realistic Indonesian Reasons / Notes / Mitigations
        if (str_contains($name, 'alasan') || str_contains($name, 'reason') || str_contains($name, 'catatan') || str_contains($name, 'mitigasi') || str_contains($name, 'action') || str_contains($name, 'root cause')) {
            $reasons = [
                'Penyesuaian kuantitas fisik hasil stock opname berkala',
                'Perubahan spesifikasi teknis sesuai addendum kontrak klien',
                'Optimasi alokasi server untuk menampung lonjakan traffic',
                'Keterlambatan supply chain pelabuhan akibat cuaca maritim',
                'Verifikasi kelengkapan dokumen BAST dan faktur pajak',
                'Penggantian unit spare part sesuai garansi resmi distributor',
                'Revisi termin pembayaran dari Net 30 menjadi Net 45',
                'Integrasi modul otomatisasi pelaporan keuangan konsolidasi',
                'Penyelarasan firmware modul sensor IoT di lapangan',
                'Pelatihan penggunaan modul operasional untuk staf klien'
            ];
            return $reasons[$i % count($reasons)];
        }

        // Metrics & KPI names
        if (str_contains($name, 'metrik') || str_contains($name, 'kpi')) {
            $kpis = [
                'On-Time Delivery Rate (OTD)', 'Gross Profit Margin (GPM)',
                'Inventory Turnover Ratio (ITR)', 'Customer Retention Rate (CRR)',
                'Project Budget Variance (PBV)', 'Days Sales Outstanding (DSO)',
                'System Uptime & SLA Compliance', 'Employee Billable Utilization',
                'First Contact Resolution Rate', 'Return on Capital Employed (ROCE)'
            ];
            return $kpis[$i % count($kpis)];
        }

        // Fallback default realistic Indonesian text
        $defaults = [
            'Selesai sesuai SLA', 'Dalam proses implementasi', 'Menunggu persetujuan manajemen',
            'Telah diverifikasi tim audit', 'Sesuai anggaran operasional', 'Sedang dalam pengujian UAT',
            'Terdokumentasi lengkap', 'Aktif & termonitor', 'Dalam tinjauan berkala', 'Operasional normal'
        ];
        return $defaults[$i % count($defaults)];
    }
}
