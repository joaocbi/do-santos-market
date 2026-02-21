/**
 * Script para configurar o schema do banco de dados Postgres
 * 
 * Usage:
 * 1. Set POSTGRES_URL environment variable
 * 2. Run: node scripts/setup-postgres.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1);
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Aggressively remove all whitespace and line breaks
        value = value.replace(/[\r\n\t\s]+/g, '').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

let POSTGRES_URL = process.env.POSTGRES_URL || '';
// Aggressively clean the URL
POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable is required');
  console.log('\nComo configurar:');
  console.log('Windows PowerShell:');
  console.log('  $env:POSTGRES_URL="sua-connection-string-aqui"');
  console.log('  node scripts/setup-postgres.js');
  console.log('\nLinux/Mac:');
  console.log('  export POSTGRES_URL="sua-connection-string-aqui"');
  console.log('  node scripts/setup-postgres.js');
  process.exit(1);
}

// Clean connection string one more time before using - remove ALL non-printable characters
const cleanUrl = POSTGRES_URL
  .split('')
  .filter(char => char.charCodeAt(0) >= 32 || char === '\n' || char === '\r')
  .join('')
  .replace(/[\r\n\t]/g, '')
  .trim();

// Set it back to process.env so neon can read it
process.env.POSTGRES_URL = cleanUrl;

console.log('Using connection string:', cleanUrl.substring(0, 50) + '...');
console.log('URL length:', cleanUrl.length);
console.log('Has line breaks:', cleanUrl.includes('\n') || cleanUrl.includes('\r'));

const sql = neon(cleanUrl);

async function setupSchema() {
  console.log('🚀 Configurando schema do banco de dados...\n');

  try {
    // Read schema file
    const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Arquivo schema.sql não encontrado!');
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Remove comments and clean up
    const cleanSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    console.log('📝 Executando schema SQL...\n');

    try {
      // Execute the entire schema at once
      // Split by semicolon and execute each statement
      const statements = cleanSchema.split(';').filter(s => s.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        try {
          // Execute using template literal (neon requires template literals)
          // For CREATE TABLE statements, we'll use a workaround
          const query = stmt.replace(/\$\{/g, '\\${'); // Escape template literals
          await sql.unsafe(query);
          console.log(`✅ Comando ${i + 1}/${statements.length} executado`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message && (
            error.message.includes('already exists') || 
            error.message.includes('duplicate')
          )) {
            console.log(`ℹ️  Comando ${i + 1}/${statements.length} - já existe (ignorado)`);
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
            // Continue with next statement
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao executar schema:', error.message);
      throw error;
    }

    console.log('\n✅ Schema configurado com sucesso!');
    console.log('\n📊 Verificando tabelas criadas...\n');

    // Verify tables were created
    const tables = [
      'categories',
      'products',
      'customers',
      'payment_methods',
      'delivery_methods',
      'banners',
      'links',
      'gallery_images',
      'videos',
      'site_config',
      'orders'
    ];

    for (const table of tables) {
      try {
        // Query table to verify it exists using unsafe for dynamic table names
        const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ Tabela '${table}' existe`);
      } catch (error) {
        console.error(`❌ Tabela '${table}' não encontrada:`, error.message);
      }
    }

    console.log('\n🎉 Configuração concluída!');
    console.log('\nPróximos passos:');
    console.log('1. Verifique se a variável POSTGRES_URL está configurada na Vercel');
    console.log('2. Faça um novo deploy');
    console.log('3. Teste criando um pedido no site');

  } catch (error) {
    console.error('\n❌ Erro ao configurar schema:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  }
}

setupSchema();
