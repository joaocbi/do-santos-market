# Script para criar repositorio no GitHub e fazer push
# Execute: .\setup-github.ps1

$repoName = "do-santos-market"
$description = "E-commerce Do Santos Market"

Write-Host "=== Configuracao do Repositorio GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Verificar configuracao Git
Write-Host "Verificando configuracao Git..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser) {
    Write-Host "Erro: Git user.name nao configurado" -ForegroundColor Red
    exit 1
}

Write-Host "Usuario: $gitUser" -ForegroundColor Green
Write-Host "Email: $gitEmail" -ForegroundColor Green
Write-Host ""

# Extrair username do GitHub do email
$githubUser = $gitEmail -replace '@.*', ''
if ($gitEmail -match '(\d+)\+(\w+)@') {
    $githubUser = $matches[2]
}

Write-Host "Username GitHub detectado: $githubUser" -ForegroundColor Cyan
Write-Host ""

# Abrir GitHub no navegador
Write-Host "Abrindo GitHub para criar repositorio..." -ForegroundColor Yellow
Start-Process "https://github.com/new"

Write-Host ""
Write-Host "INSTRUCOES:" -ForegroundColor Yellow
Write-Host "1. Nome do repositorio: $repoName" -ForegroundColor White
Write-Host "2. Descricao: $description" -ForegroundColor White
Write-Host "3. Escolha: Publico ou Privado" -ForegroundColor White
Write-Host "4. NAO marque nenhuma opcao (README, .gitignore, license)" -ForegroundColor Red
Write-Host "5. Clique em 'Create repository'" -ForegroundColor White
Write-Host ""

# Aguardar confirmacao
Write-Host "Apos criar o repositorio no GitHub, pressione ENTER para continuar..." -ForegroundColor Cyan
$null = Read-Host

# Adicionar remote e fazer push
Write-Host ""
Write-Host "Configurando remote origin..." -ForegroundColor Yellow

# Remover remote se ja existir
git remote remove origin 2>$null

# Adicionar novo remote
$repoUrl = "https://github.com/$githubUser/$repoName.git"
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote configurado: $repoUrl" -ForegroundColor Green
} else {
    Write-Host "Erro ao configurar remote. Tente manualmente:" -ForegroundColor Red
    Write-Host $repoUrl -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Fazendo push para GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCESSO! Repositorio criado e codigo enviado!" -ForegroundColor Green
    Write-Host "URL: https://github.com/$githubUser/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximo passo: Deploy na Vercel" -ForegroundColor Yellow
    Write-Host "Acesse: https://vercel.com e importe o repositorio" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Erro ao fazer push. Possiveis causas:" -ForegroundColor Red
    Write-Host "1. Repositorio nao foi criado no GitHub" -ForegroundColor Yellow
    Write-Host "2. Nome do usuario incorreto (tente manualmente)" -ForegroundColor Yellow
    Write-Host "3. Precisa autenticar (use GitHub Desktop ou Personal Access Token)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comando manual:" -ForegroundColor Cyan
    Write-Host "git remote add origin https://github.com/SEU-USUARIO/do-santos-market.git" -ForegroundColor White
    Write-Host "git push -u origin main" -ForegroundColor White
}
