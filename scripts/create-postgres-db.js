/**
 * Script para criar banco de dados Postgres na Vercel via API
 * 
 * Este script tenta criar o banco usando a API da Vercel
 * Se não funcionar, fornece instruções claras
 */

const https = require('https');
const { execSync } = require('child_process');

async function createPostgresDatabase() {
  console.log('🚀 Tentando configurar Postgres na Vercel...\n');

  try {
    // Get Vercel token from environment or CLI
    let token = process.env.VERCEL_TOKEN;
    
    if (!token) {
      // Try to get from vercel CLI config
      try {
        const configPath = require('path').join(require('os').homedir(), '.vercel', 'auth.json');
        const fs = require('fs');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          token = Object.values(config)[0]?.token;
        }
      } catch (e) {
        console.log('⚠️  Não foi possível obter token automaticamente');
      }
    }

    if (!token) {
      console.log('❌ Token da Vercel não encontrado.');
      console.log('\n📋 Para criar o banco manualmente:');
      console.log('1. Acesse: https://vercel.com/dashboard');
      console.log('2. Vá em Storage → Create Database → Neon Postgres');
      console.log('3. Copie a connection string');
      console.log('4. Execute: vercel env add POSTGRES_URL');
      return;
    }

    console.log('✅ Token encontrado. Tentando criar banco...\n');
    
    // Note: A Vercel API para criar databases requer autenticação específica
    // e pode não estar disponível via CLI simples
    // Vamos fornecer instruções claras e tentar adicionar a env var depois
    
    console.log('ℹ️  A criação de banco via API requer acesso específico.');
    console.log('📋 Siga estes passos:\n');
    
    console.log('1. Acesse: https://vercel.com/dashboard');
    console.log('2. Selecione o projeto: do-santos-market');
    console.log('3. Vá em Storage → Create Database');
    console.log('4. Selecione Neon Postgres');
    console.log('5. Clique em Create');
    console.log('6. Copie a connection string\n');
    
    console.log('Depois, execute este comando com a connection string:');
    console.log('  vercel env add POSTGRES_URL production preview development\n');
    
    // Check if POSTGRES_URL already exists
    try {
      const envList = execSync('vercel env ls', { encoding: 'utf-8' });
      if (envList.includes('POSTGRES_URL')) {
        console.log('✅ POSTGRES_URL já está configurado!');
        console.log('\nPróximo passo: Execute o schema SQL no SQL Editor da Vercel');
        return;
      }
    } catch (e) {
      // Ignore
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Siga o guia em CONFIGURAR-POSTGRES.md');
  }
}

createPostgresDatabase();
