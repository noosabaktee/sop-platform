$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Write-Host 'SOP Backend + Frontend (tanpa Docker)'
if (-not (Test-Path "$root\backend\.env")) {Copy-Item "$root\backend\.env.example" "$root\backend\.env"; Write-Warning 'Isi DB_DATABASE/DB_USERNAME/DB_PASSWORD di backend\.env sebelum migrate.'}
if (-not (Test-Path "$root\frontend\.env")) {Copy-Item "$root\frontend\.env.example" "$root\frontend\.env"}
Write-Host 'Periksa backend menggunakan: php scripts/check-requirements.php'
Write-Host 'Terminal 1: cd backend; composer install; php artisan key:generate; php artisan migrate --seed; php artisan serve'
Write-Host 'Terminal 2: cd frontend; npm.cmd install; npm.cmd run dev'
Write-Host 'Buka http://localhost:5173/#/login'
