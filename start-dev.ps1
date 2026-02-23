# Script para iniciar Frontend y Backend simultáneamente
# Uso: .\start-dev.ps1

Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SEMACKRO - Iniciador de Desarrollo       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Ruta base del proyecto
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "SEMACKROBackend"
$frontendPath = Join-Path $projectRoot "SEMACKROFrontend"

# Verificar que existen los directorios
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ Error: No se encontró la carpeta 'SEMACKROBackend'" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "✗ Error: No se encontró la carpeta 'SEMACKROFrontend'" -ForegroundColor Red
    exit 1
}

# Verificar dependencias del backend
Write-Host "🔍 Verificando dependencias del backend..." -ForegroundColor Yellow
$nodeModulesPath = Join-Path $backendPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Dependencias verificadas" -ForegroundColor Green
Write-Host ""

# Iniciar Backend en nueva ventana
Write-Host "🚀 Iniciando Backend (puerto 3001)..." -ForegroundColor Cyan
$backendScript = Join-Path $backendPath "server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 BACKEND - Puerto 3001' -ForegroundColor Green; npm start"

# Esperar 3 segundos para que el backend inicie
Write-Host "⏳ Esperando que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar Frontend en nueva ventana
Write-Host "🚀 Iniciando Frontend (puerto 5050)..." -ForegroundColor Cyan
$frontendScript = Join-Path $frontendPath "serve-frontend.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🌐 FRONTEND - Puerto 5050' -ForegroundColor Green; node serve-frontend.js"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ¡Servidores Iniciados!                  ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Los servidores están corriendo en ventanas separadas." -ForegroundColor Yellow
Write-Host "   Para detenerlos, cierra las ventanas o presiona Ctrl+C en cada una." -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para cerrar esta ventana"
