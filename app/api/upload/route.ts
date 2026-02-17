import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist (images or videos)
    const uploadsDir = isVideo 
      ? join(process.cwd(), 'public', 'uploads', 'videos')
      : join(process.cwd(), 'public', 'uploads');
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('Error creating directory:', dirError);
      return NextResponse.json({ error: 'Erro ao criar diretório de upload' }, { status: 500 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = originalName.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const filename = `${timestamp}-${random}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    try {
      await writeFile(filepath, buffer);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 });
    }

    // Return the public URL (different path for videos)
    const publicUrl = isVideo ? `/uploads/videos/${filename}` : `/uploads/${filename}`;
    console.log('File uploaded successfully:', { filename, publicUrl, size: buffer.length, type: isVideo ? 'video' : 'image' });
    return NextResponse.json({ url: publicUrl, filename, type: isVideo ? 'video' : 'image' });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Falha ao fazer upload do arquivo' 
    }, { status: 500 });
  }
}
