<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Company;
class UserFactory extends Factory{
 protected $model=User::class;
 public function definition():array{return ['company_id'=>Company::factory(),'name'=>fake()->name(),'email'=>fake()->unique()->safeEmail(),'password'=>'password','role'=>'user','is_active'=>true,'email_verified_at'=>now()];}
}
