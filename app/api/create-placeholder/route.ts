import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const placeholderPath = path.join(publicDir, 'placeholder-image.png');
    
    // Check if placeholder already exists
    if (!fs.existsSync(placeholderPath)) {
      console.log('Creating placeholder image...');
      
      // Create the public directory if it doesn't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Create a simple 100x100 placeholder PNG with text
      // This is a minimal valid PNG with gray background
      const pngData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0xed, 0xc1, 0x01, 0x0d, 0x00,
        0x00, 0x00, 0xc2, 0xa0, 0xf7, 0x4f, 0x6d, 0x0e, 0x37, 0xa0, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80,
        0x77, 0x03, 0x40, 0x40, 0x00, 0x01, 0xaf, 0x7a, 0x0e, 0x0e, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(placeholderPath, pngData);
      console.log(`Placeholder image created at ${placeholderPath}`);
    } else {
      console.log(`Using existing placeholder image at ${placeholderPath}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Placeholder image is ready',
      path: '/placeholder-image.png'
    });
  } catch (error) {
    console.error('Error creating placeholder image:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creating placeholder image',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 