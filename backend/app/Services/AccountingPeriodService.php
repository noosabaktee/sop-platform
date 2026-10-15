<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
/** Single server-side guard used by every journal source; UI state is not authoritative. */
final class AccountingPeriodService {
 public function assertOpen(string $company,string $date):void {
  abort_if(DB::table('accounting_periods')->where('company_id',$company)->where('status','closed')
   ->whereDate('starts_on','<=',$date)->whereDate('ends_on','>=',$date)->exists(),409,'Periode akuntansi sudah ditutup untuk tanggal transaksi ini.');
 }
}
