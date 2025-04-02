import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
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

    return NextResponse.json({ screenshots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get screenshots' }, { status: 500 });
  }
} 