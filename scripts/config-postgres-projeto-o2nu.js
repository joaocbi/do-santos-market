/**
 * Configurar POSTGRES_URL no projeto do-santos-market-o2nu
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read connection string from .env.local (original)
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

// Try to read from original location or use hardcoded
const originalEnvPath = path.join(process.cwd(), '..', 'Do Santos Market', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

// If not found, use the known connection string
if (!POSTGRES_URL) {
  POSTGRES_URL = 'postgresql://neondb_owner:npg_TvkWxb9LUA8F@ep-dry-star-aiglbgis-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
}

console.log('📝 Configurando POSTGRES_URL no projeto do-santos-market-o2nu\n');
console.log('⚠️  IMPORTANTE: Você precisa fazer isso MANUALMENTE no dashboard:\n');
console.log('1. Acesse: https://vercel.com/dashboard');
console.log('2. Vá para o projeto: do-santos-market-o2nu');
console.log('3. Settings → Environment Variables');
console.log('4. Clique em "Add New"');
console.log('5. Key: POSTGRES_URL');
console.log(`6. Value: ${POSTGRES_URL}`);
console.log('7. Marque: Production, Preview, Development');
console.log('8. Clique em Save');
console.log('9. Faça um redeploy (Deployments → 3 pontos → Redeploy)\n');
