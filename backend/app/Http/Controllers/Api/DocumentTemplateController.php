<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentTemplateController extends Controller
{
    private function company(Request $r): string
    {
        return (string) $r->user()->company_id;
    }

    private function defaultTemplates(): array
    {
        return [
            [
                'code' => 'quotation',
                'name' => 'Quotation Template',
                'category' => 'quotation',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'QUO-2026-0091',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => true,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Pembayaran NET 30 setelah invoice diterima. Harga belum termasuk pajak kecuali dinyatakan lain.',
                ],
            ],
            [
                'code' => 'invoice',
                'name' => 'Invoice Template',
                'category' => 'sales',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'INV-2026-0321',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => true,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Pembayaran ditransfer ke rekening bank resmi perusahaan. Jatuh tempo 30 hari.',
                ],
            ],
            [
                'code' => 'po',
                'name' => 'Purchase Order Template',
                'category' => 'purchase',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Sumber Tech',
                    'customerAddress' => 'Jl. Industri Raya No. 8, Jakarta',
                    'number' => 'PO-2026-0451',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => false,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Pengiriman barang maksimal 14 hari kerja setelah PO diterbitkan.',
                ],
            ],
            [
                'code' => 'so',
                'name' => 'Sales Order Template',
                'category' => 'sales',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'SO-2026-0148',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => true,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Pesanan penjualan mengikat setelah dikonfirmasi kedua belah pihak.',
                ],
            ],
            [
                'code' => 'bast',
                'name' => 'BAST Template',
                'category' => 'sales',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'BAST-2026-0021',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => false,
                    'discount' => false,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Pekerjaan dinyatakan selesai 100% dan diserahterimakan dalam kondisi baik.',
                ],
            ],
            [
                'code' => 'contract',
                'name' => 'Contract Template',
                'category' => 'company',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'CTR-2026-0012',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => false,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Perjanjian ini tunduk pada hukum yang berlaku di Republik Indonesia.',
                ],
            ],
            [
                'code' => 'proposal',
                'name' => 'Proposal Template',
                'category' => 'sales',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'PT Telaga Biru',
                    'customerAddress' => 'Jl. Gatot Subroto No. 5, Jakarta',
                    'number' => 'PROP-2026-0007',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => true,
                    'discount' => true,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Proposal berlaku selama 30 hari kalender sejak tanggal penyerahan.',
                ],
            ],
            [
                'code' => 'report',
                'name' => 'Report Template',
                'category' => 'finance',
                'variables' => [
                    'company' => 'PT Sinergi Operasional Prima',
                    'companyAddress' => 'Jl. Jend. Sudirman No. 1, Jakarta',
                    'companyTax' => 'NPWP 01.234.567.8-091.000',
                    'logo' => '',
                    'logoColor' => '#217346',
                    'customer' => 'Manajemen Eksekutif',
                    'customerAddress' => 'Kantor Pusat Jakarta',
                    'number' => 'RPT-2026-0031',
                    'date' => '09 Oktober 2026',
                    'validUntil' => '08 November 2026',
                    'tax' => false,
                    'discount' => false,
                    'terms' => true,
                    'signature' => true,
                    'locale' => 'id',
                    'termsText' => 'Laporan keuangan dan operasional disusun secara berkala sesuai standar akuntansi.',
                ],
            ],
        ];
    }

    private function ensureCompanyTemplates(string $co): void
    {
        $count = DB::table('document_templates')->where('company_id', $co)->count();
        if ($count > 0) {
            return;
        }

        $now = now();
        $defaults = $this->defaultTemplates();
        foreach ($defaults as $item) {
            DB::table('document_templates')->insert([
                'id' => (string) Str::ulid(),
                'company_id' => $co,
                'code' => $item['code'],
                'name' => $item['name'],
                'category' => $item['category'],
                'variables' => json_encode($item['variables']),
                'version' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function index(Request $r)
    {
        $co = $this->company($r);
        $this->ensureCompanyTemplates($co);

        $templates = DB::table('document_templates')
            ->where('company_id', $co)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get();

        $data = $templates->map(function ($item) {
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category,
                'version' => $item->version,
                'variables' => is_string($item->variables) ? json_decode($item->variables, true) : (array) $item->variables,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function save(Request $r)
    {
        $data = $r->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['nullable', 'string', 'max:150'],
            'variables' => ['required', 'array'],
        ]);

        $co = $this->company($r);
        $this->ensureCompanyTemplates($co);

        $tpl = DB::table('document_templates')
            ->where('company_id', $co)
            ->where('code', $data['code'])
            ->first();

        $now = now();
        if ($tpl) {
            $newVersion = $tpl->version + 1;
            DB::table('document_templates')->where('id', $tpl->id)->update([
                'name' => $data['name'] ?? $tpl->name,
                'variables' => json_encode($data['variables']),
                'version' => $newVersion,
                'updated_at' => $now,
            ]);
            $id = $tpl->id;
        } else {
            $id = (string) Str::ulid();
            $newVersion = 1;
            DB::table('document_templates')->insert([
                'id' => $id,
                'company_id' => $co,
                'code' => $data['code'],
                'name' => $data['name'] ?? ucfirst($data['code']).' Template',
                'category' => 'general',
                'variables' => json_encode($data['variables']),
                'version' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        AuditService::record(
            $r->user(),
            'document_template.saved',
            'document_template',
            $id,
            $tpl ? ['version' => $tpl->version] : null,
            ['code' => $data['code'], 'version' => $newVersion]
        );

        $saved = DB::table('document_templates')->find($id);

        return response()->json([
            'message' => "Template {$data['code']} berhasil disimpan sebagai versi {$newVersion}.",
            'data' => [
                'id' => $saved->id,
                'code' => $saved->code,
                'name' => $saved->name,
                'version' => $saved->version,
                'variables' => is_string($saved->variables) ? json_decode($saved->variables, true) : (array) $saved->variables,
                'updated_at' => $saved->updated_at,
            ],
        ]);
    }

    public function reset(Request $r, string $code)
    {
        $co = $this->company($r);
        $this->ensureCompanyTemplates($co);

        $defaults = collect($this->defaultTemplates())->firstWhere('code', $code);
        abort_unless($defaults, 404, "Template default untuk {$code} tidak ditemukan.");

        $tpl = DB::table('document_templates')
            ->where('company_id', $co)
            ->where('code', $code)
            ->first();

        $now = now();
        $newVersion = ($tpl->version ?? 1) + 1;

        if ($tpl) {
            DB::table('document_templates')->where('id', $tpl->id)->update([
                'variables' => json_encode($defaults['variables']),
                'version' => $newVersion,
                'updated_at' => $now,
            ]);
            $id = $tpl->id;
        } else {
            $id = (string) Str::ulid();
            DB::table('document_templates')->insert([
                'id' => $id,
                'company_id' => $co,
                'code' => $code,
                'name' => $defaults['name'],
                'category' => $defaults['category'],
                'variables' => json_encode($defaults['variables']),
                'version' => $newVersion,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        AuditService::record($r->user(), 'document_template.reset', 'document_template', $id, null, ['code' => $code, 'version' => $newVersion]);

        return response()->json([
            'message' => "Template variables {$code} direset ke default.",
            'data' => [
                'id' => $id,
                'code' => $code,
                'version' => $newVersion,
                'variables' => $defaults['variables'],
            ],
        ]);
    }

    public function render(Request $r, string $code)
    {
        $co = $this->company($r);
        $this->ensureCompanyTemplates($co);

        $tpl = DB::table('document_templates')
            ->where('company_id', $co)
            ->where(function ($q) use ($code) {
                $q->where('code', $code)->orWhere('id', $code);
            })
            ->first();

        abort_unless($tpl, 404, "Template {$code} tidak ditemukan.");

        $vars = is_string($tpl->variables) ? json_decode($tpl->variables, true) : (array) $tpl->variables;
        if ($r->has('variables') && is_array($r->input('variables'))) {
            $vars = array_merge($vars, $r->input('variables'));
        }

        $items = $r->input('items', [
            ['desc' => 'Lisensi software', 'qty' => 10, 'price' => 15000000],
            ['desc' => 'Jasa implementasi', 'qty' => 1, 'price' => 300000000],
            ['desc' => 'Training operasional', 'qty' => 3, 'price' => 10000000],
        ]);

        $locale = $vars['locale'] ?? 'id';
        $fmt = fn ($n) => 'Rp '.number_format((float) $n, 0, ',', '.');

        $subtotal = 0;
        $rowsHtml = '';
        foreach ($items as $it) {
            $lineTotal = (float) ($it['qty'] ?? 1) * (float) ($it['price'] ?? 0);
            $subtotal += $lineTotal;
            $rowsHtml .= '<tr><td>'.e($it['desc'] ?? '')."</td><td style='text-align:right'>".e($it['qty'] ?? 1)."</td><td style='text-align:right'>".$fmt($it['price'] ?? 0)."</td><td style='text-align:right'>".$fmt($lineTotal).'</td></tr>';
        }

        $hasDiscount = ! empty($vars['discount']);
        $hasTax = ! empty($vars['tax']);
        $discVal = $hasDiscount ? round($subtotal * 0.05) : 0;
        $taxVal = $hasTax ? round(($subtotal - $discVal) * 0.11) : 0;
        $total = $subtotal - $discVal + $taxVal;

        $number = $vars['number'] ?? ($tpl->code.'-'.date('Ymd-His'));
        $title = "{$tpl->name} - {$number}";

        $html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>".e($title).'</title>'
            .'<style>body{font-family:Inter,sans-serif;margin:40px;color:#1e293b;line-height:1.6}.head{display:flex;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}.brand{font-size:18px;font-weight:700}.parties{display:flex;justify-content:space-between;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:8px 12px}th{background:#f8fafc;text-align:left}.totals{margin-top:20px;float:right;width:300px}.totals .row{display:flex;justify-content:space-between;padding:4px 0}.totals .grand{font-weight:bold;border-top:2px solid #334155}.terms{margin-top:60px;font-size:13px;color:#64748b;clear:both}.sig{margin-top:40px;display:flex;justify-content:space-between}.sig div{text-align:center;width:200px}.sig .line{border-top:1px solid #000;margin-top:60px}</style>'
            .'</head><body>'
            ."<div class='head'>"
            ."  <div class='brand'><div>".e($vars['company'] ?? 'PT SOP')."</div><small style='font-weight:normal;color:#64748b'>".e($vars['companyAddress'] ?? '').' · '.e($vars['companyTax'] ?? '').'</small></div>'
            ."  <div style='text-align:right'><h2>".strtoupper(e($tpl->code)).'</h2><div><b>No: '.e($number).'</b></div><div>Tanggal: '.e($vars['date'] ?? date('d M Y')).'</div><div>Berlaku: '.e($vars['validUntil'] ?? '').'</div></div>'
            .'</div>'
            ."<div class='parties'>"
            .'  <div><small>Kepada / Bill To:</small><br><strong>'.e($vars['customer'] ?? '').'</strong><br>'.e($vars['customerAddress'] ?? '').'</div>'
            .'</div>';

        if (in_array($tpl->code, ['quotation', 'invoice', 'po', 'so'])) {
            $html .= "<table><thead><tr><th>Deskripsi</th><th style='text-align:right'>Qty</th><th style='text-align:right'>Harga Satuan</th><th style='text-align:right'>Jumlah</th></tr></thead><tbody>"
                .$rowsHtml
                .'</tbody></table>'
                ."<div class='totals'>"
                ."  <div class='row'><span>Subtotal:</span><span>".$fmt($subtotal).'</span></div>'
                .($hasDiscount ? "  <div class='row'><span>Diskon (5%):</span><span>- ".$fmt($discVal).'</span></div>' : '')
                .($hasTax ? "  <div class='row'><span>PPN (11%):</span><span>".$fmt($taxVal).'</span></div>' : '')
                ."  <div class='row grand'><span>Total:</span><span>".$fmt($total).'</span></div>'
                .'</div>';
        } else {
            $html .= "<p style='font-size:14px;color:#334155;line-height:1.8'>".e($tpl->name).' ini diterbitkan secara sah dan mengikat para pihak berdasarkan ketentuan yang berlaku. Seluruh lampiran dan ruang lingkup pekerjaan merupakan bagian yang tidak terpisahkan.</p>'
                ."<p style='font-size:14px;color:#334155'><b>Total Nilai Terkait:</b> ".$fmt($total).'</p>';
        }

        if (! empty($vars['terms'])) {
            $html .= "<div class='terms'><b>Syarat & Ketentuan:</b><br>".nl2br(e($vars['termsText'] ?? '')).'</div>';
        }

        if (! empty($vars['signature'])) {
            $html .= "<div class='sig'>"
                ."  <div><div>Pihak Pertama</div><div class='line'>".e($vars['company'] ?? 'PT SOP').'</div></div>'
                ."  <div><div>Pihak Kedua</div><div class='line'>".e($vars['customer'] ?? 'Pelanggan').'</div></div>'
                .'</div>';
        }

        $html .= '</body></html>';

        // Store rendered file directly into Document Vault
        $docId = (string) Str::ulid();
        $versionId = (string) Str::ulid();
        $path = "sop-private/{$co}/{$docId}/{$versionId}";
        $sha256 = hash('sha256', $html);
        $byteSize = strlen($html);
        $now = now();

        Storage::disk('local')->put($path, $html);

        // Map template category to document categories: 'quotation', 'sales', 'purchase', 'finance', 'company'
        $category = in_array($tpl->category, ['quotation', 'sales', 'purchase', 'finance', 'company'], true)
            ? $tpl->category
            : 'company';

        DB::table('documents')->insert([
            'id' => $docId,
            'company_id' => $co,
            'owner_id' => $r->user()->id,
            'title' => $title,
            'category' => $category,
            'storage_path' => $path,
            'mime_type' => 'text/html',
            'version' => 1,
            'status' => 'approved',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('document_versions')->insert([
            'id' => $versionId,
            'document_id' => $docId,
            'version' => 1,
            'uploaded_by' => $r->user()->id,
            'storage_path' => $path,
            'original_name' => "{$tpl->code}_{$number}.html",
            'mime_type' => 'text/html',
            'byte_size' => $byteSize,
            'sha256' => $sha256,
            'is_verified' => true,
            'verified_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        AuditService::record(
            $r->user(),
            'document_template.rendered',
            'document',
            $docId,
            null,
            ['template_code' => $tpl->code, 'sha256' => $sha256, 'title' => $title]
        );

        return response()->json([
            'message' => "Dokumen {$tpl->name} berhasil dirender dan diarsipkan ke Document Vault.",
            'data' => [
                'document_id' => $docId,
                'version_id' => $versionId,
                'title' => $title,
                'sha256' => $sha256,
                'byte_size' => $byteSize,
                'download_url' => "/api/v1/documents/files/{$docId}/versions/1/download",
                'html_preview' => $html,
            ],
        ], 201);
    }
}
