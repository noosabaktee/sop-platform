$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location "$root\backend"
if (-not (Test-Path '.env.testing')) { throw 'Buat backend/.env.testing dari .env.testing.example, dengan DB_DATABASE=sop_platform_test (BUKAN sop_platform)!' }
$config = Get-Content '.env.testing' -Raw
if ($config -notmatch '(?m)^DB_DATABASE=sop_platform_test\s*$') { throw 'Pengujian dibatalkan: DB_DATABASE harus tepat sop_platform_test.' }
if ($config -notmatch '(?m)^APP_ENV=testing\s*$') { throw 'Pengujian dibatalkan: APP_ENV harus testing.' }
php artisan config:clear
php artisan test --filter OperationalCompletionTest
if ($LASTEXITCODE -ne 0) { throw 'Feature test Laravel gagal.' }
Set-Location "$root\frontend"
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build React gagal.' }
Write-Host 'Feature tests and React build succeeded. Continue with Playwright on live servers.'
