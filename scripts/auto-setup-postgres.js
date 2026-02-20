/**
 * Script automático para configurar Postgres
 * Tenta usar a API da Vercel quando possível
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function checkExistingDatabase() {
  console.log('🔍 Verificando configuração atual...\n');

  // Check environment variables
  try {
    const envOutput = execSync('vercel env ls', { encoding: 'utf-8' });
    if (envOutput.includes('POSTGRES_URL')) {
      console.log('✅ POSTGRES_URL já está configurado!\n');
      return true;
    }
  } catch (e) {
    // Ignore
  }

  return false;
}

async function createDatabaseViaAPI() {
  console.log('🚀 Tentando criar banco via API da Vercel...\n');

  try {
    // Read project config
    const projectConfigPath = path.join(process.cwd(), '.vercel', 'project.json');
    if (!fs.existsSync(projectConfigPath)) {
      console.log('❌ Projeto não está linkado. Execute: vercel link\n');
      return false;
    }

    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf-8'));
    const projectId = projectConfig.projectId;
    const teamId = projectConfig.orgId;

    console.log(`📦 Projeto: ${projectConfig.projectName}`);
    console.log(`🆔 Project ID: ${projectId}\n`);

    // Note: A API da Vercel para criar databases requer autenticação específica
    // e pode não estar disponível via API pública simples
    // Vamos fornecer instruções claras

    console.log('ℹ️  A criação de banco precisa ser feita no dashboard.\n');
    console.log('📋 Instruções rápidas:\n');
    console.log('1. Acesse: https://vercel.com/dashboard');
    console.log(`2. Projeto: ${projectConfig.projectName}`);
    console.log('3. Storage → Create Database → Neon Postgres');
    console.log('4. Copie a connection string\n');
    console.log('Depois, execute este comando:');
    console.log('  node scripts/add-postgres-env.js "sua-connection-string"\n');

    return false;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  Configuração Automática do Postgres\n');

  const exists = await checkExistingDatabase();
  
  if (exists) {
    console.log('✅ Postgres já está configurado!');
    console.log('\nPróximo passo: Execute o schema SQL no SQL Editor da Vercel');
    console.log('Ou execute: node scripts/setup-postgres.js (com POSTGRES_URL configurado)\n');
    return;
  }

  await createDatabaseViaAPI();
}

main().catch(console.error);
