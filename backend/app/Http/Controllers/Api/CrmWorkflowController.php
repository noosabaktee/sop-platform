<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GridRow;
use App\Models\GridSnapshot;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CrmWorkflowController extends Controller
{
    public function convertLead(Request $request, string $rowKey)
    {
        abort_unless(in_array($request->user()->role, ['super_admin','admin','manager','sales'], true), 403);
        $companyId = (string) $request->user()->company_id;

        $result = DB::transaction(function () use ($request, $rowKey, $companyId) {
            $source = GridSnapshot::where('company_id', $companyId)->where('route', '/crm-sales')
                ->where('panel_id', 'leads')->lockForUpdate()->firstOrFail();
            $gridRow = GridRow::where('company_id', $companyId)->where('grid_snapshot_id', $source->id)
                ->where('row_key', $rowKey)->lockForUpdate()->firstOrFail();
            $link = DB::table('grid_domain_links')->where('grid_row_id', $gridRow->id)
                ->where('company_id', $companyId)->where('domain_table', 'leads')->lockForUpdate()->first();
            abort_unless($link, 409, 'Lead belum tersinkron ke tabel domain. Simpan lead lalu coba lagi.');
            $lead = DB::table('leads')->where('company_id', $companyId)->where('id', $link->domain_id)
                ->lockForUpdate()->first();
            abort_unless($lead, 404);

            $prospect = DB::table('prospects')->where('company_id', $companyId)->where('lead_id', $lead->id)->first();
            if (!$prospect) {
                $prospectId = (string) Str::ulid();
                DB::table('prospects')->insert([
                    'id'=>$prospectId, 'company_id'=>$companyId, 'lead_id'=>$lead->id,
                    'owner_id'=>$lead->owner_id ?: $request->user()->id,
                    'name'=>$lead->company_name ?: $lead->name, 'segment'=>'Mid',
                    'fit_score'=>$lead->score, 'next_action'=>'Hubungi customer',
                    'status'=>'Qualified', 'created_at'=>now(), 'updated_at'=>now(),
                ]);
                $prospect = DB::table('prospects')->where('id', $prospectId)->first();
            }

            DB::table('leads')->where('id', $lead->id)->update([
                'status'=>'converted', 'converted_at'=>$lead->converted_at ?: now(), 'updated_at'=>now(),
            ]);
            DB::table('grid_domain_links')->where('grid_row_id', $gridRow->id)
                ->update(['archived'=>true, 'updated_at'=>now()]);
            $gridRow->delete();

            $sourceRows = collect($source->rows ?: [])->reject(fn ($row) => ($row['__id'] ?? null) === $rowKey)->values()->all();
            $source->update(['rows'=>$sourceRows, 'updated_by'=>$request->user()->id, 'version'=>$source->version + 1]);

            $target = GridSnapshot::firstOrCreate(
                ['company_id'=>$companyId, 'route'=>'/crm-sales', 'panel_id'=>'prospects'],
                ['id'=>(string) Str::ulid(), 'updated_by'=>$request->user()->id, 'rows'=>[], 'version'=>1]
            );
            $target = GridSnapshot::whereKey($target->id)->lockForUpdate()->firstOrFail();
            $targetRowKey = 'prospect-'.$prospect->id;
            $payload = [
                '__id'=>$targetRowKey, 'name'=>$prospect->name, 'segment'=>$prospect->segment,
                'fit'=>(int) $prospect->fit_score, 'next'=>$prospect->next_action ?: '',
                'owner'=>$request->user()->name, 'status'=>$prospect->status,
            ];
            $targetRows = collect($target->rows ?: [])->reject(fn ($row) => ($row['__id'] ?? null) === $targetRowKey)
                ->prepend($payload)->values()->all();
            $targetGridRow = GridRow::withTrashed()->firstOrNew([
                'grid_snapshot_id'=>$target->id, 'row_key'=>$targetRowKey,
            ]);
            $targetGridRow->fill([
                'company_id'=>$companyId, 'payload'=>$payload, 'position'=>0,
                'created_by'=>$targetGridRow->created_by ?: $request->user()->id,
                'updated_by'=>$request->user()->id,
            ]);
            $targetGridRow->deleted_at = null;
            $targetGridRow->save();
            DB::table('grid_domain_links')->updateOrInsert(
                ['grid_row_id'=>$targetGridRow->id],
                ['company_id'=>$companyId, 'domain_table'=>'prospects', 'domain_id'=>$prospect->id,
                 'archived'=>false, 'created_at'=>now(), 'updated_at'=>now()]
            );
            GridRow::where('grid_snapshot_id', $target->id)->where('id', '<>', $targetGridRow->id)->increment('position');
            $target->update(['rows'=>$targetRows, 'updated_by'=>$request->user()->id, 'version'=>$target->version + 1]);

            AuditService::record($request->user(), 'lead.converted', 'lead', $lead->id,
                ['status'=>$lead->status], ['status'=>'converted','prospect_id'=>$prospect->id]);

            return ['prospect'=>$prospect, 'snapshots'=>[
                ['route'=>'/crm-sales','panel_id'=>'leads','rows'=>$sourceRows,'version'=>$source->version],
                ['route'=>'/crm-sales','panel_id'=>'prospects','rows'=>$targetRows,'version'=>$target->version],
            ]];
        });

        return response()->json(['data'=>$result]);
    }
}
