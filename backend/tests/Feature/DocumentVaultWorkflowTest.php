<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentVaultWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function setupScenario(): array
    {
        Storage::fake('local');
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $user = User::where('email', 'rina@sop.local')->firstOrFail();
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();

        return compact('co', 'user', 'manager');
    }

    public function test_user_can_upload_private_file_with_cryptographic_hash(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $file = UploadedFile::fake()->create('sop_kebijakan.pdf', 250, 'application/pdf');

        $res = $this->postJson('/api/v1/documents/files', [
            'file' => $file,
            'title' => 'SOP Kebijakan Operasional 2026',
            'category' => 'company',
            'folder' => 'Kebijakan',
        ])->assertCreated()->json('data');

        $this->assertEquals('SOP Kebijakan Operasional 2026', $res['title']);
        $this->assertEquals('company', $res['category']);
        $this->assertEquals(1, $res['version']);
        $this->assertEquals('draft', $res['status']);

        // Check storage version and sha256
        $version = DB::table('document_versions')->where('document_id', $res['id'])->where('version', 1)->first();
        $this->assertNotNull($version);
        $this->assertNotEmpty($version->sha256);
        $this->assertTrue((bool) $version->is_verified);
    }

    public function test_document_approval_lifecycle_draft_pending_approved(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $file = UploadedFile::fake()->create('kontrak_klien.pdf', 150, 'application/pdf');
        $doc = $this->postJson('/api/v1/documents/files', [
            'file' => $file,
            'title' => 'Kontrak Kerja Sama Klien',
            'category' => 'sales',
        ])->assertCreated()->json('data');

        // Submit for approval
        $submitted = $this->postJson('/api/v1/documents/files/'.$doc['id'].'/submit-approval')
            ->assertOk()
            ->json('data');
        $this->assertEquals('pending_approval', $submitted['status']);

        // User cannot self-decide if not manager
        $this->postJson('/api/v1/documents/files/'.$doc['id'].'/decision', [
            'decision' => 'approved',
        ])->assertForbidden();

        // Manager approves document
        $this->actingAs($data['manager']);
        $approved = $this->postJson('/api/v1/documents/files/'.$doc['id'].'/decision', [
            'decision' => 'approved',
        ])->assertOk()->json('data');

        $this->assertEquals('approved', $approved['status']);
        $this->assertEquals($data['manager']->id, $approved['approved_by']);
        $this->assertNotNull($approved['approved_at']);
    }

    public function test_document_rejection_requires_reason(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $file = UploadedFile::fake()->create('draft_mou.pdf', 100, 'application/pdf');
        $doc = $this->postJson('/api/v1/documents/files', [
            'file' => $file,
            'title' => 'Draft MOU Vendor',
            'category' => 'purchase',
        ])->assertCreated()->json('data');

        $this->postJson('/api/v1/documents/files/'.$doc['id'].'/submit-approval')->assertOk();

        // Manager rejects without reason -> 422
        $this->actingAs($data['manager']);
        $this->postJson('/api/v1/documents/files/'.$doc['id'].'/decision', [
            'decision' => 'rejected',
            'reason' => '',
        ])->assertStatus(422);

        // Manager rejects with reason -> OK
        $rejected = $this->postJson('/api/v1/documents/files/'.$doc['id'].'/decision', [
            'decision' => 'rejected',
            'reason' => 'Perlu lampiran pasal kerahasiaan data (NDA).',
        ])->assertOk()->json('data');

        $this->assertEquals('rejected', $rejected['status']);
        $this->assertEquals('Perlu lampiran pasal kerahasiaan data (NDA).', $rejected['rejection_reason']);
    }

    public function test_document_cryptographic_checksum_verification(): void
    {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $file = UploadedFile::fake()->create('dokumen_legal.pdf', 300, 'application/pdf');
        $doc = $this->postJson('/api/v1/documents/files', [
            'file' => $file,
            'title' => 'Dokumen Legalitas Perusahaan',
            'category' => 'company',
        ])->assertCreated()->json('data');

        // Check checksum verification endpoint
        $verifyRes = $this->getJson('/api/v1/documents/files/'.$doc['id'].'/versions/1/verify')
            ->assertOk()
            ->json('data');

        $this->assertTrue($verifyRes['is_intact']);
        $this->assertEquals($verifyRes['expected_sha256'], $verifyRes['computed_sha256']);
        $this->assertArrayHasKey('verified_at', $verifyRes);
    }
}
