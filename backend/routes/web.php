<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'SOP Platform API', 'status' => 'ok']));
