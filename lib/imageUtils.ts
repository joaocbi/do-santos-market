/**
 * Normalizes image URLs to work in both localhost and Vercel
 * Converts relative paths like /uploads/... to placeholder or handles them appropriately
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url || !url.trim()) {
    return '/placeholder.jpg';
  }

  // If it's already a full URL (http/https), use it directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a relative path starting with /uploads/, it won't work on Vercel
  // In localhost, try to load it (will work if files exist)
  // In production/Vercel, it will fail and onError will show placeholder
  if (url.startsWith('/uploads/')) {
    // Return the URL as-is - let the browser try to load it
    // If it fails (like on Vercel), onError handler will show placeholder
    return url;
  }

  // If it's a relative path starting with /, use it as is (for public folder files)
  if (url.startsWith('/')) {
    return url;
  }

  // Fallback to placeholder
  return '/placeholder.jpg';
}

/**
 * Checks if an image URL is from Vercel Blob Storage
 */
export function isVercelBlobUrl(url: string): boolean {
  return url.includes('public.blob.vercel-storage.com');
}

/**
 * Normalizes an array of image URLs
 */
export function normalizeImageUrls(urls: string[] | undefined | null): string[] {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return [];
  }
  
  return urls
    .map(url => normalizeImageUrl(url))
    .filter(url => url !== '/placeholder.jpg' || urls.length === 1); // Keep at least one placeholder if all are invalid
}
