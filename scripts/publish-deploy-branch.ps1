#Requires -Version 5.1
# Atualiza a branch deploy (raiz = site estatico) a partir de public_html na main.
# NAO use "git add ." na deploy: node_modules pode existir na working tree.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

function Invoke-Git {
  param([string[]]$GitArgs)
  & git @GitArgs
  if ($LASTEXITCODE -ne 0) { throw "git $($GitArgs -join ' ') falhou (exit $LASTEXITCODE)" }
}

$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel detectar a branch atual.' }
if ($branch -ne 'main') {
  Write-Host ">> Alternando para branch main (estava: $branch)..." -ForegroundColor Yellow
  Invoke-Git @('checkout', 'main')
}

# Mudancas fora de public_html (pathspec do Git)
$dirty = git status --porcelain -- . ':(exclude)public_html'
if ($dirty) {
  throw "Ha alteracoes fora de public_html. Faca commit, stash ou descarte antes: `n$($dirty -join "`n")"
}

if (-not (Test-Path (Join-Path $root 'public_html\index.html'))) {
  throw 'public_html\index.html nao existe. Rode npm run deploy:sync primeiro.'
}

Invoke-Git @('add', 'public_html')
$stagedPublic = git diff --cached --name-only
if ($stagedPublic) {
  Invoke-Git @('commit', '-m', 'chore: atualiza build de producao (public_html)')
} else {
  Write-Host '>> Nenhuma mudanca em public_html para commit na main.' -ForegroundColor DarkGray
}

Invoke-Git @('push', 'origin', 'main')
Invoke-Git @('fetch', 'origin')
Invoke-Git @('checkout', 'deploy')
Invoke-Git @('reset', '--hard', 'origin/deploy')

if (git ls-files) {
  Invoke-Git @('rm', '-rf', '--', '.')
}

Invoke-Git @('checkout', 'main', '--', 'public_html')
Invoke-Git @('restore', '--staged', 'public_html')

Move-Item -Path (Join-Path $root 'public_html\*') -Destination $root -Force
Remove-Item -Path (Join-Path $root 'public_html') -Recurse -Force

$toAdd = @('.htaccess', 'index.html', 'favicon.ico', 'assets', 'media')
foreach ($p in $toAdd) {
  $full = Join-Path $root $p
  if (Test-Path $full) {
    Invoke-Git @('add', '--', $p)
  }
}

Get-ChildItem -Path $root -File | Where-Object {
  $_.Name -match '^(main|polyfills|scripts|styles)-.+\.(js|css)$'
} | ForEach-Object { Invoke-Git @('add', '--', $_.Name) }

$toCommit = git diff --cached --name-only
if (-not $toCommit) {
  Invoke-Git @('checkout', 'main')
  throw 'Nada foi preparado para commit na deploy. Verifique o build e public_html.'
}

Invoke-Git @('commit', '-m', 'deploy: atualiza build')
Invoke-Git @('push', 'origin', 'deploy')
Invoke-Git @('checkout', 'main')

Write-Host '>> Branch deploy publicada. Hostinger deve puxar em breve.' -ForegroundColor Green
