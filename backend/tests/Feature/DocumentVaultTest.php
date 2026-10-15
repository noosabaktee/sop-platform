<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentVaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_document_upload_version_download_and_archive(): void
    {
        Storage::fake('local');
        $a = Company::factory()->create();
        $user = User::factory()->create(['company_id' => $a->id, 'role' => 'admin']);
        $other = Company::factory()->create();
        $outsider = User::factory()->create(['company_id' => $other->id]);
        $this->actingAs($user);
        $first = $this->post('/api/v1/documents/files', ['title' => 'Test document', 'file' => UploadedFile::fake()->create('file.pdf', 20, 'application/pdf')]);
        $first->assertCreated();
        $id = $first->json('data.id');
        $this->post('/api/v1/documents/files', ['document_id' => $id, 'title' => 'Updated document',
            'file' => UploadedFile::fake()->create('file.pdf', 25, 'application/pdf')])->assertCreated()->assertJsonPath('data.version', 2);
        $this->getJson('/api/v1/documents/files/'.$id.'/versions')->assertJsonCount(2, 'data');
        $this->get('/api/v1/documents/files/'.$id.'/versions/1/download')->assertOk();
        $this->actingAs($outsider)->get('/api/v1/documents/files/'.$id.'/versions/2/download')->assertNotFound();
        $this->actingAs($user)->delete('/api/v1/documents/files/'.$id)->assertNoContent();
        $this->getJson('/api/v1/documents/files')->assertJsonCount(0, 'data');
    }
}
