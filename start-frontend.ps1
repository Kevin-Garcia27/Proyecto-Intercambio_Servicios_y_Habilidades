# Script para iniciar solo el Frontend
# Uso: .\start-frontend.ps1

Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       SEMACKRO - Frontend Server              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ruta base del proyecto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $projectRoot "SEMACKROFrontend"

# Cambiar al directorio del frontend
Set-Location $frontendPath

Write-Host "🚀 Iniciando Frontend en puerto 5050..." -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
node serve-frontend.js
