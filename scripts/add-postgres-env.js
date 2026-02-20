/**
 * Script para adicionar POSTGRES_URL após criar o banco
 * 
 * Usage: node scripts/add-postgres-env.js "postgres://..."
 */

const { execSync } = require('child_process');

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('❌ Connection string é obrigatória!');
  console.log('\nUsage:');
  console.log('  node scripts/add-postgres-env.js "postgres://user:pass@host/db"');
  process.exit(1);
}

console.log('📝 Adicionando POSTGRES_URL às variáveis de ambiente...\n');

const environments = ['production', 'preview', 'development'];

for (const env of environments) {
  try {
    console.log(`Adicionando para ${env}...`);
    // Use echo to pipe the connection string
    const command = `echo "${connectionString}" | vercel env add POSTGRES_URL ${env}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${env} configurado\n`);
  } catch (error) {
    console.error(`❌ Erro ao adicionar para ${env}:`, error.message);
    console.log(`\nTente manualmente:`);
    console.log(`  vercel env add POSTGRES_URL ${env}\n`);
  }
}

console.log('✅ Variáveis de ambiente configuradas!\n');
console.log('Próximos passos:');
console.log('1. Execute o schema SQL no SQL Editor da Vercel');
console.log('   Ou: node scripts/setup-postgres.js (com POSTGRES_URL configurado)');
console.log('2. Faça um novo deploy: git push');
console.log('3. Teste criando um pedido no site\n');
