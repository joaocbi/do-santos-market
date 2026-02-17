import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClickableLink } from '@/lib/types';

export async function GET() {
  try {
    const links = db.links.getAll();
    return NextResponse.json(links.filter(l => l.active).sort((a, b) => a.order - b.order));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const link: ClickableLink = {
      id: Date.now().toString(),
      title: data.title,
      url: data.url,
      icon: data.icon,
      order: data.order || 0,
      active: data.active !== false,
    };
    const created = db.links.create(link);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
