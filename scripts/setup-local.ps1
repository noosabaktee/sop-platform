param([switch]$SkipDependencies,[switch]$SkipDatabase)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Require-Tool([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "Executable tidak ditemukan: $name" }
}
function Run-Step([scriptblock]$command,[string]$failure) {
  & $command
  if ($LASTEXITCODE -ne 0) { throw $failure }
}
function Read-Env([string]$path,[string]$name) {
  $line = Get-Content -LiteralPath $path | Where-Object { $_ -match ('^\s*' + [regex]::Escape($name) + '\s*=') } | Select-Object -Last 1
  if (-not $line) { return '' }
  return (($line -split '=',2)[1]).Trim().Trim('"').Trim("'")
}
function Set-Env([string]$path,[string]$name,[string]$value) {
  $content = Get-Content -LiteralPath $path -Raw
  $escaped = [regex]::Escape($name)
  if ($content -match "(?m)^$escaped=") { $content = [regex]::Replace($content,"(?m)^$escaped=.*$","$name=$value") }
  else { $content = $content.TrimEnd() + [Environment]::NewLine + "$name=$value" + [Environment]::NewLine }
  Set-Content -LiteralPath $path -Value $content -Encoding utf8
}

Require-Tool 'php'
Require-Tool 'composer'
Require-Tool 'node'
Require-Tool 'npm.cmd'

$requiredDirectories = @(
  'backend\bootstrap\cache','backend\storage\framework\cache\data',
  'backend\storage\framework\sessions','backend\storage\framework\views',
  'backend\storage\logs'
)
foreach ($relative in $requiredDirectories) {
  $target = Join-Path $root $relative
  if (-not (Test-Path -LiteralPath $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
}

$backendEnv = Join-Path $root 'backend\.env'
$testingEnv = Join-Path $root 'backend\.env.testing'
$frontendEnv = Join-Path $root 'frontend\.env'
if (-not (Test-Path -LiteralPath $backendEnv)) { Copy-Item -LiteralPath (Join-Path $root 'backend\.env.example') -Destination $backendEnv }
if (-not (Test-Path -LiteralPath $frontendEnv)) { Copy-Item -LiteralPath (Join-Path $root 'frontend\.env.example') -Destination $frontendEnv }
if (-not (Test-Path -LiteralPath $testingEnv)) {
  Copy-Item -LiteralPath (Join-Path $root 'backend\.env.testing.example') -Destination $testingEnv
  foreach ($key in @('DB_HOST','DB_PORT','DB_USERNAME','DB_PASSWORD')) {
    $value = Read-Env $backendEnv $key
    if ($value) { Set-Env $testingEnv $key $value }
  }
}

Push-Location (Join-Path $root 'backend')
try {
  if (-not $SkipDependencies) { Run-Step { composer install --no-interaction } 'Composer install gagal.' }
  $appKey = Read-Env $backendEnv 'APP_KEY'
  if (-not $appKey) { Run-Step { php artisan key:generate --force } 'APP_KEY gagal dibuat.'; $appKey = Read-Env $backendEnv 'APP_KEY' }
  if ($appKey -and -not (Read-Env $testingEnv 'APP_KEY')) { Set-Env $testingEnv 'APP_KEY' $appKey }
  Run-Step { php artisan optimize:clear } 'Laravel cache gagal dibersihkan.'
  if (-not $SkipDatabase) {
    Write-Host 'Menjalankan migration aman + seeder idempotent pada database aplikasi (tanpa fresh/wipe)...' -ForegroundColor Yellow
    Run-Step { php artisan migrate --seed --force } 'Migration/seeding gagal. Periksa PostgreSQL dan backend/.env.'
  }
} finally { Pop-Location }

Push-Location (Join-Path $root 'frontend')
try {
  if (-not $SkipDependencies) { Run-Step { npm.cmd ci } 'npm ci gagal.' }
} finally { Pop-Location }

Write-Host 'Setup lokal selesai. Database test harus bernama sop_platform_test dan terpisah dari database aplikasi.' -ForegroundColor Green
Write-Host 'Jalankan scripts\verify-local.ps1, lalu scripts\run-local-windows.ps1.'
