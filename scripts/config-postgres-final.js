/**
 * Script FINAL para configurar POSTGRES_URL no projeto do-santos-market-o2nu
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const POSTGRES_URL = 'postgresql://neondb_owner:npg_TvkWxb9LUA8F@ep-dry-star-aiglbgis-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log('📝 Configurando POSTGRES_URL no projeto do-santos-market-o2nu\n');
console.log(`Connection string: ${POSTGRES_URL.substring(0, 50)}...\n`);

// Check if logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Não está logado na Vercel CLI!');
  console.log('\nExecute: vercel login');
  process.exit(1);
}

// Ensure we're linked to the correct project
try {
  execSync('vercel link --project=do-santos-market-o2nu --yes', { stdio: 'ignore' });
  console.log('✅ Projeto vinculado: do-santos-market-o2nu\n');
} catch (e) {
  console.log('⚠️  Não foi possível vincular projeto automaticamente\n');
}

const environments = ['production', 'preview', 'development'];
const tempFile = path.join(process.cwd(), 'temp-postgres.txt');
fs.writeFileSync(tempFile, POSTGRES_URL, 'utf-8');

console.log('🔧 Configurando variável para todos os ambientes...\n');

for (const env of environments) {
  try {
    console.log(`📝 Configurando ${env}...`);
    
    // Remove existing if any
    try {
      execSync(`vercel env rm POSTGRES_URL ${env} --yes`, { 
        stdio: 'ignore',
        shell: true
      });
    } catch (e) {
      // Variable might not exist
    }
    
    try {
      execSync(`vercel env rm URL_POSTGRES ${env} --yes`, { 
        stdio: 'ignore',
        shell: true
      });
    } catch (e) {
      // Variable might not exist
    }
    
    // Add new variable
    if (process.platform === 'win32') {
      execSync(`type "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        shell: true,
        encoding: 'utf-8'
      });
    } else {
      execSync(`cat "${tempFile}" | vercel env add POSTGRES_URL ${env}`, { 
        stdio: 'inherit',
        encoding: 'utf-8'
      });
    }
    
    console.log(`   ✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
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
    console.log('✅ POSTGRES_URL encontrada!\n');
    console.log(output);
  } else {
    console.log('⚠️  POSTGRES_URL não aparece na lista');
    console.log('   Pode ser que precise de um momento para aparecer\n');
  }
} catch (e) {
  console.log('⚠️  Não foi possível verificar automaticamente\n');
}

console.log('\n✅ Configuração concluída!\n');
console.log('🚀 Fazendo deploy forçado agora...\n');
