import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    console.log('File received:', file ? { name: file.name, size: file.size, type: file.type } : 'null');

    if (!file) {
      console.error('No file in request');
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Validate file type (images or videos)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'O arquivo deve ser uma imagem ou vídeo' }, { status: 400 });
    }

    // Validate file size (max 50MB for videos, 5MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = isVideo ? '50MB' : '5MB';
      return NextResponse.json({ error: `O arquivo deve ter menos de ${maxSizeMB}` }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = originalName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const filename = `${timestamp}-${random}.${extension}`;
    
    // Determine folder path based on file type
    const folder = isVideo ? 'videos' : 'uploads';
    const blobPath = `${folder}/${filename}`;

    // Upload to Vercel Blob Storage
    try {
      const blob = await put(blobPath, file, {
        access: 'public',
        contentType: file.type,
      });

      console.log('File uploaded successfully to Vercel Blob:', { 
        filename, 
        url: blob.url, 
        size: file.size, 
        type: isVideo ? 'video' : 'image' 
      });

      return NextResponse.json({ 
        url: blob.url, 
        filename, 
        type: isVideo ? 'video' : 'image' 
      });
    } catch (blobError: any) {
      console.error('Error uploading to Vercel Blob:', blobError);
      return NextResponse.json({ 
        error: blobError?.message || 'Erro ao fazer upload para Vercel Blob Storage' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Falha ao fazer upload do arquivo' 
    }, { status: 500 });
  }
}
