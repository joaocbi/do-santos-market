/**
 * Helper function to automatically commit and push changes after admin operations
 * This function triggers a commit via API route to avoid blocking the main request
 */

export async function autoCommit(message: string, files: string[] = ['data/']): Promise<void> {
  try {
    // Check if auto-commit is enabled
    const isEnabled = process.env.ENABLE_AUTO_COMMIT === 'true' || 
                      process.env.NODE_ENV === 'production';
    
    if (!isEnabled) {
      console.log('Auto-commit disabled. Set ENABLE_AUTO_COMMIT=true to enable.');
      return;
    }

    // Determine base URL
    let baseUrl = 'http://localhost:3000';
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_BASE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    const token = process.env.GIT_COMMIT_TOKEN || 'auto-commit-2024';
    
    // Fire and forget - don't wait for response to avoid blocking
    fetch(`${baseUrl}/api/git/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        files,
      }),
    }).then(response => {
      if (!response.ok) {
        console.error('Auto-commit failed:', response.status, response.statusText);
      } else {
        console.log('Auto-commit successful:', message);
      }
    }).catch(error => {
      console.error('Auto-commit request error:', error.message);
    });
    
    console.log('Auto-commit triggered:', message);
  } catch (error: any) {
    console.error('Auto-commit error:', error.message);
    // Don't throw - we don't want to break the main operation
  }
}
