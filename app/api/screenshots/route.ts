import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getScreenshots, isPocketBaseAvailable } from '@/lib/pocketbase-utils';

export async function GET() {
  try {
    // Check if PocketBase is available
    const isPbAvailable = await isPocketBaseAvailable();
    
    if (isPbAvailable) {
      // Get screenshots from PocketBase
      const screenshots = await getScreenshots(50);
      
      // Process screenshots with direct URLs
      const validatedScreenshots = screenshots.map(screenshot => {
        // Handle potential empty paths
        if (!screenshot.path) {
          return {
            ...screenshot,
            path: '/placeholder-image.png',
            name: screenshot.name || 'unknown',
            date: screenshot.date || new Date().toISOString()
          };
        }
        
        // Directly convert PocketBase URLs to use proxy API
        const path = screenshot.path;
        if (path.startsWith('http://localhost:8090/api/files/')) {
          const pbPath = path.replace('http://localhost:8090/api/files/', '');
          return {
            ...screenshot,
            path: `/api/pb-image/${pbPath}`,
            name: screenshot.name || 'unknown',
            date: screenshot.date || new Date().toISOString()
          };
        }
        
        return {
          ...screenshot,
          name: screenshot.name || 'unknown',
          date: screenshot.date || new Date().toISOString()
        };
      });
      
      // Add cache headers to prevent stale data
      return NextResponse.json(
        { screenshots: validatedScreenshots },
        { 
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    } else {
      console.log('PocketBase unavailable, falling back to filesystem');
      
      // Fallback to local filesystem
      const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        return NextResponse.json({ screenshots: [] });
      }
      
      const files = fs.readdirSync(screenshotsDir);
      
      // Filter for PNG files and sort by date (newest first)
      const screenshots = files
        .filter(file => file.endsWith('.png'))
        .map(file => ({
          name: file,
          path: `/screenshots/${file}`,
          date: fs.statSync(path.join(screenshotsDir, file)).mtime
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return NextResponse.json({ screenshots }, { 
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      });
    }
  } catch (error) {
    console.error('Failed to get screenshots:', error);
    return NextResponse.json({ error: 'Failed to get screenshots' }, { status: 500 });
  }
} 