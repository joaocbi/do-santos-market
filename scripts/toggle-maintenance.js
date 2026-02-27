/**
 * Script para ativar/desativar modo de manutenção na Vercel
 * 
 * Usage:
 *   node scripts/toggle-maintenance.js enable   - Ativa modo de manutenção
 *   node scripts/toggle-maintenance.js disable  - Desativa modo de manutenção
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const action = process.argv[2];

if (!action || (action !== 'enable' && action !== 'disable')) {
  console.error('❌ Uso incorreto!');
  console.log('\nUsage:');
  console.log('  node scripts/toggle-maintenance.js enable   - Ativa modo de manutenção');
  console.log('  node scripts/toggle-maintenance.js disable  - Desativa modo de manutenção');
  process.exit(1);
}

const value = action === 'enable' ? 'true' : 'false';
const environments = ['production', 'preview', 'development'];

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
  console.log('   → Add: MAINTENANCE_MODE');
  console.log(`   → Value: ${value}`);
  console.log('   → Marque: Production, Preview, Development');
  console.log('   → Save e faça um redeploy\n');
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

console.log(`🔧 ${action === 'enable' ? 'Ativando' : 'Desativando'} modo de manutenção...\n`);

for (const env of environments) {
  try {
    console.log(`📝 Configurando para ${env}...`);
    
    // Remove existing variable if it exists
    try {
      execSync(`vercel env rm MAINTENANCE_MODE ${env} --yes`, { 
        stdio: 'ignore',
        shell: true
      });
    } catch (e) {
      // Variable might not exist, continue
    }
    
    // Add the variable
    const tempFile = path.join(process.cwd(), 'temp-maintenance-mode.txt');
    fs.writeFileSync(tempFile, value);
    
    try {
      if (process.platform === 'win32') {
        execSync(`type "${tempFile}" | vercel env add MAINTENANCE_MODE ${env}`, { 
          stdio: 'inherit',
          shell: true
        });
      } else {
        execSync(`cat "${tempFile}" | vercel env add MAINTENANCE_MODE ${env}`, { 
          stdio: 'inherit',
          shell: true
        });
      }
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
console.log(`2. Certifique-se de que MAINTENANCE_MODE está definida como "${value}"`);
console.log('3. Faça um redeploy:');
console.log('   - Dashboard → Deployments → 3 pontos → Redeploy');
console.log('   - Ou aguarde o próximo deploy automático\n');

if (action === 'enable') {
  console.log('⚠️  MODO DE MANUTENÇÃO ATIVADO');
  console.log('   O site mostrará a página de manutenção para todos os visitantes.\n');
} else {
  console.log('✅ MODO DE MANUTENÇÃO DESATIVADO');
  console.log('   O site voltará ao normal após o redeploy.\n');
}
