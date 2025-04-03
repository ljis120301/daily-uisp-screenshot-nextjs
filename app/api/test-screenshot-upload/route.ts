import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pb from '@/lib/pocketbase';

// A helper function to test direct File object upload
async function createRecordWithFile(filePath: string): Promise<any> {
  try {
    console.log(`Creating test record with file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    console.log(`File ${fileName} size: ${fileData.length} bytes`);
    
    // Create form data
    const formData = new FormData();
    
    // Create File object
    const file = new File([fileData], fileName, { type: 'image/png' });
    
    // Add to form data - use "screenshot" (singular) to match PocketBase field name
    formData.append('screenshot', file);
    formData.append('timestamp', new Date().toISOString());
    formData.append('onlineDevices', '123');
    
    // Show form data entries
    console.log('FormData entries:');
    for (const pair of formData.entries()) {
      console.log(`- ${pair[0]}: ${typeof pair[1]} ${pair[1] instanceof File ? `(File: ${pair[1].name}, ${pair[1].size} bytes)` : pair[1]}`);
    }
    
    // Create record
    const record = await pb.collection('screenshots').create(formData);
    console.log(`Record created successfully: ${record.id}`);
    
    return record;
  } catch (error) {
    console.error('Error creating record with file:', error);
    throw error;
  }
}

export async function GET() {
  try {
    // Create a dummy PNG in memory for testing
    const testFilePath = path.join(process.cwd(), 'public', 'test-image.png');
    
    // Use existing test image or create one if it doesn't exist
    if (!fs.existsSync(testFilePath)) {
      console.log('Creating test image file...');
      
      // Create a simple 1x1 transparent PNG
      const pngData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testFilePath, pngData);
      console.log(`Test image created at ${testFilePath}`);
    } else {
      console.log(`Using existing test image at ${testFilePath}`);
    }
    
    // Test file upload
    try {
      const record = await createRecordWithFile(testFilePath);
      
      // Get URL for the uploaded file (using correct field name)
      const fileUrl = record.screenshot ? pb.files.getURL(record, record.screenshot) : null;
      
      return NextResponse.json({
        success: true,
        message: 'Test file uploaded successfully',
        record: {
          id: record.id,
          timestamp: record.timestamp,
          onlineDevices: record.onlineDevices,
          fileUrl: fileUrl
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to upload test file',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error in test endpoint',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 