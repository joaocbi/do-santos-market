/**
 * Test script to verify BLOB_READ_WRITE_TOKEN validity
 */

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

// Try to load .env.local if it exists
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    // Remove comments and empty lines
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    // Match BLOB_READ_WRITE_TOKEN=value (with or without quotes)
    const match = line.match(/^BLOB_READ_WRITE_TOKEN\s*=\s*(.+)$/);
    if (match) {
      let value = match[1].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env.BLOB_READ_WRITE_TOKEN = value;
    }
  });
}

const token = process.argv[2] || process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error('ERROR: No token provided!');
  console.error('Please add BLOB_READ_WRITE_TOKEN to .env.local or pass as argument');
  console.error('Usage: node scripts/test-token.js [token]');
  process.exit(1);
}

async function testToken() {
  console.log('Testing Vercel Blob Storage token...\n');
  console.log('Token:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
  console.log('');

  // Set token in environment
  process.env.BLOB_READ_WRITE_TOKEN = token;

  try {
    // Try to upload a small test file
    const testContent = Buffer.from('test');
    const testPath = `test/token-verification-${Date.now()}.txt`;

    console.log('Attempting to upload test file...');
    const blob = await put(testPath, testContent, {
      access: 'public',
      contentType: 'text/plain',
    });

    console.log('✓ Token is VALID!');
    console.log('✓ Successfully uploaded test file');
    console.log('✓ Test file URL:', blob.url);
    console.log('\nToken status: ✅ VALID AND WORKING');
    
    // Try to delete the test file (cleanup)
    try {
      // Note: @vercel/blob doesn't have a delete method in the basic package
      // The test file will remain but that's okay for verification
      console.log('\nNote: Test file uploaded successfully. You can delete it manually from Vercel dashboard if needed.');
    } catch (e) {
      // Ignore cleanup errors
    }

    return true;
  } catch (error) {
    console.error('✗ Token test FAILED');
    console.error('Error:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\nToken status: ❌ INVALID - Token is not authorized');
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.error('\nToken status: ❌ INVALID - Token does not have required permissions');
    } else if (error.message.includes('404')) {
      console.error('\nToken status: ❌ INVALID - Blob store not found');
    } else {
      console.error('\nToken status: ❌ ERROR -', error.message);
    }
    
    return false;
  }
}

testToken()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
