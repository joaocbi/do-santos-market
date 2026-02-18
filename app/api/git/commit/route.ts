import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CommitRequest {
  message?: string;
  files?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication (simple token check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.GIT_COMMIT_TOKEN || 'auto-commit-2024';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CommitRequest = await request.json().catch(() => ({}));
    const commitMessage = body.message || `Auto-commit: ${new Date().toISOString()}`;
    const filesToAdd = body.files || ['data/'];

    // Change to project root
    const projectRoot = process.cwd();

    try {
      // Add files
      const addCommand = `git add ${filesToAdd.join(' ')}`;
      await execAsync(addCommand, { cwd: projectRoot });
      
      // Check if there are changes to commit
      const statusResult = await execAsync('git status --porcelain', { cwd: projectRoot });
      if (!statusResult.stdout.trim()) {
        return NextResponse.json({ 
          success: true, 
          message: 'No changes to commit' 
        });
      }

      // Commit
      const commitCommand = `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`;
      await execAsync(commitCommand, { cwd: projectRoot });

      // Push
      const pushResult = await execAsync('git push', { cwd: projectRoot });

      return NextResponse.json({
        success: true,
        message: 'Changes committed and pushed successfully',
        commitMessage,
        pushOutput: pushResult.stdout,
      });
    } catch (error: any) {
      console.error('Git operation error:', error);
      return NextResponse.json({
        error: error.message || 'Git operation failed',
        stderr: error.stderr,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Commit API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to commit changes',
    }, { status: 500 });
  }
}
