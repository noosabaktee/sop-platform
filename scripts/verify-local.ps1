param(
  [switch]$SkipRealBrowser,
  [ValidateRange(1,65535)][int]$BackendPort = 8000,
  [ValidateRange(1,65535)][int]$FrontendPort = 5173
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Read-Env([string]$path,[string]$name) {
  $line = Get-Content -LiteralPath $path | Where-Object { $_ -match ('^\s*' + [regex]::Escape($name) + '\s*=') } | Select-Object -Last 1
  if (-not $line) { return '' }
  return (($line -split '=',2)[1]).Trim().Trim('"').Trim("'")
}
function Run-Step([scriptblock]$command,[string]$failure) {
  & $command
  if ($LASTEXITCODE -ne 0) { throw $failure }
}
foreach ($tool in @('php','composer','node','npm.cmd','python')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Executable tidak ditemukan: $tool" }
}
$appEnv = Join-Path $root 'backend\.env'
$testEnv = Join-Path $root 'backend\.env.testing'
if (-not (Test-Path -LiteralPath $appEnv) -or -not (Test-Path -LiteralPath $testEnv)) {
  throw 'backend/.env dan backend/.env.testing wajib tersedia. Jalankan scripts/setup-local.ps1.'
}
$prodDb = Read-Env $appEnv 'DB_DATABASE'
$testDb = Read-Env $testEnv 'DB_DATABASE'
$testConnection = Read-Env $testEnv 'DB_CONNECTION'
if (-not $prodDb -or -not $testDb -or $prodDb -eq $testDb -or $testConnection -ne 'pgsql' -or $testDb -notmatch '(_test|_testing)$') {
  throw 'Konfigurasi DB test tidak aman: wajib PostgreSQL, berbeda dari DB aplikasi, dan berakhiran _test/_testing.'
}

$keys = @('APP_ENV','APP_KEY','DB_CONNECTION','DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD','CACHE_STORE','SESSION_DRIVER','QUEUE_CONNECTION','MAIL_MAILER','SANCTUM_STATEFUL_DOMAINS')
$old = @{}
foreach ($key in $keys) {
  $old[$key] = [Environment]::GetEnvironmentVariable($key,'Process')
  $value = Read-Env $testEnv $key
  if ($value) { [Environment]::SetEnvironmentVariable($key,$value,'Process') }
}
$env:APP_ENV='testing'; $env:DB_CONNECTION='pgsql'; $env:DB_DATABASE=$testDb
$server = $null
$serverChildId = $null
try {
  Push-Location (Join-Path $root 'backend')
  try {
    Run-Step { php artisan config:clear } 'Laravel config clear gagal.'
    Run-Step { php artisan test } 'Laravel feature tests gagal.'
    Run-Step { php artisan migrate --seed --force } 'Persiapan database browser E2E gagal.'
  } finally { Pop-Location }

  Push-Location (Join-Path $root 'frontend')
  try {
    Run-Step { npm.cmd run build } 'Build frontend gagal.'
    Run-Step { node src/tests/grid_bridge_test.cjs } 'Grid bridge test gagal.'
    Run-Step { node src/tests/module_bridge_test.cjs } 'Module bridge test gagal.'
    Run-Step { npm.cmd exec playwright test smoke.spec.ts } 'Playwright mock/UI regression gagal.'
  } finally { Pop-Location }

  Push-Location $root
  try {
    Run-Step { python scripts/check-source-integrity.py } 'Source/UI integrity check gagal.'
    Run-Step { node scripts/test-domain-projection.cjs } 'Domain projection contract test gagal.'
    Run-Step { node scripts/test-native-transfer.cjs } 'Warehouse transfer contract test gagal.'
  } finally { Pop-Location }

  if (-not $SkipRealBrowser) {
    $listener = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
    if ($listener) { throw "Port $BackendPort sedang dipakai. Pilih port E2E lain atau hentikan server tersebut agar E2E tidak berisiko memakai database yang salah." }
    $stdout = Join-Path $root 'backend\storage\logs\e2e-server.out.log'
    $stderr = Join-Path $root 'backend\storage\logs\e2e-server.err.log'
    # The array driver is ideal for isolated PHP tests, but it intentionally
    # discards state after every HTTP request. The browser flow needs a
    # short-lived persistent session across CSRF, login, and /me requests.
    $env:SESSION_DRIVER='file'
    # Sanctum only starts Laravel's web session for an explicitly stateful
    # origin. Match the Vite port selected for this isolated browser run.
    $env:SANCTUM_STATEFUL_DOMAINS="localhost:$FrontendPort,127.0.0.1:$FrontendPort"
    $server = Start-Process -FilePath 'php' -ArgumentList @('artisan','serve','--host=127.0.0.1',"--port=$BackendPort") -WorkingDirectory (Join-Path $root 'backend') -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    $ready = $false
    for ($i=0; $i -lt 40; $i++) {
      try { if ((Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/up" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { $ready=$true; break } } catch {}
      Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw 'Laravel E2E server tidak siap. Periksa backend/storage/logs/e2e-server.err.log.' }
    $e2eListener = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($e2eListener) {
      $child = Get-CimInstance Win32_Process -Filter "ProcessId=$($e2eListener.OwningProcess)"
      if ($child.CommandLine -like "*$root*" -and $child.CommandLine -like '*server.php*') {
        $serverChildId = $e2eListener.OwningProcess
      } else {
        throw 'Listener E2E tidak dapat diverifikasi sebagai proses Laravel workspace ini.'
      }
    }
    Push-Location (Join-Path $root 'frontend')
    try {
      $env:SOP_REAL_E2E='1'
      $env:SOP_BACKEND_URL="http://127.0.0.1:$BackendPort"
      $env:SOP_FRONTEND_PORT="$FrontendPort"
      Run-Step { npm.cmd run test:e2e:real } 'Playwright real Laravel/PostgreSQL gagal.'
    } finally {
      Remove-Item Env:SOP_REAL_E2E -ErrorAction SilentlyContinue
      Remove-Item Env:SOP_BACKEND_URL -ErrorAction SilentlyContinue
      Remove-Item Env:SOP_FRONTEND_PORT -ErrorAction SilentlyContinue
      Pop-Location
    }
  }
} finally {
  if ($serverChildId -and (Get-Process -Id $serverChildId -ErrorAction SilentlyContinue)) { Stop-Process -Id $serverChildId -Force }
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  foreach ($key in $keys) {
    if ($null -eq $old[$key]) { [Environment]::SetEnvironmentVariable($key,$null,'Process') }
    else { [Environment]::SetEnvironmentVariable($key,[string]$old[$key],'Process') }
  }
}
Write-Host "Verifikasi selesai pada database test '$testDb'; database aplikasi '$prodDb' tidak direset." -ForegroundColor Green
