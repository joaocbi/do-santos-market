/**
 * Script para configurar POSTGRES_URL no projeto CORRETO
 * Projeto: do-santos-market-o2nu (não dosantosmarket.com.br)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

console.log('✅ Connection string encontrada');
console.log(`📝 Valor: ${POSTGRES_URL.substring(0, 50)}...\n`);

// Check if logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Não está logado na Vercel CLI!');
  console.log('\nExecute: vercel login');
  process.exit(1);
}

console.log('🎯 Configurando no projeto CORRETO: do-santos-market-o2nu\n');

// Link to the correct project first
try {
  console.log('📌 Verificando projeto atual...');
  const currentProject = execSync('vercel project ls', { encoding: 'utf-8' });
  console.log('Projetos disponíveis:', currentProject);
} catch (e) {
  // Continue
}

const environments = ['production', 'preview', 'development'];

// Write to temp file
const tempFile = path.join(process.cwd(), 'temp-postgres-url.txt');
fs.writeFileSync(tempFile, POSTGRES_URL, 'utf-8');

for (const env of environments) {
  try {
    console.log(`📝 Configurando ${env} no projeto do-santos-market-o2nu...`);
    
    // Remove existing (if any)
    try {
      execSync(`vercel env rm POSTGRES_URL ${env} --yes --scope do-santos-market-o2nu`, { 
        stdio: 'ignore',
        shell: true
      });
    } catch (e) {
      // Variable might not exist
    }
    
    // Add new variable - specify project
    if (process.platform === 'win32') {
      execSync(`type "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        shell: true,
        encoding: 'utf-8',
        cwd: process.cwd(),
        env: { ...process.env, VERCEL_PROJECT: 'do-santos-market-o2nu' }
      });
    } else {
      execSync(`cat "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        encoding: 'utf-8',
        env: { ...process.env, VERCEL_PROJECT: 'do-santos-market-o2nu' }
      });
    }
    
    console.log(`   ✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    console.log(`   💡 Configure manualmente no dashboard:\n`);
    console.log(`      1. Acesse: https://vercel.com/dashboard`);
    console.log(`      2. Vá para o projeto: do-santos-market-o2nu`);
    console.log(`      3. Settings → Environment Variables`);
    console.log(`      4. Adicione POSTGRES_URL para ${env}`);
    console.log(`      5. Value: ${POSTGRES_URL.substring(0, 60)}...\n`);
  }
}

// Clean up
if (fs.existsSync(tempFile)) {
  fs.unlinkSync(tempFile);
}

console.log('✅ Configuração concluída!\n');
console.log('⚠️  CRÍTICO: Faça um redeploy do projeto do-santos-market-o2nu!\n');
console.log('📋 No dashboard:');
console.log('   1. Vá para o projeto: do-santos-market-o2nu');
console.log('   2. Deployments → Último deploy → 3 pontos → Redeploy');
console.log('   3. DESMARQUE "Use existing Build Cache"');
console.log('   4. Clique em Redeploy\n');
