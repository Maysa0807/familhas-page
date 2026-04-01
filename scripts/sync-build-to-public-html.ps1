#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

Write-Host '>> ng build (producao)...' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$src = Join-Path $root 'dist\familhas-page\browser'
$dest = Join-Path $root 'public_html'
if (-not (Test-Path $src)) {
  throw "Saida do build nao encontrada: $src"
}

Write-Host '>> Copiando dist -> public_html (mantendo .htaccess)...' -ForegroundColor Cyan
Get-ChildItem -Path $dest -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne '.htaccess' } |
  Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $src '*') -Destination $dest -Recurse -Force

Write-Host '>> public_html atualizado.' -ForegroundColor Green
