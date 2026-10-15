<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CorporateMeetingController extends Controller
{
    /**
     * Guard access to corporate meeting management endpoints.
     */
    private function guard(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['super_admin', 'admin', 'manager', 'corporate_secretary'], true),
            403
        );
    }

    /**
     * Find a tenant-scoped corporate meeting.
     */
    private function meeting(Request $request, string $id, bool $lock = false): object
    {
        $query = DB::table('corporate_meetings')
            ->where('company_id', $request->user()->company_id)
            ->where('id', $id);

        $meeting = ($lock ? $query->lockForUpdate() : $query)->first();
        abort_unless($meeting, 404);

        return $meeting;
    }

    /**
     * List meetings for the current tenant company.
     */
    public function index(Request $request): JsonResponse
    {
        $meetings = DB::table('corporate_meetings')
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('starts_at')
            ->limit(200)
            ->get();

        return response()->json([
            'data' => $meetings,
        ]);
    }

    /**
     * Show a meeting and its recorded resolutions.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $meeting = $this->meeting($request, $id);
        $resolutions = DB::table('corporate_resolutions')
            ->where('meeting_id', $meeting->id)
            ->get();

        return response()->json([
            'data' => [
                'meeting' => $meeting,
                'resolutions' => $resolutions,
            ],
        ]);
    }

    /**
     * Create a new corporate meeting (RUPS / BOD).
     */
    public function create(Request $request): JsonResponse
    {
        $this->guard($request);

        $validated = $request->validate([
            'kind' => ['required', Rule::in(['general', 'rups_annual', 'rups_extraordinary', 'board'])],
            'title' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'total_shares' => ['nullable', 'integer', 'min:0'],
            'present_shares' => ['nullable', 'integer', 'min:0'],
        ]);

        abort_unless(
            ($validated['present_shares'] ?? 0) <= ($validated['total_shares'] ?? 0),
            422,
            'Saham hadir tidak boleh melebihi total saham.'
        );

        $id = (string) Str::ulid();
        $now = now();

        DB::table('corporate_meetings')->insert($validated + [
            'id' => $id,
            'company_id' => $request->user()->company_id,
            'created_by' => $request->user()->id,
            'status' => 'draft',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        AuditService::record($request->user(), 'corporate.meeting.created', 'corporate_meeting', $id);

        return response()->json([
            'data' => DB::table('corporate_meetings')->find($id),
        ], 201);
    }

    /**
     * Update meeting details, status, or minutes of meeting.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->guard($request);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'starts_at' => ['sometimes', 'date'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'total_shares' => ['sometimes', 'integer', 'min:0'],
            'present_shares' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'held'])],
            'minutes' => ['sometimes', 'nullable', 'string', 'max:15000'],
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $meeting = $this->meeting($request, $id, true);
            abort_unless($meeting->status !== 'closed', 409, 'Rapat sudah ditutup.');

            abort_unless(
                ($validated['present_shares'] ?? $meeting->present_shares) <= ($validated['total_shares'] ?? $meeting->total_shares),
                422
            );

            $transitions = [
                'draft' => ['draft', 'scheduled'],
                'scheduled' => ['scheduled', 'held'],
                'held' => ['held'],
            ];

            if (isset($validated['status'])) {
                abort_unless(
                    in_array($validated['status'], $transitions[$meeting->status] ?? [], true),
                    409,
                    'Transisi status rapat tidak valid.'
                );
            }

            DB::table('corporate_meetings')->where('id', $id)->update($validated + ['updated_at' => now()]);

            AuditService::record($request->user(), 'corporate.meeting.updated', 'corporate_meeting', $id);

            return response()->json([
                'data' => DB::table('corporate_meetings')->find($id),
            ]);
        });
    }

    /**
     * Record a resolution vote in a held meeting.
     */
    public function resolution(Request $request, string $id): JsonResponse
    {
        $this->guard($request);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'for_votes' => ['required', 'integer', 'min:0'],
            'against_votes' => ['required', 'integer', 'min:0'],
            'abstain_votes' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $meeting = $this->meeting($request, $id, true);
            abort_unless($meeting->status === 'held', 409, 'Keputusan hanya saat rapat berlangsung.');

            $totalVotes = $validated['for_votes'] + $validated['against_votes'] + ($validated['abstain_votes'] ?? 0);
            abort_unless($totalVotes <= $meeting->present_shares, 422, 'Total suara melebihi saham hadir.');

            $status = $validated['for_votes'] > $validated['against_votes'] ? 'approved' : 'rejected';
            $resolutionId = (string) Str::ulid();
            $now = now();

            DB::table('corporate_resolutions')->insert($validated + [
                'id' => $resolutionId,
                'meeting_id' => $id,
                'status' => $status,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'corporate.resolution.recorded',
                'corporate_resolution',
                $resolutionId,
                null,
                ['status' => $status]
            );

            return response()->json([
                'data' => DB::table('corporate_resolutions')->find($resolutionId),
            ], 201);
        });
    }

    /**
     * Finalize and close the meeting, generating an archival risalah document.
     */
    public function close(Request $request, string $id): JsonResponse
    {
        $this->guard($request);

        return DB::transaction(function () use ($request, $id) {
            $meeting = $this->meeting($request, $id, true);
            if ($meeting->status === 'closed') {
                return response()->json([
                    'data' => $meeting,
                    'already_processed' => true,
                ]);
            }

            abort_unless(
                $meeting->status === 'held' && trim((string) $meeting->minutes) !== '',
                409,
                'Minutes of Meeting harus diisi sebelum ditutup.'
            );

            $resolutions = DB::table('corporate_resolutions')->where('meeting_id', $id)->get();
            $resolutionText = '';

            foreach ($resolutions as $idx => $res) {
                $number = $idx + 1;
                $resolutionText .= "{$number}. {$res->title} [Status: {$res->status}]\n   Setuju: {$res->for_votes}, Tolak: {$res->against_votes}, Abstain: {$res->abstain_votes}\n";
                if (! empty($res->description)) {
                    $resolutionText .= "   Keterangan: {$res->description}\n";
                }
            }

            if ($resolutions->isEmpty()) {
                $resolutionText = "Tidak ada resolusi tercatat.\n";
            }

            $content = "RISALAH DAN KEPUTUSAN RAPAT PERUSAHAAN (RUPS/BOD)\n"
                ."==================================================\n"
                ."Judul Rapat   : {$meeting->title}\n"
                ."Jenis         : {$meeting->kind}\n"
                ."Jadwal/Waktu  : {$meeting->starts_at}\n"
                .'Lokasi        : '.($meeting->location ?? '-')."\n"
                ."Total Saham   : {$meeting->total_shares}\n"
                ."Saham Hadir   : {$meeting->present_shares}\n"
                ."Status        : CLOSED (Telah Ditutup)\n\n"
                ."NOTULEN RAPAT (MINUTES OF MEETING):\n"
                ."------------------------------------\n"
                ."{$meeting->minutes}\n\n"
                ."DAFTAR KEPUTUSAN / RESOLUSI:\n"
                ."----------------------------\n"
                .$resolutionText;

            $path = "documents/{$meeting->company_id}/rups_{$id}.txt";
            Storage::disk('local')->put($path, $content);
            $sha256 = hash('sha256', $content);
            $byteSize = strlen($content);
            $now = now();
            $docId = (string) Str::ulid();
            $versionId = (string) Str::ulid();

            DB::table('documents')->insert([
                'id' => $docId,
                'company_id' => $meeting->company_id,
                'owner_id' => $request->user()->id,
                'title' => "Risalah RUPS: {$meeting->title}",
                'category' => 'corporate',
                'folder' => 'RUPS & Resolusi',
                'storage_path' => $path,
                'mime_type' => 'text/plain',
                'version' => 1,
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('document_versions')->insert([
                'id' => $versionId,
                'document_id' => $docId,
                'version' => 1,
                'uploaded_by' => $request->user()->id,
                'storage_path' => $path,
                'original_name' => "Risalah_RUPS_{$id}.txt",
                'mime_type' => 'text/plain',
                'byte_size' => $byteSize,
                'sha256' => $sha256,
                'is_verified' => true,
                'verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('corporate_meetings')->where('id', $id)->update([
                'status' => 'closed',
                'document_id' => $docId,
                'updated_at' => $now,
            ]);

            AuditService::record(
                $request->user(),
                'corporate.meeting.closed',
                'corporate_meeting',
                $id,
                ['status' => $meeting->status],
                [
                    'status' => 'closed',
                    'document_id' => $docId,
                    'sha256' => $sha256,
                ]
            );

            return response()->json([
                'data' => DB::table('corporate_meetings')->find($id),
            ]);
        });
    }
}
