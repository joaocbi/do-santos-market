/**
 * Script para verificar se as variáveis de ambiente estão configuradas na Vercel
 */

const { execSync } = require('child_process');

console.log('🔍 Verificando variáveis de ambiente na Vercel...\n');

try {
  const output = execSync('vercel env ls', { encoding: 'utf-8' });
  console.log(output);
  
  if (output.includes('POSTGRES_URL')) {
    console.log('\n✅ POSTGRES_URL está configurada!');
    console.log('\n⚠️  Se o site ainda mostra erro, pode ser que:');
    console.log('1. O deploy não pegou a variável (faça um redeploy)');
    console.log('2. A variável está vazia ou incorreta');
    console.log('3. O ambiente não está marcado corretamente\n');
    
    console.log('📋 Para fazer redeploy:');
    console.log('1. Acesse: https://vercel.com/dashboard');
    console.log('2. Vá em Deployments');
    console.log('3. Clique nos 3 pontos do último deploy');
    console.log('4. Clique em "Redeploy"\n');
    
    console.log('🔍 Para verificar o valor (sem mostrar):');
    console.log('   vercel env pull .env.local');
    console.log('   (depois verifique o arquivo .env.local)\n');
  } else {
    console.log('\n❌ POSTGRES_URL NÃO está configurada!');
    console.log('\n📋 Configure agora:');
    console.log('1. Acesse: https://vercel.com/dashboard');
    console.log('2. Vá em Settings → Environment Variables');
    console.log('3. Adicione POSTGRES_URL com a connection string');
    console.log('4. Marque todas as environments\n');
  }
} catch (error) {
  console.error('❌ Erro ao verificar:', error.message);
  console.log('\nCertifique-se de estar logado na Vercel CLI:');
  console.log('  vercel login\n');
}
