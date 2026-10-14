# Run on Windows after PostgreSQL service and Composer/npm dependencies are installed.
# Intentionally does NOT call migrate:fresh: never erase customer data during verification.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Write-Host 'SOP End-to-End verification (NO DOCKER; no database reset)' -ForegroundColor Cyan
foreach ($tool in @('php','composer','npm.cmd')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Missing executable: $tool" }
}
try {
  Push-Location (Join-Path $root 'backend')
  if (-not (Test-Path '.env')) { throw 'backend/.env not configured. See README.md' }
  if (-not (Test-Path 'vendor/autoload.php')) { throw 'Run composer install in backend first.' }
  # Never let an old config cache override DB_DATABASE during isolated feature tests.
  php artisan config:clear
  if ($LASTEXITCODE -ne 0) { throw 'Cannot clear cached Laravel config.' }
  Write-Host 'Running existing migrations (not migrate:fresh)' -ForegroundColor Yellow
  php artisan migrate --force
  if ($LASTEXITCODE -ne 0) { throw 'Laravel migration failed.' }
  # RefreshDatabase tests may DROP TABLES. Never run them against operational data.
  if (-not (Test-Path '.env.testing')) { throw 'Create backend/.env.testing (use .env.testing.example) with a separate PostgreSQL TEST database before running tests.' }
  function Read-EnvValue([string]$file,[string]$name) {
    $line = Get-Content $file | Where-Object { $_ -match ("^\s*" + [regex]::Escape($name) + "\s*=") } | Select-Object -Last 1
    if (-not $line) { return '' }
    return (($line -split '=',2)[1]).Trim().Trim('"').Trim("'")
  }
  $prodDb = Read-EnvValue '.env' 'DB_DATABASE'
  $testDb = Read-EnvValue '.env.testing' 'DB_DATABASE'
  $testConn = Read-EnvValue '.env.testing' 'DB_CONNECTION'
  if (-not $prodDb -or -not $testDb -or $prodDb -eq $testDb -or $testConn -ne 'pgsql' -or $testDb -notmatch '(_test|_testing)$') {
    throw 'Unsafe test DB configuration. DB_CONNECTION must be pgsql, test database must differ from the app database and end in _test or _testing.'
  }
  $oldDbName = $env:DB_DATABASE
  $oldDbConn = $env:DB_CONNECTION
  try {
    # Environment variables override all cached or phpunit.xml configuration.
    $env:DB_DATABASE = $testDb
    $env:DB_CONNECTION = 'pgsql'
    Write-Host "Running isolated feature tests on $testDb (NOT $prodDb)" -ForegroundColor Yellow
    php artisan test --filter='QuotationBuilderTest|FullSalesCycleTest|SalesWorkflowTest|SalesOperationalViewTest|GridSnapshotTest|GridDomainProjectionTest|ProcurementInventoryAccountingTest|DocumentVaultTest|ProjectTasksAuditTest|DomainWorkflowProtectionTest|WarehouseTransferTest|ProcurementApprovalUiTest' 
    if ($LASTEXITCODE -ne 0) { throw 'Laravel feature tests failed.' }
  } finally { $env:DB_DATABASE=$oldDbName; $env:DB_CONNECTION=$oldDbConn }
} finally { Pop-Location }
try {
  Push-Location (Join-Path $root 'frontend')
  if (-not (Test-Path 'node_modules')) { throw 'Run npm install in frontend first.' }
  Write-Host 'Checking frontend build' -ForegroundColor Yellow
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
  Write-Host 'Checking local grid/module bridge simulations' -ForegroundColor Yellow
  node src/tests/grid_bridge_test.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Grid bridge test failed.' }
  node src/tests/module_bridge_test.cjs
  if ($LASTEXITCODE -ne 0) { throw 'Module bridge test failed.' }
} finally { Pop-Location }
  Push-Location $root
  try {
    node scripts/test-domain-projection.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Domain projection safety test failed.' }
    node scripts/test-native-transfer.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Native warehouse transfer test failed.' }
  } finally { Pop-Location }
Write-Host 'Checks completed. Browser-based E2E requires separately: npm run test:e2e' -ForegroundColor Green
