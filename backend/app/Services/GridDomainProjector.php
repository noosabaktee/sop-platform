<?php

namespace App\Services;

use App\Models\GridRow;
use App\Models\GridSnapshot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Explicitly mapped master data grids sync to normalized tables within the grid transaction.
 * Other grids are preserved without pretending they are authoritative finance transactions. */
class GridDomainProjector
{
    private const MAPPINGS = [
        '/master-data|customers' => ['table' => 'customers', 'identity' => 'code'],
        '/master-data|vendors' => ['table' => 'vendors', 'identity' => 'code'],
        '/master-data|products' => ['table' => 'products', 'identity' => 'sku'],
        '/master-data|warehouses' => ['table' => 'warehouses', 'identity' => 'code'],
        '/master-data|departments' => ['table' => 'departments', 'identity' => 'code'],
        '/crm-sales|leads' => ['table' => 'leads', 'identity' => 'name', 'unique' => false],
        '/crm-sales|prospects' => ['table' => 'prospects', 'identity' => 'name', 'unique' => false],
    ];

    public function sync(GridSnapshot $grid, array $rows): void
    {
        $kind = $grid->route.'|'.$grid->panel_id;
        if (! isset(self::MAPPINGS[$kind])) {
            return;
        }
        $config = self::MAPPINGS[$kind];
        $table = $config['table'];
        $company = (string) $grid->company_id;
        $incoming = [];
        foreach ($rows as $row) {
            $gridRow = GridRow::where('company_id', $company)->where('grid_snapshot_id', $grid->id)->where('row_key', $row['__id'])->firstOrFail();
            $incoming[$gridRow->id] = true;
            $fields = $this->mapped($kind, $row, $company);
            if ($fields === null) {
                continue;
            }
            $link = DB::table('grid_domain_links')->where('grid_row_id', $gridRow->id)->lockForUpdate()->first();
            $q = DB::table($table)->where('company_id', $company);
            $entity = $link ? $q->where('id', $link->domain_id)->first() : null;
            if (! $entity) {
                $lookup = $config['identity'];
                if ($config['unique'] ?? true) {
                    $entity = DB::table($table)->where('company_id', $company)->where($lookup, $fields[$lookup])->first();
                }
            }
            if ($entity) {
                // Honor the identity unique constraint, and do not change a used business key implicitly.
                DB::table($table)->where('company_id', $company)->where('id', $entity->id)->update($fields + ['updated_at' => now()]);
                $domainId = $entity->id;
            } else {
                $domainId = (string) Str::ulid();
                DB::table($table)->insert(['id' => $domainId, 'company_id' => $company] + $fields + ['created_at' => now(), 'updated_at' => now()]);
            }
            DB::table('grid_domain_links')->updateOrInsert(['grid_row_id' => $gridRow->id],
                ['company_id' => $company, 'domain_table' => $table, 'domain_id' => $domainId, 'archived' => false, 'updated_at' => now()]);
        }
        // Deleting a UI row archives a master record instead of hard-deleting business history.
        $links = DB::table('grid_domain_links as l')->join('grid_rows as r', 'r.id', '=', 'l.grid_row_id')
            ->where('r.grid_snapshot_id', $grid->id)->where('l.company_id', $company)->where('l.archived', false)
            ->get(['l.grid_row_id', 'l.domain_id', 'l.domain_table']);
        foreach ($links as $link) {
            if (isset($incoming[$link->grid_row_id])) {
                continue;
            }
            if (in_array($link->domain_table, ['customers', 'vendors', 'leads', 'prospects'], true)) {
                DB::table($link->domain_table)->where('company_id', $company)->where('id', $link->domain_id)->update(['status' => 'inactive', 'updated_at' => now()]);
            } elseif (in_array($link->domain_table, ['products', 'warehouses', 'departments'], true)) {
                DB::table($link->domain_table)->where('company_id', $company)->where('id', $link->domain_id)->update(['is_active' => false, 'updated_at' => now()]);
            }
            DB::table('grid_domain_links')->where('grid_row_id', $link->grid_row_id)->update(['archived' => true, 'updated_at' => now()]);
        }
    }

    private function mapped(string $kind, array $r, string $company): ?array
    {
        $s = static fn ($k) => trim((string) ($r[$k] ?? ''));
        switch ($kind) {
            case '/master-data|customers':return $this->requireCode(['code' => $s('c0'), 'name' => $s('c1'), 'status' => strtolower($s('c5') ?: 'active')]);
            case '/master-data|vendors':return $this->requireCode(['code' => $s('c0'), 'name' => $s('c1'), 'status' => strtolower($s('c5') ?: 'active')]);
            case '/master-data|products':return $this->requireCode(['sku' => $s('c0'), 'name' => $s('c1'), 'unit' => $s('c3') ?: 'pcs', 'standard_price' => $this->rupiah($s('c4')), 'is_active' => true]);
            case '/master-data|warehouses':return $this->requireCode(['code' => $s('c0'), 'name' => $s('c1'), 'is_active' => true]);
            case '/master-data|departments':return $this->requireCode(['code' => $s('c0'), 'name' => $s('c1'), 'is_active' => true]);
            case '/crm-sales|leads':
                $name = $s('name');
                if ($name === '') {
                    return null;
                }
                $email = $s('email');
                if ($email === '[REDACTED_EMAIL]') {
                    $email = '';
                }
                if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw ValidationException::withMessages(['email' => 'Format email Lead tidak valid.']);
                }

                return ['name' => $name, 'company_name' => $s('company') ?: null, 'email' => $email ?: null, 'source' => $s('source') ?: null,
                    'score' => max(0, min(100, (int) $s('score'))), 'status' => strtolower($s('status') ?: 'new'),
                    'owner_id' => $this->ownerId($s('owner'), $company)];
            case '/crm-sales|prospects':
                $name = $s('name');
                if ($name === '') {
                    return null;
                }

                return ['name' => $name, 'segment' => $s('segment') ?: 'Mid', 'fit_score' => max(0, min(100, (int) $s('fit'))),
                    'next_action' => $s('next') ?: null, 'status' => $s('status') ?: 'New', 'owner_id' => $this->ownerId($s('owner'), $company)];
        }

        return null;
    }

    private function requireCode(array $fields): array
    {
        $code = $fields['code'] ?? $fields['sku'] ?? '';
        if ($code === '' || trim((string) ($fields['name'] ?? '')) === '') {
            throw ValidationException::withMessages(['grid' => 'Kode dan nama diperlukan untuk penyimpanan master data.']);
        }

        return $fields;
    }

    private function ownerId(string $name, string $company): ?string
    {
        if ($name === '') {
            return null;
        }

        return DB::table('users')->where('company_id', $company)->where('name', $name)->where('is_active', true)->value('id');
    }

    private function rupiah(string $input): string
    {
        if ($input === '') {
            return '0.00';
        }
        $raw = strtolower(trim(str_replace(['Rp', 'rp', ' '], '', $input)));
        $factor = 1;
        if (str_ends_with($raw, 'jt')) {
            $factor = 1000000;
            $raw = substr($raw, 0, -2);
        } elseif (str_ends_with($raw, 'm')) {
            $factor = 1000000000;
            $raw = substr($raw, 0, -1);
        }
        // Indonesian thousands separators vs fractional separator.
        if (preg_match('/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/', $raw)) {
            $raw = str_replace(['.', ','], ['', '.'], $raw);
        } else {
            $raw = str_replace(',', '.', $raw);
        }
        if (! is_numeric($raw) || $raw < 0) {
            throw ValidationException::withMessages(['price' => 'Format harga tidak valid.']);
        }

        return number_format((float) $raw * $factor,2,'.','');
    }
}
