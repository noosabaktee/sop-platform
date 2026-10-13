<?php
namespace App\Providers;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\BusinessRecord;
use App\Policies\BusinessRecordPolicy;
class AppServiceProvider extends ServiceProvider {
 public function register():void{}
 public function boot():void{Gate::policy(BusinessRecord::class,BusinessRecordPolicy::class);}
}
