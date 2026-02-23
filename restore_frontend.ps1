$baseDir = "C:\Users\Dilmer\Desktop\Proyectos\Proyectos de HTML CSS JS\Proyecto-Intercambio_Servicios_y_Habilidades\SEMACKROFrontend"
$backupPath = "$baseDir\Descubrir_backup.html"
$jsPath = "$baseDir\js\descubrir.js"
$cssPath = "$baseDir\css\descubrir.css"
$transPath = "$baseDir\js\translations.js"

# Create directories if not exist
if (!(Test-Path "$baseDir\js")) { New-Item -ItemType Directory -Force -Path "$baseDir\js" }
if (!(Test-Path "$baseDir\css")) { New-Item -ItemType Directory -Force -Path "$baseDir\css" }

$content = Get-Content $backupPath -Encoding UTF8

# 1. CSS Restoration
# CSS1: 206 - 1493 (Indices 205..1492)
# CSS2: 7867 - 7997 (Indices 7866..7996)
$css1 = $content[205..1492]
$css2 = $content[7866..7996]
$finalCss = $css1 + $css2
$finalCss | Set-Content $cssPath -Encoding UTF8
Write-Host "CSS Restored."

# 2. JS Restoration
# JS1: 2312 - 7755 (Indices 2311..7754)
# JS2: 7793 - 7845 (Indices 7792..7844)
# JS3: 8000 - 8623 (Indices 7999..8622)
$js1 = $content[2311..7754]
$js2 = $content[7792..7844]
$js3 = $content[7999..8622]
$finalJs = $js1 + $js2 + $js3
$finalJs | Set-Content $jsPath -Encoding UTF8
Write-Host "JS Restored."

# 3. Translations Restoration
# Trans: 8628 - 9157 (Indices 8627..9156)
$trans = $content[8627..9156]
$trans | Set-Content $transPath -Encoding UTF8
Write-Host "Translations Restored."
