/**
 * Script para verificar o valor real da POSTGRES_URL
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production não encontrado');
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const lines = envFile.split(/\r?\n/);

for (const line of lines) {
  if (line.startsWith('POSTGRES_URL=')) {
    const value = line.substring('POSTGRES_URL='.length);
    console.log('Valor encontrado:');
    console.log('Comprimento:', value.length);
    console.log('Tem \\r:', value.includes('\r'));
    console.log('Tem \\n:', value.includes('\n'));
    console.log('Primeiros 50 caracteres:', value.substring(0, 50));
    console.log('Últimos 50 caracteres:', value.substring(value.length - 50));
    console.log('\nValor limpo:');
    const cleaned = value.replace(/[\r\n\t]/g, '').trim();
    console.log('Comprimento após limpeza:', cleaned.length);
    console.log('Primeiros 50 caracteres:', cleaned.substring(0, 50));
    break;
  }
}
