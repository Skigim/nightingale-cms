# PowerShell script to standardize case IDs to simple sequential numbers (01, 02, 03, etc.)

$dataPath = "Data\nightingale-data.json"
$backupPath = "Data\nightingale-data-backup-renumber-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

Write-Host "Reading data from $dataPath..." -ForegroundColor Yellow

# Read the JSON file
$jsonContent = Get-Content $dataPath -Raw
$data = $jsonContent | ConvertFrom-Json

# Create backup
Write-Host "Creating backup at $backupPath..." -ForegroundColor Yellow
$jsonContent | Out-File $backupPath -Encoding UTF8

Write-Host "Renumbering case IDs to sequential format..." -ForegroundColor Yellow

$caseCount = 0

foreach ($case in $data.cases) {
    $caseCount++

    # Create new sequential ID with zero-padding (01, 02, 03, etc.)
    $newId = "{0:D2}" -f $caseCount
    $oldId = $case.id

    # Update the case ID
    $case.id = $newId

    Write-Host "  Case ${caseCount}: ${oldId} -> ${newId}" -ForegroundColor Green
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Total cases renumbered: $caseCount" -ForegroundColor White

# Convert back to JSON and save
Write-Host ""
Write-Host "Saving renumbered data..." -ForegroundColor Yellow

$renumberedJson = $data | ConvertTo-Json -Depth 10
$renumberedJson | Out-File $dataPath -Encoding UTF8

Write-Host "Case ID renumbering complete!" -ForegroundColor Green
Write-Host "Sequential IDs: 01, 02, 03, ..., $('{0:D2}' -f $caseCount)" -ForegroundColor Cyan
Write-Host "Original data backed up to: $backupPath" -ForegroundColor Cyan
