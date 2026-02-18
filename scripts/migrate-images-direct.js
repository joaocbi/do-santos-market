/**
 * Direct image migration script
 * This script uploads images from public/uploads to Vercel Blob Storage
 * and updates the products.json file with new URLs
 * 
 * Usage: node scripts/migrate-images-direct.js
 * 
 * Requirements:
 * - BLOB_READ_WRITE_TOKEN must be set in environment
 * - Images must exist in public/uploads/
 */

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
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

// Check for BLOB_READ_WRITE_TOKEN
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('ERROR: BLOB_READ_WRITE_TOKEN environment variable is not set!');
  console.error('\nPlease configure it in one of these ways:');
  console.error('\n1. Create a .env.local file in the project root with:');
  console.error('   BLOB_READ_WRITE_TOKEN=your_token_here');
  console.error('\n2. Or set it as environment variable:');
  console.error('   Windows PowerShell: $env:BLOB_READ_WRITE_TOKEN="your_token"');
  console.error('   Windows CMD: set BLOB_READ_WRITE_TOKEN=your_token');
  console.error('   Linux/Mac: export BLOB_READ_WRITE_TOKEN=your_token');
  console.error('\nTo get your token:');
  console.error('1. Go to https://vercel.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Settings → Storage → Blob');
  console.error('4. Copy the BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

// Read products
if (!fs.existsSync(PRODUCTS_FILE)) {
  console.error(`ERROR: Products file not found at ${PRODUCTS_FILE}`);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
console.log(`Found ${products.length} products\n`);

// Collect all unique file paths
const filePaths = new Set();
products.forEach(product => {
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      if (img && typeof img === 'string' && img.startsWith('/uploads/')) {
        filePaths.add(img);
      }
    });
  }
  if (product.video && typeof product.video === 'string' && product.video.startsWith('/uploads/')) {
    filePaths.add(product.video);
  }
});

console.log(`Found ${filePaths.size} unique files to upload\n`);

// Map to store old path -> new blob URL
const urlMap = new Map();

async function uploadFile(filePath) {
  const localPath = path.join(__dirname, '..', 'public', filePath);
  
  if (!fs.existsSync(localPath)) {
    console.log(`⚠ File not found: ${filePath}`);
    return null;
  }

  try {
    const fileBuffer = fs.readFileSync(localPath);
    const fileName = path.basename(localPath);
    const folder = filePath.includes('/videos/') ? 'videos' : 'uploads';
    const blobPath = `${folder}/${fileName}`;

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.mp4' || ext === '.webm') {
      contentType = `video/${ext.slice(1)}`;
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType,
    });

    console.log(`✓ Uploaded: ${fileName} -> ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`✗ Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

async function migrate() {
  console.log('Starting image migration to Vercel Blob Storage...\n');

  let uploaded = 0;
  let failed = 0;

  // Upload files
  for (const filePath of filePaths) {
    const blobUrl = await uploadFile(filePath);
    
    if (blobUrl) {
      urlMap.set(filePath, blobUrl);
      uploaded++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nUpload Summary:`);
  console.log(`  ✓ Uploaded: ${uploaded}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  Total: ${filePaths.size}\n`);

  if (uploaded === 0) {
    console.log('No files were uploaded. Exiting.');
    return;
  }

  // Update products
  console.log('Updating products with new URLs...');
  let updatedProducts = 0;

  products.forEach(product => {
    let updated = false;

    // Update images
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map(img => {
        if (img && img.startsWith('/uploads/') && urlMap.has(img)) {
          updated = true;
          return urlMap.get(img);
        }
        return img;
      });
    }

    // Update video
    if (product.video && product.video.startsWith('/uploads/') && urlMap.has(product.video)) {
      product.video = urlMap.get(product.video);
      updated = true;
    }

    if (updated) {
      updatedProducts++;
    }
  });

  // Backup original file
  const backupFile = `${PRODUCTS_FILE}.backup.${Date.now()}`;
  fs.copyFileSync(PRODUCTS_FILE, backupFile);
  console.log(`Created backup: ${backupFile}`);

  // Write updated products
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`\n✓ Updated ${updatedProducts} products`);
  console.log(`✓ Products file saved: ${PRODUCTS_FILE}`);
  console.log('\n✓ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the updated products.json file');
  console.log('2. Commit the changes to git');
  console.log('3. Push to trigger a new Vercel deployment');
}

// Run migration
migrate().catch(error => {
  console.error('\n✗ Migration failed:', error);
  process.exit(1);
});
