/**
 * Script para verificar se o Postgres está configurado na Vercel
 * 
 * Usage: node scripts/check-postgres-config.js
 */

const https = require('https');

const SITE_URL = process.env.SITE_URL || 'https://do-santos-market-o2nu-3qyliyfod-joaos-projects-3fc725a3.vercel.app';

async function checkDiagnostic() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SITE_URL}/api/orders/diagnostic`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const diagnostic = JSON.parse(data);
          resolve(diagnostic);
        } catch (e) {
          reject(new Error('Failed to parse diagnostic response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('🔍 Verificando configuração do Postgres...\n');
  console.log(`Site: ${SITE_URL}\n`);
  
  try {
    const diagnostic = await checkDiagnostic();
    
    console.log('📊 Status da Configuração:\n');
    console.log('Ambiente:');
    console.log(`  - Vercel: ${diagnostic.environment.VERCEL ? '✅' : '❌'}`);
    console.log(`  - NODE_ENV: ${diagnostic.environment.NODE_ENV}`);
    console.log(`  - POSTGRES_URL configurada: ${diagnostic.environment.hasPostgresUrl ? '✅' : '❌'}`);
    console.log(`  - Tamanho da URL: ${diagnostic.environment.postgresUrlLength} caracteres\n`);
    
    console.log('Banco de Dados:');
    console.log(`  - Postgres disponível: ${diagnostic.database.postgresAvailable ? '✅' : '❌'}`);
    console.log(`  - Prefixo da URL: ${diagnostic.database.postgresUrlPrefix}\n`);
    
    if (diagnostic.database.ordersTableExists !== undefined) {
      console.log(`  - Tabela 'orders' existe: ${diagnostic.database.ordersTableExists ? '✅' : '❌'}\n`);
    }
    
    console.log('Teste de Conexão:');
    console.log(`  - Pode criar pedidos: ${diagnostic.test.canCreateOrder ? '✅' : '❌'}`);
    if (diagnostic.test.error) {
      console.log(`  - Erro: ${diagnostic.test.error}\n`);
    }
    
    if (diagnostic.database.postgresAvailable && diagnostic.test.canCreateOrder) {
      console.log('\n🎉 Tudo configurado corretamente!');
    } else {
      console.log('\n⚠️  Configuração incompleta. Siga os passos abaixo:\n');
      console.log('1. Acesse: https://vercel.com/dashboard');
      console.log('2. Selecione o projeto "do-santos-market"');
      console.log('3. Vá em Storage → Create Database → Neon Postgres');
      console.log('4. Copie a connection string');
      console.log('5. Vá em Settings → Environment Variables');
      console.log('6. Adicione POSTGRES_URL com a connection string');
      console.log('7. Marque todas as environments (Production, Preview, Development)');
      console.log('8. Vá em Storage → Seu banco → SQL Editor');
      console.log('9. Execute o conteúdo de scripts/schema.sql');
      console.log('10. Faça um redeploy');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    console.log('\n⚠️  O site pode estar offline ou o endpoint não está acessível.');
  }
}

main();
