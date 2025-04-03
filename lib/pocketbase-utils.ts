import fs from 'fs';
import pb from './pocketbase';

/**
 * Format a PocketBase image URL to ensure it works with all components
 * This is needed because Next.js Image component has strict domain requirements
 */
export function formatImageUrl(url: string): string {
  // If the URL is already relative or is a placeholder, return as is
  if (!url || url.startsWith('/')) {
    return url;
  }
  
  // Always convert PocketBase URLs to use our proxy API for consistent handling
  if (url.startsWith('http://localhost:8090/api/files/')) {
    // Extract the path after /api/files/ and route through our proxy
    // Add cache-busting to prevent browser caching
    const pbPath = url.replace('http://localhost:8090/api/files/', '');
    const timestamp = Date.now();
    return `/api/pb-image/${pbPath}?nocache=${timestamp}`;
  }
  
  // Return other URLs as is
  return url;
}

/**
 * Helper function to handle FormData creation for PocketBase file uploads
 */
export async function createScreenshotRecord(
  screenshotPath: string, 
  timestamp: string,
  onlineDevices: number
) {
  try {
    console.log(`Creating screenshot record from path: ${screenshotPath}`);
    // Create FormData
    const formData = new FormData();
    
    // Read file and create blob
    const fileData = fs.readFileSync(screenshotPath);
    const fileName = screenshotPath.split('/').pop() || `screenshot_${Date.now()}.png`;
    console.log(`File name: ${fileName}, size: ${fileData.length} bytes`);
    
    // Create a proper file object
    const file = new File([fileData], fileName, { type: 'image/png' });
    
    // Add data to FormData - NOTE: Using "screenshot" (singular) to match PocketBase field name
    formData.append('screenshot', file);
    formData.append('timestamp', timestamp);
    formData.append('onlineDevices', onlineDevices.toString());
    
    // Log form data entries
    console.log('FormData contents:');
    for (const pair of formData.entries()) {
      console.log(`- ${pair[0]}: ${typeof pair[1]} ${pair[1] instanceof File ? '(File: ' + pair[1].name + ', ' + pair[1].size + ' bytes)' : pair[1]}`);
    }
    
    // Create record in PocketBase
    const record = await pb.collection('screenshots').create(formData);
    console.log(`Record created successfully with ID: ${record.id}`);
    return record;
  } catch (error) {
    console.error('Error creating PocketBase record:', error);
    throw error;
  }
}

/**
 * Helper function to fetch screenshots from PocketBase
 */
export async function getScreenshots(limit: number = 50) {
  try {
    console.log('Fetching screenshots from PocketBase...');
    const records = await pb.collection('screenshots').getList(1, limit, {
      sort: '-timestamp',
    });
    
    console.log(`Successfully fetched ${records.items.length} screenshots from PocketBase`);
    
    return records.items.map(record => {
      // Using "screenshot" (singular) to match PocketBase field name
      const imageUrl = record.screenshot ? pb.files.getURL(record, record.screenshot) : null;
      console.log(`Screenshot ${record.id} URL: ${imageUrl || 'MISSING'}`);
      
      // Return raw URLs without transformation - let the API handle it
      return {
        name: record.id,
        path: imageUrl || '',
        date: record.timestamp
      };
    });
  } catch (error) {
    console.error('Error fetching screenshots from PocketBase:', error);
    throw error;
  }
}

/**
 * Helper function to fetch device history data from PocketBase
 */
export async function getDevicesData(limit: number = 100) {
  try {
    console.log('Fetching device data from PocketBase...');
    const records = await pb.collection('screenshots').getList(1, limit, {
      sort: 'timestamp',
    });
    
    console.log(`Successfully fetched ${records.items.length} device data records from PocketBase`);
    
    return records.items.map(record => {
      // Using "screenshot" (singular) to match PocketBase field name
      const imageUrl = record.screenshot ? pb.files.getURL(record, record.screenshot) : null;
      return {
        timestamp: record.timestamp,
        onlineDevices: record.onlineDevices,
        screenshotPath: imageUrl || ''
      };
    });
  } catch (error) {
    console.error('Error fetching devices data from PocketBase:', error);
    throw error;
  }
}

/**
 * Check if PocketBase server is available
 */
export async function isPocketBaseAvailable() {
  try {
    console.log('Checking PocketBase availability...');
    
    // Use a simple health check first
    await pb.health.check();
    console.log('PocketBase health check passed');
    
    // Don't try to get collection info as it requires authentication
    // Just check if we can list collections (which doesn't require auth)
    try {
      await pb.collections.getFullList();
      console.log('Successfully connected to PocketBase');
    } catch (collectionError) {
      // Even if this fails with auth error, PocketBase is still available
      console.log('PocketBase available but collection access requires authentication');
    }
    
    return true;
  } catch (error) {
    console.error('PocketBase server is not available:', error);
    return false;
  }
} 