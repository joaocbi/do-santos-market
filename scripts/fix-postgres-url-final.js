/**
 * Script final para corrigir POSTGRES_URL removendo aspas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env.production to get the current value
const envPath = path.join(process.cwd(), '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production não encontrado. Execute: vercel env pull .env.production');
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const lines = envFile.split(/\r?\n/);
let postgresUrl = '';

for (const line of lines) {
  if (line.startsWith('POSTGRES_URL=')) {
    postgresUrl = line.substring('POSTGRES_URL='.length);
    // Remove ALL quotes (single and double)
    postgresUrl = postgresUrl.replace(/^["']+|["']+$/g, '');
    // Remove ALL whitespace, line breaks, tabs
    postgresUrl = postgresUrl.replace(/[\r\n\t\s]/g, '');
    break;
  }
}

if (!postgresUrl) {
  console.error('❌ POSTGRES_URL não encontrada no .env.production');
  process.exit(1);
}

console.log('✅ Connection string limpa encontrada');
console.log('📝 Tamanho:', postgresUrl.length);
console.log('📝 Primeiros 50 caracteres:', postgresUrl.substring(0, 50));
console.log('\n🔄 Removendo variável antiga...\n');

// Remove from all environments
const environments = ['production', 'preview', 'development'];

for (const env of environments) {
  try {
    execSync(`echo y | vercel env rm POSTGRES_URL ${env}`, { 
      stdio: 'ignore' 
    });
    console.log(`✅ Removida de ${env}`);
  } catch (e) {
    // Ignore if doesn't exist
  }
}

console.log('\n➕ Adicionando variável limpa...\n');

// Add clean version
for (const env of environments) {
  try {
    // Write to temp file to avoid shell escaping
    const tempFile = path.join(process.cwd(), `temp-url-${env}.txt`);
    fs.writeFileSync(tempFile, postgresUrl, 'utf-8');
    
    execSync(`type "${tempFile}" | vercel env add POSTGRES_URL ${env}`, {
      stdio: 'inherit',
      shell: true
    });
    
    // Clean up
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    console.log(`✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`❌ Erro em ${env}:`, error.message);
  }
}

console.log('✅ Configuração concluída!\n');
console.log('📋 Faça um redeploy agora:\n');
console.log('   vercel --prod\n');
