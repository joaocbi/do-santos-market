import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MigrationResult {
  uploaded: number;
  failed: number;
  updated: number;
  errors: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication (you can add proper auth later)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.MIGRATION_TOKEN || 'migrate-images-2024';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting image migration to Vercel Blob Storage...');

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: 'BLOB_READ_WRITE_TOKEN not configured' 
      }, { status: 500 });
    }

    const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
    const urlMap = new Map<string, string>();
    const result: MigrationResult = {
      uploaded: 0,
      failed: 0,
      updated: 0,
      errors: [],
    };

    // Get all products
    const products = db.products.getAll();
    console.log(`Found ${products.length} products`);

    // Collect all unique file paths
    const filePaths = new Set<string>();
    
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

    console.log(`Found ${filePaths.size} unique files to upload`);

    // Upload files
    const filePathsArray = Array.from(filePaths);
    for (const filePath of filePathsArray) {
      try {
        const localPath = path.join(process.cwd(), 'public', filePath);
        
        if (!fs.existsSync(localPath)) {
          console.log(`File not found: ${filePath}`);
          result.failed++;
          result.errors.push(`File not found: ${filePath}`);
          continue;
        }

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

        urlMap.set(filePath, blob.url);
        result.uploaded++;
        console.log(`Uploaded: ${fileName} -> ${blob.url}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        console.error(`Failed to upload ${filePath}:`, error.message);
        result.failed++;
        result.errors.push(`${filePath}: ${error.message}`);
      }
    }

    // Update products
    let updatedCount = 0;
    for (const product of products) {
      let updated = false;
      const updates: any = {};

      // Update images
      if (product.images && Array.isArray(product.images)) {
        const newImages = product.images.map((img: string) => {
          if (img && img.startsWith('/uploads/') && urlMap.has(img)) {
            updated = true;
            return urlMap.get(img)!;
          }
          return img;
        });
        if (updated) {
          updates.images = newImages;
        }
      }

      // Update video
      if (product.video && product.video.startsWith('/uploads/') && urlMap.has(product.video)) {
        updates.video = urlMap.get(product.video)!;
        updated = true;
      }

      if (updated) {
        db.products.update(product.id, updates);
        updatedCount++;
      }
    }

    result.updated = updatedCount;

    console.log('Migration completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      result,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: error.message || 'Migration failed',
    }, { status: 500 });
  }
}
