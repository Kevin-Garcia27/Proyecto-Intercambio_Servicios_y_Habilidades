# Script para iniciar solo el Backend
# Uso: .\start-backend.ps1

Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        SEMACKRO - Backend Server              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ruta base del proyecto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "SEMACKROBackend"

# Cambiar al directorio del backend
Set-Location $backendPath

# Verificar dependencias
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Yellow
$nodeModulesPath = Join-Path $backendPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para cerrar"
        exit 1
    }
}

Write-Host "✓ Dependencias verificadas" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando Backend en puerto 3001..." -ForegroundColor Cyan
Write-Host "📡 URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar el servidor
npm start
