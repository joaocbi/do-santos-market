/**
 * Script para readicionar POSTGRES_URL com string limpa
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local não encontrado');
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const lines = envFile.split(/\r?\n/);
let postgresUrl = '';

for (const line of lines) {
  if (line.startsWith('POSTGRES_URL=')) {
    postgresUrl = line.substring('POSTGRES_URL='.length).trim();
    // Remove quotes
    if ((postgresUrl.startsWith('"') && postgresUrl.endsWith('"')) || 
        (postgresUrl.startsWith("'") && postgresUrl.endsWith("'"))) {
      postgresUrl = postgresUrl.slice(1, -1);
    }
    // Clean all whitespace and line breaks
    postgresUrl = postgresUrl.replace(/[\r\n\t\s]/g, '').trim();
    break;
  }
}

if (!postgresUrl) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

console.log('✅ Connection string encontrada e limpa');
console.log('📝 Adicionando à Vercel...\n');

const environments = ['production', 'preview', 'development'];

for (const env of environments) {
  try {
    console.log(`Adicionando para ${env}...`);
    // Use a temporary file to avoid shell escaping issues
    const tempFile = path.join(process.cwd(), 'temp-postgres-url.txt');
    fs.writeFileSync(tempFile, postgresUrl);
    
    try {
      execSync(`type "${tempFile}" | vercel env add POSTGRES_URL ${env}`, {
        stdio: 'inherit',
        shell: true
      });
      console.log(`✅ ${env} configurado\n`);
    } catch (error) {
      // Try alternative method
      console.log(`Tentando método alternativo para ${env}...`);
      execSync(`vercel env add POSTGRES_URL ${env}`, {
        input: postgresUrl + '\n',
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log(`✅ ${env} configurado\n`);
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao adicionar para ${env}:`, error.message);
    console.log(`\nTente manualmente:`);
    console.log(`  vercel env add POSTGRES_URL ${env}`);
    console.log(`  Cole: ${postgresUrl.substring(0, 50)}...\n`);
  }
}

console.log('✅ Configuração concluída!\n');
console.log('📋 Próximos passos:');
console.log('1. Faça um redeploy na Vercel');
console.log('2. Teste: https://dosantosmarket.com.br/api/orders/diagnostic\n');
