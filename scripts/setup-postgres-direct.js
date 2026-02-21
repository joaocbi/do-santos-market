/**
 * Script alternativo para configurar schema usando fetch direto
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      // Remove quotes
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      // Remove all whitespace and line breaks
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t\s]/g, '');
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

console.log('✅ Connection string encontrada');
console.log('📝 Executando schema SQL...\n');

// Read schema file
const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo schema.sql não encontrado!');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

// Parse connection string to get components
const urlMatch = POSTGRES_URL.match(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^\/]+)\/([^\?]+)/);
if (!urlMatch) {
  console.error('❌ Connection string inválida');
  process.exit(1);
}

const [, , user, password, host, database] = urlMatch;

console.log('ℹ️  Para executar o schema SQL, você tem duas opções:\n');
console.log('OPÇÃO 1: Via SQL Editor da Vercel (Recomendado)');
console.log('1. Acesse: https://vercel.com/dashboard');
console.log('2. Vá em Storage → Seu banco → SQL Editor');
console.log('3. Cole o conteúdo de scripts/schema.sql');
console.log('4. Execute\n');

console.log('OPÇÃO 2: Via psql (se tiver instalado)');
console.log(`psql "${POSTGRES_URL}" -f scripts/schema.sql\n`);

console.log('OPÇÃO 3: Usar o script setup-postgres.js após corrigir o .env.local');
console.log('O arquivo .env.local pode ter caracteres de quebra de linha.\n');

// Try to use neon with a completely clean string
try {
  const { neon } = require('@neondatabase/serverless');
  
  // Create a completely clean URL by reconstructing it
  const cleanUrl = `postgresql://${user}:${password}@${host}/${database}?sslmode=require`;
  
  console.log('🔄 Tentando conectar com URL limpa...');
  const sql = neon(cleanUrl);
  
  // Test connection and execute schema
  console.log('📊 Testando conexão...');
  (async () => {
    try {
      await sql`SELECT 1 as test`;
      console.log('✅ Conexão bem-sucedida!');
      console.log('📝 Executando schema...\n');
      
      // Execute schema as a single transaction
      // Split by semicolon but be smarter about it
      const lines = schema.split(/\r?\n/);
      const statements = [];
      let currentStatement = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines and full-line comments
        if (!trimmed || trimmed.startsWith('--')) {
          continue;
        }
        // Add line to current statement
        currentStatement += (currentStatement ? ' ' : '') + line;
        // If line ends with semicolon, it's a complete statement
        if (trimmed.endsWith(';')) {
          const stmt = currentStatement.trim();
          if (stmt && stmt !== ';') {
            statements.push(stmt);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      console.log(`📊 Encontrados ${statements.length} comandos SQL\n`);
      
      // Execute statements sequentially to avoid conflicts
      let completed = 0;
      const total = statements.length;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          await sql.unsafe(stmt);
          completed++;
          console.log(`✅ Comando ${completed}/${total} executado`);
        } catch (error) {
          if (error.message && (
            error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('relation') && error.message.includes('already exists'))
          )) {
            completed++;
            console.log(`ℹ️  Comando ${completed}/${total} - já existe (ignorado)`);
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
            console.error(`   Comando: ${stmt.substring(0, 100)}...`);
            // Don't continue if there's a real error
            throw error;
          }
        }
      }
      
      // Verify tables were created
      console.log('\n📊 Verificando tabelas criadas...');
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      console.log(`✅ ${tables.length} tabelas encontradas no banco:`);
      tables.forEach(t => console.log(`   - ${t.table_name}`));
      
      console.log('\n✅ Schema executado com sucesso!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Erro:', err.message);
      console.log('\n⚠️  Use a OPÇÃO 1 (SQL Editor da Vercel) para executar o schema manualmente.\n');
      process.exit(1);
    }
  })();
  
} catch (error) {
  console.error('❌ Erro ao carregar módulo:', error.message);
  console.log('\n⚠️  Use a OPÇÃO 1 (SQL Editor da Vercel) para executar o schema manualmente.\n');
  process.exit(1);
}
