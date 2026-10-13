<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\GridSnapshot;
use App\Models\GridRow;
use App\Services\AuditService;
use App\Services\GridDomainProjector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/** Grid UI stays native; each logical row has a real PostgreSQL record. */
class GridSnapshotController extends Controller {
    public function index(Request $request) {
        $items = GridSnapshot::where('company_id', $request->user()->company_id)
            ->orderBy('route')->orderBy('panel_id')->get(['id','route','panel_id','rows','version','updated_at']);
        $rowSets = GridRow::where('company_id', $request->user()->company_id)
            ->whereIn('grid_snapshot_id', $items->pluck('id'))
            ->orderBy('position')->get()->groupBy('grid_snapshot_id');
        $items->each(function($snapshot) use ($rowSets) {
            $rows = $rowSets->get($snapshot->id);
            // Existing installations may have snapshots from before grid_rows migration.
            if ($rows && $rows->isNotEmpty()) $snapshot->rows = $rows->pluck('payload')->all();
            $snapshot->makeHidden(['id']);
        });
        return response()->json(['data'=>$items]);
    }
    public function store(Request $request) {
        $data = $request->validate([
            'snapshots'=>['required','array','min:1','max:250'],
            'snapshots.*.route'=>['required','string','max:120','regex:/^\/[a-z0-9\/-]+$/'],
            'snapshots.*.panel_id'=>['required','string','max:120','regex:/^[a-zA-Z0-9_.-]+$/'],
            'snapshots.*.rows'=>['required','array','max:2000'],
            'snapshots.*.rows.*'=>['required','array'],
            'snapshots.*.rows.*.__id'=>['required','string','max:160'],
            'snapshots.*.version'=>['nullable','integer','min:1'],
            'seed_only'=>['sometimes','boolean'],
        ]);
        $companyId = $request->user()->company_id;
        $seedOnly = (bool)($data['seed_only'] ?? false);
        $result = DB::transaction(function () use ($request,$data,$seedOnly,$companyId) {
            $result = [];
            foreach ($data['snapshots'] as $item) {
                $ids = array_column($item['rows'],'__id');
                if (count($ids) !== count(array_unique($ids))) {
                    throw ValidationException::withMessages(['snapshots'=>'Duplicate __id in '.$item['panel_id']]);
                }
                $existing = GridSnapshot::where('company_id',$companyId)
                    ->where('route',$item['route'])->where('panel_id',$item['panel_id'])
                    ->lockForUpdate()->first();
                if ($existing) {
                    if (!$seedOnly) {
                        // Prevent losing writes from another user/tab.
                        if (!isset($item['version']) || (int)$item['version'] !== $existing->version) {
                            abort(409,'Data telah berubah di tempat lain. Refresh sebelum menyimpan.');
                        }
                        $before = $existing->rows;
                        $this->syncRows($existing,$item['rows'],$request);
                        app(GridDomainProjector::class)->sync($existing,$item['rows']);
                        $existing->update(['rows'=>$item['rows'],'updated_by'=>$request->user()->id,'version'=>$existing->version+1]);
                        AuditService::record($request->user(),'grid.updated','grid_snapshot',$existing->id,['rows'=>$before],['rows'=>$item['rows']]);
                    }
                } else {
                    $existing = GridSnapshot::create([
                        'company_id'=>$companyId,'updated_by'=>$request->user()->id,
                        'route'=>$item['route'],'panel_id'=>$item['panel_id'],
                        'rows'=>$item['rows'],'version'=>1,
                    ]);
                    $this->syncRows($existing,$item['rows'],$request);
                    if (!$seedOnly) app(GridDomainProjector::class)->sync($existing,$item['rows']);
                    AuditService::record($request->user(),'grid.created','grid_snapshot',$existing->id,null,['route'=>$item['route'],'panel_id'=>$item['panel_id']]);
                }
                $result[] = ['route'=>$existing->route,'panel_id'=>$existing->panel_id,'version'=>$existing->version];
            }
            return $result;
        });
        return response()->json(['data'=>$result]);
    }
    /** Insert/update/delete are SQL transactions, not fake browser-only changes. */
    private function syncRows(GridSnapshot $snapshot,array $rows,Request $request):void {
        $all = GridRow::withTrashed()->where('grid_snapshot_id',$snapshot->id)
            ->where('company_id',$snapshot->company_id)->lockForUpdate()->get()->keyBy('row_key');
        $seen = [];
        foreach ($rows as $position=>$payload) {
            $key = $payload['__id'];
            $seen[$key]=true;
            $previous = $all->get($key);
            if (!$previous) {
                $record = GridRow::create([
                    'company_id'=>$snapshot->company_id,'grid_snapshot_id'=>$snapshot->id,
                    'row_key'=>$key,'payload'=>$payload,'position'=>$position,
                    'created_by'=>$request->user()->id,'updated_by'=>$request->user()->id,
                ]);
                if (!$request->boolean('seed_only')) AuditService::record($request->user(),'grid.row.created','grid_row',$record->id,null,$payload);
                continue;
            }
            if ($previous->trashed() || $previous->payload !== $payload || $previous->position !== $position) {
                $before=$previous->payload;
                $previous->fill(['payload'=>$payload,'position'=>$position,'updated_by'=>$request->user()->id]);
                $previous->version++;
                $previous->deleted_at=null;
                $previous->save();
                if (!$request->boolean('seed_only')) AuditService::record($request->user(),'grid.row.updated','grid_row',$previous->id,$before,$payload);
            }
        }
        foreach ($all as $key=>$previous) {
            if (!isset($seen[$key]) && !$previous->trashed()) {
                $previous->delete();
                AuditService::record($request->user(),'grid.row.deleted','grid_row',$previous->id,$previous->payload,null);
            }
        }
    }
}
