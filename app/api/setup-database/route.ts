import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check if POSTGRES_URL is configured
    const postgresUrl = process.env.POSTGRES_URL;
    
    if (!postgresUrl) {
      return NextResponse.json({
        error: 'POSTGRES_URL not configured',
        message: 'Please configure POSTGRES_URL in Vercel environment variables'
      }, { status: 400 });
    }

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        error: 'Schema file not found',
        message: 'scripts/schema.sql not found'
      }, { status: 404 });
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Clean connection string
    const cleanUrl = postgresUrl
      .replace(/^["']|["']$/g, '')
      .replace(/[\r\n\t]/g, '')
      .trim();

    const sql = neon(cleanUrl);

    // Test connection
    await sql`SELECT 1 as test`;

    // Parse SQL statements
    const lines = schema.split(/\r?\n/);
    const statements: string[] = [];
    let currentStatement = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and full-line comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      // Add line to current statement
      currentStatement += (currentStatement ? ' ' : '') + line;
      // If line ends with semicolon, it's a complete statement
      if (trimmed.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && stmt !== ';') {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Execute statements
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sql.unsafe(stmt);
        successCount++;
        results.push({
          statement: i + 1,
          status: 'success',
          message: 'Executed successfully'
        });
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          (error.message.includes('relation') && error.message.includes('already exists'))
        )) {
          successCount++;
          results.push({
            statement: i + 1,
            status: 'skipped',
            message: 'Already exists'
          });
        } else {
          errorCount++;
          results.push({
            statement: i + 1,
            status: 'error',
            message: error.message || 'Unknown error',
            sql: stmt.substring(0, 100)
          });
        }
      }
    }

    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      summary: {
        totalStatements: statements.length,
        successCount,
        errorCount,
        tablesCreated: tables.length
      },
      tables: tables.map((t: any) => t.table_name),
      details: results
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      error: 'Database setup failed',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
