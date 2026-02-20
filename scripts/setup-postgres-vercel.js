/**
 * Script completo para configurar Postgres na Vercel
 * Tenta automatizar o máximo possível
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupPostgres() {
  console.log('🗄️  Configuração Automática do Postgres na Vercel\n');
  console.log('Este script vai te guiar através do processo.\n');

  // Step 1: Check if POSTGRES_URL already exists
  console.log('📋 Passo 1: Verificando variáveis de ambiente...\n');
  try {
    const envList = execSync('vercel env ls', { encoding: 'utf-8' });
    if (envList.includes('POSTGRES_URL')) {
      console.log('✅ POSTGRES_URL já está configurado!\n');
      const answer = await question('Deseja reconfigurar? (s/n): ');
      if (answer.toLowerCase() !== 's') {
        console.log('\n✅ Configuração mantida. Próximo passo: Execute o schema SQL.');
        rl.close();
        return;
      }
    }
  } catch (e) {
    console.log('ℹ️  Verificando variáveis...\n');
  }

  // Step 2: Instructions to create database
  console.log('📋 Passo 2: Criar banco de dados\n');
  console.log('A criação do banco precisa ser feita no dashboard da Vercel.\n');
  console.log('Siga estes passos:');
  console.log('1. Abra: https://vercel.com/dashboard');
  console.log('2. Selecione o projeto: do-santos-market');
  console.log('3. Clique em "Storage" no menu lateral');
  console.log('4. Clique em "Create Database"');
  console.log('5. Selecione "Neon Postgres"');
  console.log('6. Clique em "Create"');
  console.log('7. ⚠️  COPIE A CONNECTION STRING que aparece\n');

  const connectionString = await question('Cole a connection string aqui (ou pressione Enter para pular): ');
  
  if (!connectionString || connectionString.trim() === '') {
    console.log('\n⚠️  Connection string não fornecida.');
    console.log('Você pode adicionar depois com: vercel env add POSTGRES_URL\n');
    rl.close();
    return;
  }

  // Step 3: Add environment variable
  console.log('\n📋 Passo 3: Adicionando variável de ambiente...\n');
  
  try {
    // Add to all environments
    console.log('Adicionando POSTGRES_URL para Production...');
    execSync(`echo "${connectionString.trim()}" | vercel env add POSTGRES_URL production`, { 
      stdio: 'inherit',
      input: connectionString.trim()
    });
    
    console.log('\nAdicionando POSTGRES_URL para Preview...');
    execSync(`echo "${connectionString.trim()}" | vercel env add POSTGRES_URL preview`, { 
      stdio: 'inherit',
      input: connectionString.trim()
    });
    
    console.log('\nAdicionando POSTGRES_URL para Development...');
    execSync(`echo "${connectionString.trim()}" | vercel env add POSTGRES_URL development`, { 
      stdio: 'inherit',
      input: connectionString.trim()
    });
    
    console.log('\n✅ Variável POSTGRES_URL configurada!\n');
  } catch (error) {
    console.error('\n❌ Erro ao adicionar variável:', error.message);
    console.log('\nVocê pode adicionar manualmente com:');
    console.log('  vercel env add POSTGRES_URL\n');
  }

  // Step 4: Setup schema
  console.log('📋 Passo 4: Configurar schema do banco\n');
  const setupSchema = await question('Deseja executar o schema SQL agora? (s/n): ');
  
  if (setupSchema.toLowerCase() === 's') {
    console.log('\n📝 Executando schema...\n');
    try {
      process.env.POSTGRES_URL = connectionString.trim();
      require('./setup-postgres.js');
    } catch (error) {
      console.error('\n❌ Erro ao executar schema:', error.message);
      console.log('\nVocê pode executar manualmente:');
      console.log('1. No SQL Editor da Vercel, execute o conteúdo de scripts/schema.sql');
      console.log('2. Ou execute: node scripts/setup-postgres.js (com POSTGRES_URL configurado)\n');
    }
  } else {
    console.log('\n📝 Para executar o schema depois:');
    console.log('1. Acesse o SQL Editor no dashboard da Vercel');
    console.log('2. Execute o conteúdo de scripts/schema.sql\n');
  }

  console.log('🎉 Configuração concluída!\n');
  console.log('Próximos passos:');
  console.log('1. Faça um novo deploy: git push (ou vercel --prod)');
  console.log('2. Teste criando um pedido no site');
  console.log('3. Verifique os logs se houver problemas\n');

  rl.close();
}

setupPostgres().catch(console.error);
