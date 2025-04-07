import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type Params = {
  path: string[];
};

/**
 * This is a proxy API route to handle PocketBase image requests
 * It bypasses Next.js image domain restrictions by routing the request through our own API
 */
export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    // Extract cache-busting param if any
    const url = new URL(request.url);
    const nocache = url.searchParams.get('nocache');
    
    // Properly await and access the path parameter
    // Clone it to avoid the "params should be awaited" warning
    const paramsClone = { ...await Promise.resolve(context.params) };
    const pathSegments = paramsClone.path || [];
    
    // Reconstruct the PocketBase URL
    const pbPath = pathSegments.join('/');
    
    // Full URL to PocketBase
    const pbUrl = `http://localhost:8090/api/files/${pbPath}`;
    
    console.log(`Proxying image request to: ${pbUrl}`);
    
    // Fetch the image from PocketBase
    const response = await fetch(pbUrl, {
      headers: {
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries())
            .filter(([key]) => key.toLowerCase() !== 'host')
        ),
      },
      cache: 'no-store', // Prevent caching issues
    });
    
    if (!response.ok) {
      console.error(`Error fetching image from PocketBase: ${response.status} ${response.statusText}`);
      // Return placeholder image instead of 404
      try {
        const placeholderResponse = await fetch(new URL('/placeholder-image.png', request.url));
        const placeholderData = await placeholderResponse.arrayBuffer();
        return new NextResponse(placeholderData, { 
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': placeholderData.byteLength.toString(),
            'Cache-Control': 'no-store, max-age=0',
            'Content-Disposition': 'inline'
          }
        });
      } catch (placeholderError) {
        console.error('Failed to serve placeholder:', placeholderError);
        return new NextResponse(null, { status: response.status });
      }
    }
    
    // Get the image data
    const imageData = await response.arrayBuffer();
    console.log(`Successfully fetched image, size: ${imageData.byteLength} bytes`);
    
    // Create a new response with the image data and appropriate headers
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Headers focused on ensuring the image is directly displayed
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', imageData.byteLength.toString());
    headers.set('Content-Disposition', 'inline');
    
    // Always set no-cache to prevent browser caching issues
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new NextResponse(imageData, {
      headers,
    });
  } catch (error) {
    console.error('Error proxying PocketBase image:', error);
    return new NextResponse(null, { status: 500 });
  }
} 