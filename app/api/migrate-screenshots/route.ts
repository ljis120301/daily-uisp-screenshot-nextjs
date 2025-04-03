import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isPocketBaseAvailable } from '@/lib/pocketbase-utils';
import pb from '@/lib/pocketbase';

export async function GET() {
  try {
    // Check if PocketBase is available
    const isPbAvailable = await isPocketBaseAvailable();
    
    if (!isPbAvailable) {
      return NextResponse.json({ 
        error: 'PocketBase server not available',
        message: 'Make sure PocketBase is running on http://localhost:8090' 
      }, { status: 500 });
    }
    
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    
    if (!fs.existsSync(screenshotsDir)) {
      return NextResponse.json({ message: 'Screenshots directory does not exist' }, { status: 404 });
    }
    
    const files = fs.readdirSync(screenshotsDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    
    // Load the devices data
    const dataDir = path.join(process.cwd(), 'data');
    const devicesDataFile = path.join(dataDir, 'online_devices_history.json');
    let devicesData: any[] = [];
    
    if (fs.existsSync(devicesDataFile)) {
      devicesData = JSON.parse(fs.readFileSync(devicesDataFile, 'utf8'));
    }
    
    // Migrate each screenshot
    const results = [];
    
    for (const file of pngFiles) {
      try {
        // Find matching data in devicesData
        const filePathInJson = `/screenshots/${file}`;
        const deviceDataEntry = devicesData.find(entry => entry.screenshotPath === filePathInJson);
        
        // Extract timestamp from filename if not found in data
        let timestamp = new Date().toISOString();
        let onlineDevices = 0;
        
        if (deviceDataEntry) {
          timestamp = deviceDataEntry.timestamp;
          onlineDevices = deviceDataEntry.onlineDevices;
        } else {
          // Try to extract date from filename (screenshot_2023-04-03T12-34-56.png)
          const match = file.match(/screenshot_(.+)\.png/);
          if (match && match[1]) {
            const dateStr = match[1].replace(/-/g, ':').replace('T', ' ');
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              timestamp = date.toISOString();
            }
          }
        }
        
        const filePath = path.join(screenshotsDir, file);
        console.log(`Processing file: ${filePath}`);
        
        // Special handling for file uploads in Node.js environment
        const formData = new FormData();
        
        // Read file data
        const fileData = fs.readFileSync(filePath);
        console.log(`File ${file} size: ${fileData.length} bytes`);
        
        // Create file object with correct MIME type
        const fileObject = new File([fileData], file, { type: 'image/png' });
        
        // Add file to form data - using the correct field name "screenshot" (singular)
        formData.append('screenshot', fileObject);
        formData.append('timestamp', timestamp);
        formData.append('onlineDevices', onlineDevices.toString());
        
        console.log(`Uploading file ${file} to PocketBase...`);
        // Save to PocketBase
        const record = await pb.collection('screenshots').create(formData);
        console.log(`File ${file} uploaded successfully with ID: ${record.id}`);
        
        results.push({
          file,
          success: true,
          id: record.id
        });
      } catch (error) {
        console.error(`Error migrating ${file}:`, error);
        results.push({
          file,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({ 
      message: `Migration completed with ${results.filter(r => r.success).length} successes and ${results.filter(r => !r.success).length} failures`,
      results 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Failed to migrate screenshots',
      message: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 