import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');
const VIDEOS_DIR = path.join(process.cwd(), 'public', 'uploads', 'videos');

interface Product {
  id: string;
  images: string[];
  video?: string;
  [key: string]: any;
}

// Map to store old path -> new blob URL
const urlMap = new Map<string, string>();

async function uploadFile(filePath: string, blobPath: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const contentType = fileName.endsWith('.mp4') || fileName.endsWith('.webm') 
      ? `video/${path.extname(fileName).slice(1)}` 
      : `image/${path.extname(fileName).slice(1) || 'jpeg'}`;

    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType,
    });

    console.log(`✓ Uploaded: ${fileName} -> ${blob.url}`);
    return blob.url;
  } catch (error: any) {
    console.error(`✗ Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

async function migrateImages() {
  console.log('Starting image migration to Vercel Blob Storage...\n');

  // Check if BLOB_READ_WRITE_TOKEN is set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('ERROR: BLOB_READ_WRITE_TOKEN environment variable is not set!');
    console.error('Please set it in your .env.local file or environment variables.');
    process.exit(1);
  }

  // Read products
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error(`ERROR: Products file not found at ${PRODUCTS_FILE}`);
    process.exit(1);
  }

  const products: Product[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  console.log(`Found ${products.length} products to migrate\n`);

  // Collect all unique image/video paths
  const filePaths = new Set<string>();
  
  products.forEach(product => {
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && img.startsWith('/uploads/')) {
          filePaths.add(img);
        }
      });
    }
    if (product.video && product.video.startsWith('/uploads/')) {
      filePaths.add(product.video);
    }
  });

  console.log(`Found ${filePaths.size} unique files to upload\n`);

  // Upload files
  let uploaded = 0;
  let failed = 0;

  const filePathsArray = Array.from(filePaths);
  for (const filePath of filePathsArray) {
    const localPath = path.join(process.cwd(), 'public', filePath);
    
    if (!fs.existsSync(localPath)) {
      console.log(`⚠ File not found locally: ${filePath}`);
      failed++;
      continue;
    }

    const fileName = path.basename(localPath);
    const folder = filePath.includes('/videos/') ? 'videos' : 'uploads';
    const blobPath = `${folder}/${fileName}`;

    const blobUrl = await uploadFile(localPath, blobPath);
    
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

  // Update products with new URLs
  console.log('Updating products with new URLs...');
  let updatedProducts = 0;

  products.forEach(product => {
    let updated = false;

    // Update images
    if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map(img => {
        if (img && img.startsWith('/uploads/') && urlMap.has(img)) {
          updated = true;
          return urlMap.get(img)!;
        }
        return img;
      });
    }

    // Update video
    if (product.video && product.video.startsWith('/uploads/') && urlMap.has(product.video)) {
      product.video = urlMap.get(product.video)!;
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
  console.log('\nMigration completed!');
}

// Run migration
migrateImages().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
