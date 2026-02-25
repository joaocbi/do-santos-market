/**
 * Script para atualizar POSTGRES_URL na Vercel com o valor do .env.local
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
      // Remove quotes
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      // Remove line breaks and extra whitespace
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

console.log('✅ Connection string encontrada no .env.local');
console.log(`📝 Valor: ${POSTGRES_URL.substring(0, 50)}...`);
console.log('\n🔄 Atualizando variável na Vercel...\n');

// Check if Vercel CLI is installed and logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Não está logado na Vercel CLI!');
  console.log('\nExecute: vercel login');
  process.exit(1);
}

const environments = ['production', 'preview', 'development'];

for (const env of environments) {
  try {
    console.log(`📝 Atualizando ${env}...`);
    
    // Remove existing variable
    try {
      execSync(`vercel env rm POSTGRES_URL ${env} --yes`, { 
        stdio: 'ignore',
        shell: true
      });
      console.log(`   ✅ Variável antiga removida`);
    } catch (e) {
      // Variable might not exist, continue
    }
    
    // Add new variable
    // Create a temporary file with the value
    const tempFile = path.join(process.cwd(), `temp-postgres-${env}.txt`);
    fs.writeFileSync(tempFile, POSTGRES_URL);
    
    try {
      // Use PowerShell to pipe the value
      if (process.platform === 'win32') {
        execSync(`type ${tempFile} | vercel env add POSTGRES_URL ${env}`, { 
          stdio: 'inherit',
          shell: true
        });
      } else {
        execSync(`cat ${tempFile} | vercel env add POSTGRES_URL ${env}`, { 
          stdio: 'inherit'
        });
      }
      console.log(`   ✅ ${env} atualizado\n`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao atualizar ${env} automaticamente`);
      console.log(`   💡 Atualize manualmente no dashboard:\n`);
      console.log(`      https://vercel.com/dashboard`);
      console.log(`      → Settings → Environment Variables`);
      console.log(`      → Edite POSTGRES_URL para ${env}`);
      console.log(`      → Cole: ${POSTGRES_URL.substring(0, 60)}...\n`);
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}\n`);
  }
}

console.log('✅ Atualização concluída!\n');
console.log('⚠️  IMPORTANTE: Faça um redeploy para aplicar as mudanças!\n');
console.log('📋 Opções para redeploy:');
console.log('1. Dashboard: Deployments → 3 pontos → Redeploy');
console.log('2. CLI: vercel --prod');
console.log('3. Git: git commit --allow-empty -m "trigger redeploy" && git push\n');
