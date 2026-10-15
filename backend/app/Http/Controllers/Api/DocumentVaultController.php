<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\OperationalNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Private local storage with cryptographic verification, versioning, and approval workflow. */
class DocumentVaultController extends Controller {
    private function company(Request $r): string {
        return (string) $r->user()->company_id;
    }

    private function item(Request $r, string $id, bool $lock = false): object {
        $q = DB::table('documents')->where('company_id', $this->company($r))->where('id', $id);
        $item = ($lock ? $q->lockForUpdate() : $q)->first();
        abort_unless($item, 404, 'Dokumen tidak ditemukan.');
        abort_unless($item->owner_id === $r->user()->id || $r->user()->canManageRecords(), 403, 'Akses dokumen ditolak.');
        return $item;
    }

    public function index(Request $r) {
        $co = $this->company($r);
        $category = $r->input('category');
        $status = $r->input('status');

        $items = DB::table('documents as d')
            ->leftJoin('users as u_owner', 'u_owner.id', '=', 'd.owner_id')
            ->leftJoin('users as u_appr', 'u_appr.id', '=', 'd.approved_by')
            ->where('d.company_id', $co)
            ->when(!$r->user()->canManageRecords(), fn($q) => $q->where('d.owner_id', $r->user()->id))
            ->where('d.status', '!=', 'archived')
            ->when($category && $category !== 'all', fn($q) => $q->where('d.category', $category))
            ->when($status, fn($q) => $q->where('d.status', $status))
            ->orderByDesc('d.updated_at')
            ->select([
                'd.*',
                'u_owner.name as owner_name',
                'u_appr.name as approver_name',
            ])
            ->paginate(min(max((int) $r->input('per_page', 30), 1), 100));

        return response()->json($items);
    }

    public function upload(Request $r) {
        abort_unless(
            in_array($r->user()->role, ['super_admin', 'admin', 'manager', 'sales', 'finance', 'project_manager', 'procurement', 'corporate_secretary'], true),
            403
        );

        $data = $r->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,png,jpg,jpeg,txt,csv,doc,docx,xls,xlsx'],
            'title' => ['required', 'string', 'max:255'],
            'document_id' => ['nullable', 'ulid'],
            'status' => ['nullable', Rule::in(['draft', 'pending_approval'])],
            'category' => ['nullable', Rule::in(['all', 'project', 'quotation', 'sales', 'purchase', 'finance', 'company'])],
            'folder' => ['nullable', 'string', 'max:150'],
        ]);

        $file = $r->file('file');
        $co = $this->company($r);
        $id = $data['document_id'] ?? (string) Str::ulid();
        $versionId = (string) Str::ulid();
        $path = 'sop-private/' . $co . '/' . $id . '/' . $versionId;

        $stream = fopen($file->getRealPath(), 'rb');
        try {
            abort_unless(Storage::disk('local')->put($path, $stream), 500, 'Gagal menulis file ke storage privat.');
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        try {
            $doc = DB::transaction(function () use ($r, $data, $file, $co, $id, $path, $versionId) {
                $now = now();
                $previous = null;
                $sha256 = hash_file('sha256', $file->getRealPath());

                if (!empty($data['document_id'])) {
                    $previous = $this->item($r, $id, true);
                    abort_if($previous->status === 'archived', 409, 'Dokumen arsip tidak dapat diubah.');
                    abort_unless($previous->owner_id === $r->user()->id || $r->user()->canManageRecords(), 403);
                    $version = $previous->version + 1;
                    DB::table('documents')->where('id', $id)->update([
                        'title' => $data['title'],
                        'storage_path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'version' => $version,
                        'status' => $data['status'] ?? 'draft',
                        'updated_at' => $now,
                    ]);
                } else {
                    $version = 1;
                    DB::table('documents')->insert([
                        'id' => $id,
                        'company_id' => $co,
                        'owner_id' => $r->user()->id,
                        'title' => $data['title'],
                        'category' => $data['category'] ?? 'all',
                        'folder' => $data['folder'] ?? null,
                        'storage_path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'version' => $version,
                        'status' => $data['status'] ?? 'draft',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                DB::table('document_versions')->insert([
                    'id' => $versionId,
                    'document_id' => $id,
                    'version' => $version,
                    'uploaded_by' => $r->user()->id,
                    'storage_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'byte_size' => $file->getSize(),
                    'sha256' => $sha256,
                    'is_verified' => true,
                    'verified_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                AuditService::record(
                    $r->user(),
                    $previous ? 'document.versioned' : 'document.created',
                    'document',
                    $id,
                    $previous ? ['version' => $previous->version] : null,
                    ['version' => $version, 'title' => $data['title'], 'sha256' => $sha256]
                );

                return DB::table('documents')->find($id);
            });

            return response()->json(['data' => $doc], 201);
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
    }

    public function submitForApproval(Request $r, string $id) {
        return DB::transaction(function () use ($r, $id) {
            $doc = $this->item($r, $id, true);
            abort_unless(in_array($doc->status, ['draft', 'rejected'], true), 409, 'Hanya dokumen draft/rejected yang dapat diajukan approval.');

            DB::table('documents')->where('id', $id)->update([
                'status' => 'pending_approval',
                'updated_at' => now(),
            ]);

            app(OperationalNotification::class)->toApprovers(
                $this->company($r),
                (string) $r->user()->id,
                'document.approval_requested',
                ['document_id' => $id, 'title' => $doc->title]
            );

            AuditService::record($r->user(), 'document.submitted_for_approval', 'document', $id, ['status' => $doc->status], ['status' => 'pending_approval']);

            return response()->json(['data' => DB::table('documents')->find($id)]);
        });
    }

    public function decide(Request $r, string $id) {
        abort_unless($r->user()->canManageRecords(), 403, 'Hanya approver yang berhak memutuskan persetujuan dokumen.');
        $data = $r->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['decision'] === 'rejected') {
            abort_unless(trim((string) ($data['reason'] ?? '')) !== '', 422, 'Alasan penolakan dokumen wajib diisi.');
        }

        return DB::transaction(function () use ($r, $id, $data) {
            $doc = $this->item($r, $id, true);
            abort_unless($doc->status === 'pending_approval', 409, 'Dokumen tidak sedang menunggu persetujuan.');

            DB::table('documents')->where('id', $id)->update([
                'status' => $data['decision'],
                'approved_by' => $r->user()->id,
                'approved_at' => now(),
                'rejection_reason' => $data['reason'] ?? null,
                'updated_at' => now(),
            ]);

            app(OperationalNotification::class)->toUser(
                (string) $doc->owner_id,
                'document.' . $data['decision'],
                ['document_id' => $id, 'title' => $doc->title]
            );

            AuditService::record($r->user(), 'document.' . $data['decision'], 'document', $id, ['status' => $doc->status], [
                'status' => $data['decision'],
                'approved_by' => $r->user()->id,
            ]);

            return response()->json(['data' => DB::table('documents')->find($id)]);
        });
    }

    public function verifyChecksum(Request $r, string $id, int $version) {
        $doc = $this->item($r, $id);
        $v = DB::table('document_versions')->where('document_id', $id)->where('version', $version)->first();
        abort_unless($v, 404, 'Versi dokumen tidak ditemukan.');

        $fullPath = Storage::disk('local')->path($v->storage_path);
        abort_unless(file_exists($fullPath), 404, 'Berkas fisik tidak ditemukan di storage.');

        $computedHash = hash_file('sha256', $fullPath);
        $isIntact = hash_equals($v->sha256, $computedHash);

        DB::table('document_versions')->where('id', $v->id)->update([
            'is_verified' => $isIntact,
            'verified_at' => now(),
        ]);

        AuditService::record($r->user(), 'document.checksum_verified', 'document', $id, null, [
            'version' => $version,
            'is_intact' => $isIntact,
        ]);

        return response()->json([
            'data' => [
                'document_id' => $id,
                'title' => $doc->title,
                'version' => $version,
                'is_intact' => $isIntact,
                'expected_sha256' => $v->sha256,
                'computed_sha256' => $computedHash,
                'file_size' => $v->byte_size,
                'verified_at' => now()->toIso8601String(),
                'status' => $doc->status,
            ],
        ]);
    }

    public function versions(Request $r, string $id) {
        $this->item($r, $id);
        return response()->json([
            'data' => DB::table('document_versions')
                ->where('document_id', $id)
                ->orderByDesc('version')
                ->get(['id', 'version', 'original_name', 'mime_type', 'byte_size', 'sha256', 'is_verified', 'verified_at', 'created_at']),
        ]);
    }

    public function download(Request $r, string $id, int $version) {
        $doc = $this->item($r, $id);
        abort_if($doc->status === 'archived', 404);
        $v = DB::table('document_versions')->where('document_id', $id)->where('version', $version)->first();
        abort_unless($v, 404);
        abort_unless(Storage::disk('local')->exists($v->storage_path), 404, 'File tidak ditemukan di storage.');
        AuditService::record($r->user(), 'document.downloaded', 'document', $id, null, ['version' => $version]);
        return Storage::disk('local')->download($v->storage_path, $v->original_name, ['X-Content-Type-Options' => 'nosniff']);
    }

    public function archive(Request $r, string $id) {
        return DB::transaction(function () use ($r, $id) {
            $doc = $this->item($r, $id, true);
            abort_unless($doc->owner_id === $r->user()->id || $r->user()->canManageRecords(), 403);
            DB::table('documents')->where('id', $id)->update(['status' => 'archived', 'updated_at' => now()]);
            AuditService::record($r->user(), 'document.archived', 'document', $id, ['status' => $doc->status], ['status' => 'archived']);
            return response()->noContent();
        });
    }
}
