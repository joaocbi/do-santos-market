/**
 * Script para verificar e corrigir POSTGRES_URL na Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando POSTGRES_URL na Vercel...\n');

// Read from .env.local (if exists)
const envLocalPath = path.join(process.cwd(), '.env.local');
let localPostgresUrl = '';

if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = envLocal.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      localPostgresUrl = line.substring('POSTGRES_URL='.length).trim();
      // Remove quotes
      if ((localPostgresUrl.startsWith('"') && localPostgresUrl.endsWith('"')) || 
          (localPostgresUrl.startsWith("'") && localPostgresUrl.endsWith("'"))) {
        localPostgresUrl = localPostgresUrl.slice(1, -1);
      }
      // Clean
      localPostgresUrl = localPostgresUrl.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

if (!localPostgresUrl) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  console.log('\n📋 Para obter a connection string:');
  console.log('1. Acesse: https://vercel.com/dashboard');
  console.log('2. Vá em Storage → Seu banco Postgres');
  console.log('3. Copie a connection string');
  console.log('4. Execute: node scripts/add-postgres-env.js "sua-connection-string"\n');
  process.exit(1);
}

console.log('✅ Connection string encontrada no .env.local');
console.log('📝 Verificando se está configurada na Vercel...\n');

// Check if it's already configured
try {
  const envList = execSync('vercel env ls', { encoding: 'utf-8' });
  if (envList.includes('POSTGRES_URL')) {
    console.log('✅ POSTGRES_URL já está configurada na Vercel');
    console.log('\n⚠️  Se ainda não funciona, pode ser que:');
    console.log('1. O valor está incorreto ou vazio');
    console.log('2. Precisa fazer um redeploy');
    console.log('\n📋 Vamos reconfigurar para garantir...\n');
  }
} catch (error) {
  console.log('ℹ️  Verificando variáveis...\n');
}

// Remove existing and add fresh
const environments = ['production', 'preview', 'development'];

console.log('🔄 Reconfigurando POSTGRES_URL...\n');

for (const env of environments) {
  try {
    // Remove existing
    try {
      execSync(`echo "y" | vercel env rm POSTGRES_URL ${env}`, { 
        stdio: 'ignore',
        input: 'y\n'
      });
      console.log(`🗑️  Removida versão antiga de ${env}`);
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    // Add new
    console.log(`➕ Adicionando para ${env}...`);
    const command = `echo "${localPostgresUrl}" | vercel env add POSTGRES_URL ${env}`;
    execSync(command, { 
      stdio: 'inherit',
      input: localPostgresUrl + '\n'
    });
    console.log(`✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`❌ Erro ao configurar ${env}:`, error.message);
    console.log(`\nTente manualmente:`);
    console.log(`  vercel env add POSTGRES_URL ${env}\n`);
  }
}

console.log('✅ Configuração concluída!\n');
console.log('📋 Próximos passos:');
console.log('1. Faça um redeploy na Vercel (ou aguarde deploy automático)');
console.log('2. Teste o endpoint: https://dosantosmarket.com.br/api/orders/diagnostic');
console.log('3. Tente criar um pedido no site\n');
