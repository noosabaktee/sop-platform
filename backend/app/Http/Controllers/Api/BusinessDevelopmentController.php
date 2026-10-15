<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BusinessDevelopmentController extends Controller
{
    private function company(Request $r): string
    {
        return (string) $r->user()->company_id;
    }

    private function ensureCompanyTenders(string $co, string $userId): void
    {
        $count = DB::table('crm_tenders')->where('company_id', $co)->count();
        if ($count > 0) {
            return;
        }

        $now = now();
        $defaults = [
            ['code' => 'TND-44', 'name' => 'TND-44 Data Center', 'client' => 'Kominfo', 'value' => 4200000000, 'deadline' => '2026-11-15', 'bid' => 'Bid', 'status' => 'Submitted'],
            ['code' => 'TND-47', 'name' => 'TND-47 Smart City', 'client' => 'Pemkot Surabaya', 'value' => 3100000000, 'deadline' => '2026-12-02', 'bid' => 'Pending', 'status' => 'Open'],
            ['code' => 'TND-49', 'name' => 'TND-49 ERP Gov', 'client' => 'Pemprov Jabar', 'value' => 2600000000, 'deadline' => '2026-10-28', 'bid' => 'Bid', 'status' => 'Won'],
        ];

        foreach ($defaults as $d) {
            DB::table('crm_tenders')->insert([
                'id' => (string) Str::ulid(),
                'company_id' => $co,
                'code' => $d['code'],
                'name' => $d['name'],
                'client' => $d['client'],
                'value' => $d['value'],
                'deadline' => $d['deadline'],
                'bid' => $d['bid'],
                'status' => $d['status'],
                'owner_id' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function ensureCompanyProposals(string $co, string $userId): void
    {
        $count = DB::table('crm_proposals')->where('company_id', $co)->count();
        if ($count > 0) {
            return;
        }

        $now = now();
        $defaults = [
            ['code' => 'PROP-118', 'name' => 'PROP-118 Smart Factory', 'client' => 'PT Krakatau Steel', 'template' => 'ERP Proposal', 'version' => 'v2', 'status' => 'Sent', 'value' => 1500000000],
            ['code' => 'PROP-121', 'name' => 'PROP-121 Data Center', 'client' => 'Kominfo', 'template' => 'Tender Proposal', 'version' => 'v1', 'status' => 'Draft', 'value' => 4200000000],
            ['code' => 'PROP-119', 'name' => 'PROP-119 Retail POS', 'client' => 'PT Retail Nusantara', 'template' => 'ERP Proposal', 'version' => 'v3', 'status' => 'Accepted', 'value' => 900000000],
        ];

        foreach ($defaults as $d) {
            DB::table('crm_proposals')->insert([
                'id' => (string) Str::ulid(),
                'company_id' => $co,
                'code' => $d['code'],
                'name' => $d['name'],
                'client' => $d['client'],
                'template' => $d['template'],
                'version' => $d['version'],
                'owner_id' => $userId,
                'status' => $d['status'],
                'value' => $d['value'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function tenders(Request $r)
    {
        $co = $this->company($r);
        $this->ensureCompanyTenders($co, (string) $r->user()->id);

        $items = DB::table('crm_tenders as t')
            ->leftJoin('users as u', 'u.id', '=', 't.owner_id')
            ->leftJoin('projects as p', 'p.tender_id', '=', 't.id')
            ->where('t.company_id', $co)
            ->orderByDesc('t.created_at')
            ->select([
                't.*',
                'u.name as owner_name',
                'p.id as project_id',
                'p.code as project_code',
            ])
            ->get();

        return response()->json(['data' => $items]);
    }

    public function saveTender(Request $r)
    {
        $data = $r->validate([
            'id' => ['nullable', 'ulid'],
            'name' => ['required', 'string', 'max:255'],
            'client' => ['required', 'string', 'max:255'],
            'value' => ['required', 'numeric', 'min:0'],
            'deadline' => ['nullable', 'date'],
            'bid' => ['nullable', Rule::in(['Bid', 'No-bid', 'Pending'])],
            'status' => ['nullable', Rule::in(['Open', 'Submitted', 'Won', 'Lost', 'Cancelled'])],
            'owner_id' => ['nullable', 'ulid'],
        ]);

        $co = $this->company($r);
        $now = now();

        return DB::transaction(function () use ($r, $co, $data, $now) {
            $id = $data['id'] ?? null;
            $previous = null;

            if ($id) {
                $previous = DB::table('crm_tenders')->where('company_id', $co)->where('id', $id)->first();
                abort_unless($previous, 404, 'Tender tidak ditemukan.');

                DB::table('crm_tenders')->where('id', $id)->update([
                    'name' => $data['name'],
                    'client' => $data['client'],
                    'value' => $data['value'],
                    'deadline' => $data['deadline'] ?? null,
                    'bid' => $data['bid'] ?? $previous->bid,
                    'status' => $data['status'] ?? $previous->status,
                    'owner_id' => $data['owner_id'] ?? $previous->owner_id,
                    'updated_at' => $now,
                ]);
            } else {
                $id = (string) Str::ulid();
                $seq = DB::table('crm_tenders')->where('company_id', $co)->count() + 1;
                $code = 'TND-'.str_pad((string) $seq, 2, '0', STR_PAD_LEFT);

                DB::table('crm_tenders')->insert([
                    'id' => $id,
                    'company_id' => $co,
                    'code' => $code,
                    'name' => $data['name'],
                    'client' => $data['client'],
                    'value' => $data['value'],
                    'deadline' => $data['deadline'] ?? null,
                    'bid' => $data['bid'] ?? 'Pending',
                    'status' => $data['status'] ?? 'Open',
                    'owner_id' => $data['owner_id'] ?? $r->user()->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            AuditService::record(
                $r->user(),
                $previous ? 'tender.updated' : 'tender.created',
                'crm_tender',
                $id,
                $previous ? (array) $previous : null,
                $data
            );

            return response()->json(['data' => DB::table('crm_tenders')->find($id)], $previous ? 200 : 201);
        });
    }

    public function updateTenderStatus(Request $r, string $id)
    {
        $data = $r->validate([
            'status' => ['required', Rule::in(['Open', 'Submitted', 'Won', 'Lost', 'Cancelled'])],
        ]);

        $co = $this->company($r);

        return DB::transaction(function () use ($r, $co, $id, $data) {
            $t = DB::table('crm_tenders')->where('company_id', $co)->where('id', $id)->first();
            abort_unless($t, 404, 'Tender tidak ditemukan.');

            DB::table('crm_tenders')->where('id', $id)->update([
                'status' => $data['status'],
                'updated_at' => now(),
            ]);

            AuditService::record($r->user(), 'tender.status_changed', 'crm_tender', $id, ['status' => $t->status], ['status' => $data['status']]);

            return response()->json(['data' => DB::table('crm_tenders')->find($id)]);
        });
    }

    public function convertTenderToProject(Request $r, string $id)
    {
        $co = $this->company($r);

        return DB::transaction(function () use ($r, $co, $id) {
            $tender = DB::table('crm_tenders')->where('company_id', $co)->where('id', $id)->lockForUpdate()->first();
            abort_unless($tender, 404, 'Tender tidak ditemukan.');
            abort_unless(strtolower($tender->status) === 'won', 409, 'Hanya tender berstatus Won yang dapat dikonversi menjadi project.');

            $existing = DB::table('projects')->where('tender_id', $id)->first();
            if ($existing) {
                return response()->json(['data' => $existing, 'already_exists' => true]);
            }

            // Find or associate customer
            $customer = DB::table('customers')->where('company_id', $co)->where('name', 'like', "%{$tender->client}%")->first();
            if (! $customer) {
                $customerId = (string) Str::ulid();
                $custCode = 'CUST-TND-'.strtoupper(substr(str_replace('-', '', $id), -4));
                DB::table('customers')->insert([
                    'id' => $customerId,
                    'company_id' => $co,
                    'code' => $custCode,
                    'name' => $tender->client,
                    'email' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $tender->client)).'@client.local',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $customerId = $customer->id;
            }

            $manager = $tender->owner_id ?: $r->user()->id;
            $now = now();
            $projectId = (string) Str::ulid();
            $projectCode = 'PRJ-TND-'.strtoupper(substr(str_replace('-', '', $id), -8));

            DB::table('projects')->insert([
                'id' => $projectId,
                'company_id' => $co,
                'tender_id' => $id,
                'customer_id' => $customerId,
                'manager_id' => $manager,
                'code' => $projectCode,
                'name' => $tender->name,
                'status' => 'planning',
                'started_at' => $now->toDateString(),
                'due_at' => $tender->deadline ?: $now->copy()->addMonths(6)->toDateString(),
                'contract_value' => $tender->value,
                'budget' => '0.00',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $r->user(),
                'tender.converted_to_project',
                'project',
                $projectId,
                null,
                ['tender_id' => $id, 'project_code' => $projectCode]
            );

            return response()->json([
                'message' => "Project {$projectCode} berhasil dibuat dari tender Won {$tender->name}.",
                'data' => DB::table('projects')->find($projectId),
            ], 201);
        });
    }

    public function proposals(Request $r)
    {
        $co = $this->company($r);
        $this->ensureCompanyProposals($co, (string) $r->user()->id);

        $items = DB::table('crm_proposals as p')
            ->leftJoin('users as u', 'u.id', '=', 'p.owner_id')
            ->leftJoin('documents as d', 'd.id', '=', 'p.document_id')
            ->where('p.company_id', $co)
            ->orderByDesc('p.created_at')
            ->select([
                'p.*',
                'u.name as owner_name',
                'd.id as doc_id',
                'd.title as doc_title',
            ])
            ->get();

        return response()->json(['data' => $items]);
    }

    public function saveProposal(Request $r)
    {
        $data = $r->validate([
            'id' => ['nullable', 'ulid'],
            'name' => ['required', 'string', 'max:255'],
            'client' => ['required', 'string', 'max:255'],
            'template' => ['nullable', 'string', 'max:100'],
            'version' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'])],
            'owner_id' => ['nullable', 'ulid'],
            'opportunity_id' => ['nullable', 'ulid'],
            'tender_id' => ['nullable', 'ulid'],
            'value' => ['nullable', 'numeric', 'min:0'],
        ]);

        $co = $this->company($r);
        $now = now();

        return DB::transaction(function () use ($r, $co, $data, $now) {
            $id = $data['id'] ?? null;
            $previous = null;

            if ($id) {
                $previous = DB::table('crm_proposals')->where('company_id', $co)->where('id', $id)->first();
                abort_unless($previous, 404, 'Proposal tidak ditemukan.');

                DB::table('crm_proposals')->where('id', $id)->update([
                    'name' => $data['name'],
                    'client' => $data['client'],
                    'template' => $data['template'] ?? $previous->template,
                    'version' => $data['version'] ?? $previous->version,
                    'status' => $data['status'] ?? $previous->status,
                    'owner_id' => $data['owner_id'] ?? $previous->owner_id,
                    'opportunity_id' => $data['opportunity_id'] ?? $previous->opportunity_id,
                    'tender_id' => $data['tender_id'] ?? $previous->tender_id,
                    'value' => $data['value'] ?? $previous->value,
                    'updated_at' => $now,
                ]);
            } else {
                $id = (string) Str::ulid();
                $seq = DB::table('crm_proposals')->where('company_id', $co)->count() + 1;
                $code = 'PROP-'.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);

                DB::table('crm_proposals')->insert([
                    'id' => $id,
                    'company_id' => $co,
                    'code' => $code,
                    'name' => $data['name'],
                    'client' => $data['client'],
                    'template' => $data['template'] ?? 'ERP Proposal',
                    'version' => $data['version'] ?? 'v1',
                    'status' => $data['status'] ?? 'Draft',
                    'owner_id' => $data['owner_id'] ?? $r->user()->id,
                    'opportunity_id' => $data['opportunity_id'] ?? null,
                    'tender_id' => $data['tender_id'] ?? null,
                    'value' => $data['value'] ?? 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            AuditService::record(
                $r->user(),
                $previous ? 'proposal.updated' : 'proposal.created',
                'crm_proposal',
                $id,
                $previous ? (array) $previous : null,
                $data
            );

            return response()->json(['data' => DB::table('crm_proposals')->find($id)], $previous ? 200 : 201);
        });
    }

    public function updateProposalStatus(Request $r, string $id)
    {
        $data = $r->validate([
            'status' => ['required', Rule::in(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'])],
        ]);

        $co = $this->company($r);

        return DB::transaction(function () use ($r, $co, $id, $data) {
            $p = DB::table('crm_proposals')->where('company_id', $co)->where('id', $id)->first();
            abort_unless($p, 404, 'Proposal tidak ditemukan.');

            DB::table('crm_proposals')->where('id', $id)->update([
                'status' => $data['status'],
                'updated_at' => now(),
            ]);

            // If proposal accepted and linked to opportunity, auto-advance opportunity
            if ($data['status'] === 'Accepted' && $p->opportunity_id) {
                DB::table('opportunities')->where('id', $p->opportunity_id)->update([
                    'stage' => 'won',
                    'updated_at' => now(),
                ]);
            }

            AuditService::record($r->user(), 'proposal.status_changed', 'crm_proposal', $id, ['status' => $p->status], ['status' => $data['status']]);

            return response()->json(['data' => DB::table('crm_proposals')->find($id)]);
        });
    }
}
