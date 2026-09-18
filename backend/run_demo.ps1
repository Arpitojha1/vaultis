$ErrorActionPreference = "Stop"
$env:DATABASE_URL="sqlite:///./vaultis.db"
$env:DEMO_MODE="1"
$env:ENABLE_TAMPER_DEMO_ENDPOINT="true"
$env:DEMO_CAPTURE_LLM_REQUEST="true"

Write-Host "Activating venv..."
.\venv\Scripts\Activate.ps1

Write-Host "Resetting database..."
..\scripts\reset_demo_db.ps1 -Yes

Write-Host "Starting backend in the background..."
$backendProcess = Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

Write-Host "Running demo verification..."
try {
    & .\venv\Scripts\python.exe ..\scripts\demo_verify.py
} finally {
    Write-Host "Stopping backend..."
    Stop-Process -Id $backendProcess.Id -Force
}
