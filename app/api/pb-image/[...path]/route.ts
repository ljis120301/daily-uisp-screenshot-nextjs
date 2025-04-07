import { NextRequest } from 'next/server';

/**
 * This is a proxy API route to handle PocketBase image requests
 * It bypasses Next.js image domain restrictions by routing the request through our own API
 */
export async function GET(
  request: NextRequest,
  { params }: any
): Promise<Response> {
  try {
    // Extract cache-busting param if any
    const url = new URL(request.url);
    const nocache = url.searchParams.get('nocache');
    
    // Extract path from params
    const pathSegments = params.path as string[];
    
    // Reconstruct the PocketBase URL
    const pbPath = pathSegments.join('/');
    
    // Full URL to PocketBase
    const pbUrl = `http://localhost:8090/api/files/${pbPath}`;
    
    console.log(`Proxying image request to: ${pbUrl}`);
    
    // Fetch the image from PocketBase
    const response = await fetch(pbUrl, {
      headers: {
        'Accept': 'image/*'
      },
      cache: nocache ? 'no-store' : 'default'
    });

    if (!response.ok) {
      console.error(`PocketBase image fetch failed: ${response.status} ${response.statusText}`);
      return new Response(`Failed to fetch image: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Get content-type and other headers from the original response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const data = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': nocache ? 'no-cache, no-store' : 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in PocketBase image proxy:', error);
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
}