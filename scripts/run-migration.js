/**
 * Script to run image migration via API
 * Usage: node scripts/run-migration.js
 */

const https = require('https');
const http = require('http');

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN || 'migrate-images-2024';
const API_URL = process.env.API_URL || 'http://localhost:3000/api/migrate-images';

async function runMigration() {
  console.log('Starting migration...');
  console.log(`API URL: ${API_URL}\n`);

  const url = new URL(API_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MIGRATION_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('\n✓ Migration completed successfully!');
            console.log('\nResults:');
            console.log(`  Uploaded: ${result.result.uploaded}`);
            console.log(`  Failed: ${result.result.failed}`);
            console.log(`  Products updated: ${result.result.updated}`);
            if (result.result.errors.length > 0) {
              console.log('\nErrors:');
              result.result.errors.forEach((err, i) => {
                console.log(`  ${i + 1}. ${err}`);
              });
            }
            resolve(result);
          } else {
            console.error('\n✗ Migration failed:', result.error || data);
            reject(new Error(result.error || 'Migration failed'));
          }
        } catch (e) {
          console.error('\n✗ Failed to parse response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('\n✗ Request error:', error.message);
      reject(error);
    });

    req.end();
  });
}

runMigration()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
