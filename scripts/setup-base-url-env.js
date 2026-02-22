/**
 * Script para configurar NEXT_PUBLIC_BASE_URL na Vercel
 */

const { execSync } = require('child_process');

const BASE_URL = 'https://www.dosantosmarket.com.br';

console.log('📝 Configurando NEXT_PUBLIC_BASE_URL na Vercel...\n');
console.log(`   URL: ${BASE_URL}\n`);

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Vercel CLI não encontrado!');
  console.log('\n📋 Configure manualmente no dashboard:');
  console.log('   1. Acesse: https://vercel.com/dashboard');
  console.log('   2. Vá em Settings → Environment Variables');
  console.log('   3. Adicione: NEXT_PUBLIC_BASE_URL');
  console.log(`   4. Value: ${BASE_URL}`);
  console.log('   5. Marque: Production, Preview, Development\n');
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
      if (checkOutput.includes('NEXT_PUBLIC_BASE_URL')) {
        console.log(`   ⚠️  NEXT_PUBLIC_BASE_URL já existe em ${env}`);
        console.log(`   💡 Para atualizar, remova primeiro: vercel env rm NEXT_PUBLIC_BASE_URL ${env}`);
        continue;
      }
    } catch (e) {
      // Variable doesn't exist, continue
    }
    
    // Add the variable
    const tempFile = require('path').join(process.cwd(), 'temp-base-url.txt');
    require('fs').writeFileSync(tempFile, BASE_URL);
    
    try {
      if (process.platform === 'win32') {
        execSync(`type ${tempFile} | vercel env add NEXT_PUBLIC_BASE_URL ${env}`, { 
          stdio: 'inherit',
          shell: true
        });
      } else {
        execSync(`cat ${tempFile} | vercel env add NEXT_PUBLIC_BASE_URL ${env}`, { 
          stdio: 'inherit'
        });
      }
      console.log(`   ✅ ${env} configurado\n`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao configurar ${env} automaticamente`);
      console.log(`   💡 Configure manualmente no dashboard da Vercel\n`);
    } finally {
      // Clean up temp file
      if (require('fs').existsSync(tempFile)) {
        require('fs').unlinkSync(tempFile);
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}\n`);
  }
}

console.log('✅ Configuração concluída!\n');
console.log('⚠️  IMPORTANTE: Faça um redeploy para aplicar as mudanças!\n');
console.log('📋 Opções para redeploy:');
console.log('1. Dashboard: Deployments → 3 pontos → Redeploy');
console.log('2. CLI: vercel --prod');
console.log('3. Git: git commit --allow-empty -m "trigger redeploy" && git push\n');
