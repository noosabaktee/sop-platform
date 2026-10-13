<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;
class CompanyFactory extends Factory {protected $model=Company::class;public function definition():array{return ['code'=>strtoupper(fake()->unique()->bothify('????-####')),'name'=>fake()->company(),'currency'=>'IDR'];}}
