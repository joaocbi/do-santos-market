/**
 * Script DEFINITIVO para configurar POSTGRES_URL na Vercel
 * Remove todas as instâncias e adiciona novamente de forma limpa
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
console.log(`📏 Tamanho: ${POSTGRES_URL.length} caracteres\n`);

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Vercel CLI não encontrado!');
  console.log('\n📋 Configure MANUALMENTE no dashboard:');
  console.log('   1. Acesse: https://vercel.com/dashboard');
  console.log('   2. Vá em Settings → Environment Variables');
  console.log('   3. Adicione: POSTGRES_URL');
  console.log(`   4. Value: ${POSTGRES_URL}`);
  console.log('   5. Marque: Production, Preview, Development');
  console.log('   6. Clique em Save\n');
  process.exit(1);
}

// Check if logged in
try {
  const whoami = execSync('vercel whoami', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(`✅ Logado como: ${whoami.trim()}\n`);
} catch (error) {
  console.error('❌ Não está logado na Vercel CLI!');
  console.log('\nExecute: vercel login');
  process.exit(1);
}

const environments = ['production', 'preview', 'development'];

console.log('🧹 Removendo variáveis antigas (se existirem)...\n');

// Remove all existing instances
for (const env of environments) {
  try {
    execSync(`vercel env rm POSTGRES_URL ${env} --yes`, { 
      stdio: 'ignore',
      shell: true
    });
    console.log(`   ✅ Removido de ${env}`);
  } catch (e) {
    // Variable might not exist, that's ok
    console.log(`   ℹ️  Não havia variável em ${env}`);
  }
}

console.log('\n📝 Adicionando variável nova...\n');

// Write to temp file to avoid issues with special characters
const tempFile = path.join(process.cwd(), 'temp-postgres-url.txt');
fs.writeFileSync(tempFile, POSTGRES_URL, 'utf-8');

// Add to each environment
for (const env of environments) {
  try {
    console.log(`📝 Configurando ${env}...`);
    
    if (process.platform === 'win32') {
      // Windows: use type command
      execSync(`type "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        shell: true,
        encoding: 'utf-8'
      });
    } else {
      // Unix: use cat
      execSync(`cat "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        encoding: 'utf-8'
      });
    }
    
    console.log(`   ✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`   ❌ Erro ao configurar ${env}: ${error.message}`);
    console.log(`   💡 Configure manualmente no dashboard para ${env}\n`);
  }
}

// Clean up
if (fs.existsSync(tempFile)) {
  fs.unlinkSync(tempFile);
}

// Verify
console.log('🔍 Verificando configuração...\n');
try {
  const output = execSync('vercel env ls', { encoding: 'utf-8' });
  if (output.includes('POSTGRES_URL')) {
    console.log('✅ POSTGRES_URL encontrada na Vercel!\n');
    console.log(output);
  } else {
    console.log('⚠️  POSTGRES_URL não aparece na lista');
    console.log('   Isso pode ser normal se acabou de ser adicionada\n');
  }
} catch (e) {
  console.log('⚠️  Não foi possível verificar automaticamente\n');
}

console.log('\n✅ Configuração concluída!\n');
console.log('⚠️  CRÍTICO: Faça um redeploy AGORA!\n');
console.log('📋 Opções para redeploy:');
console.log('1. Dashboard: Deployments → Último deploy → 3 pontos → Redeploy');
console.log('2. CLI: vercel --prod');
console.log('3. Git: git commit --allow-empty -m "fix: POSTGRES_URL definitivo" && git push\n');
console.log('⏱️  Aguarde 2-3 minutos após o redeploy e teste novamente\n');
