<?php
namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTemplateWorkflowTest extends TestCase {
    use RefreshDatabase;

    private function setupScenario(): array {
        Storage::fake('local');
        $this->seed(DatabaseSeeder::class);
        $co = Company::where('code', 'SOP-DEMO')->firstOrFail();
        $user = User::where('email', 'rina@sop.local')->firstOrFail();
        $manager = User::where('email', 'admin@sop.local')->firstOrFail();

        return compact('co', 'user', 'manager');
    }

    public function test_user_can_list_and_seed_document_templates_scoped_to_company(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $res = $this->getJson('/api/v1/document-templates')->assertOk()->json('data');

        $this->assertCount(8, $res);
        $codes = collect($res)->pluck('code')->all();
        $this->assertContains('quotation', $codes);
        $this->assertContains('invoice', $codes);
        $this->assertContains('po', $codes);
        $this->assertContains('so', $codes);
        $this->assertContains('bast', $codes);
        $this->assertContains('contract', $codes);
        $this->assertContains('proposal', $codes);
        $this->assertContains('report', $codes);

        $quo = collect($res)->firstWhere('code', 'quotation');
        $this->assertEquals('Quotation Template', $quo['name']);
        $this->assertArrayHasKey('company', $quo['variables']);
        $this->assertArrayHasKey('customer', $quo['variables']);
    }

    public function test_user_can_save_and_update_template_variables_with_version_increment(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        // First load list
        $this->getJson('/api/v1/document-templates')->assertOk();

        // Update quotation variables
        $updateRes = $this->postJson('/api/v1/document-templates', [
            'code' => 'quotation',
            'name' => 'Custom Quotation Pro',
            'variables' => [
                'company' => 'PT Maju Bersama Sukses',
                'companyAddress' => 'Gedung Menara Prima Lt. 12, Jakarta',
                'companyTax' => 'NPWP 02.999.888.7-012.000',
                'customer' => 'PT Mitra Global Sentosa',
                'number' => 'QUO-2026-CUSTOM-001',
                'date' => '15 Oktober 2026',
                'validUntil' => '15 November 2026',
                'tax' => true,
                'discount' => false,
                'terms' => true,
                'signature' => true,
                'locale' => 'id',
                'termsText' => 'Pembayaran full di muka sebelum pekerjaan dimulai.',
            ],
        ])->assertOk()->json('data');

        $this->assertEquals('Custom Quotation Pro', $updateRes['name']);
        $this->assertEquals(2, $updateRes['version']);
        $this->assertEquals('PT Maju Bersama Sukses', $updateRes['variables']['company']);

        // Verify in DB
        $tplInDb = DB::table('document_templates')
            ->where('company_id', $data['co']->id)
            ->where('code', 'quotation')
            ->first();
        $this->assertNotNull($tplInDb);
        $this->assertEquals(2, $tplInDb->version);

        // Verify audit log
        $audit = DB::table('audit_events')
            ->where('entity_type', 'document_template')
            ->where('entity_id', $tplInDb->id)
            ->where('action', 'document_template.saved')
            ->first();
        $this->assertNotNull($audit);
    }

    public function test_user_can_reset_template_variables_to_default(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $this->getJson('/api/v1/document-templates')->assertOk();

        // Reset invoice template
        $resetRes = $this->postJson('/api/v1/document-templates/invoice/reset')
            ->assertOk()
            ->json('data');

        $this->assertEquals('invoice', $resetRes['code']);
        $this->assertEquals(2, $resetRes['version']);
        $this->assertEquals('PT Sinergi Operasional Prima', $resetRes['variables']['company']);
        $this->assertEquals('INV-2026-0321', $resetRes['variables']['number']);
    }

    public function test_user_can_render_template_to_document_vault_with_sha256_verification(): void {
        $data = $this->setupScenario();
        $this->actingAs($data['user']);

        $renderRes = $this->postJson('/api/v1/document-templates/quotation/render', [
            'variables' => [
                'number' => 'QUO-2026-0099',
                'customer' => 'PT Nusantara Sejahtera',
            ],
            'items' => [
                ['desc' => 'Server Cloud Dedicated', 'qty' => 2, 'price' => 25000000],
                ['desc' => 'Setup & Managed Services', 'qty' => 1, 'price' => 10000000],
            ],
        ])->assertCreated()->json('data');

        $this->assertArrayHasKey('document_id', $renderRes);
        $this->assertArrayHasKey('version_id', $renderRes);
        $this->assertArrayHasKey('sha256', $renderRes);
        $this->assertArrayHasKey('download_url', $renderRes);
        $this->assertStringContainsString('QUO-2026-0099', $renderRes['title']);
        $this->assertStringContainsString('PT Nusantara Sejahtera', $renderRes['html_preview']);

        $docId = $renderRes['document_id'];

        // Verify record in documents table
        $doc = DB::table('documents')->where('id', $docId)->first();
        $this->assertNotNull($doc);
        $this->assertEquals($data['co']->id, $doc->company_id);
        $this->assertEquals($data['user']->id, $doc->owner_id);
        $this->assertEquals('approved', $doc->status);
        $this->assertEquals('quotation', $doc->category);

        // Verify record in document_versions table
        $version = DB::table('document_versions')->where('document_id', $docId)->first();
        $this->assertNotNull($version);
        $this->assertEquals($renderRes['sha256'], $version->sha256);
        $this->assertTrue((bool) $version->is_verified);

        // Verify physical file in storage disk
        $this->assertTrue(Storage::disk('local')->exists($version->storage_path));
        $content = Storage::disk('local')->get($version->storage_path);
        $this->assertEquals(hash('sha256', $content), $renderRes['sha256']);

        // Verify downloading via DocumentVaultController
        $downloadRes = $this->get('/api/v1/documents/files/' . $docId . '/versions/1/download');
        $downloadRes->assertOk();
    }
}
