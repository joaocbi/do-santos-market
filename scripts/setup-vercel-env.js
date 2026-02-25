/**
 * Script para configurar POSTGRES_URL na Vercel
 * Lê do .env.local e configura automaticamente
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
  console.log('\nCertifique-se de que o arquivo .env.local contém:');
  console.log('POSTGRES_URL="postgresql://..."');
  process.exit(1);
}

console.log('✅ Connection string encontrada no .env.local');
console.log('📝 Configurando POSTGRES_URL na Vercel...\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Vercel CLI não encontrado!');
  console.log('\n📋 Opções:');
  console.log('1. Instalar Vercel CLI: npm i -g vercel');
  console.log('2. Ou configure manualmente no dashboard:\n');
  console.log('   https://vercel.com/dashboard');
  console.log('   → Settings → Environment Variables');
  console.log('   → Add: POSTGRES_URL');
  console.log(`   → Value: ${POSTGRES_URL.substring(0, 50)}...`);
  console.log('   → Marque: Production, Preview, Development\n');
  process.exit(1);
}

// Check if logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Não está logado na Vercel CLI!');
  console.log('\nExecute: vercel login');
  process.exit(1);
}

const environments = ['production', 'preview', 'development'];

console.log('🔧 Configurando para todos os ambientes...\n');

for (const env of environments) {
  try {
    console.log(`📝 Configurando para ${env}...`);
    
    // Check if already exists
    try {
      const checkOutput = execSync(`vercel env ls ${env}`, { encoding: 'utf-8', stdio: 'pipe' });
      if (checkOutput.includes('POSTGRES_URL')) {
        console.log(`   ⚠️  POSTGRES_URL já existe em ${env}`);
        console.log(`   💡 Para atualizar, remova primeiro: vercel env rm POSTGRES_URL ${env}`);
        continue;
      }
    } catch (e) {
      // Variable doesn't exist, continue
    }
    
    // Add the variable
    // Use a temporary file to pass the value
    const tempFile = path.join(process.cwd(), 'temp-postgres-url.txt');
    fs.writeFileSync(tempFile, POSTGRES_URL);
    
    try {
      execSync(`type ${tempFile} | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        shell: true
      });
      console.log(`   ✅ ${env} configurado\n`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao configurar ${env} automaticamente`);
      console.log(`   💡 Configure manualmente no dashboard da Vercel\n`);
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

console.log('✅ Configuração concluída!\n');
console.log('📋 Próximos passos:');
console.log('1. Verifique no dashboard: https://vercel.com/dashboard');
console.log('   → Settings → Environment Variables');
console.log('2. Certifique-se de que POSTGRES_URL está marcada para todos os ambientes');
console.log('3. Faça um redeploy:');
console.log('   - Dashboard → Deployments → 3 pontos → Redeploy');
console.log('   - Ou: git commit --allow-empty -m "trigger redeploy" && git push');
console.log('4. Teste criando um pedido no site\n');
