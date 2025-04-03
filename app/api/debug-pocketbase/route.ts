import { NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';
import { isPocketBaseAvailable } from '@/lib/pocketbase-utils';

export async function GET() {
  try {
    // Check if PocketBase is available
    const isPbAvailable = await isPocketBaseAvailable();
    
    if (!isPbAvailable) {
      return NextResponse.json({ 
        status: 'error',
        message: 'PocketBase server not available',
        error: 'Failed to connect to PocketBase server'
      }, { status: 500 });
    }
    
    // Try to fetch a sample record
    try {
      console.log('Attempting to fetch screenshots from PocketBase...');
      const records = await pb.collection('screenshots').getList(1, 1, {
        sort: '-created',
      });
      
      console.log(`Retrieved ${records.totalItems} records from PocketBase`);
      
      if (records.items.length === 0) {
        return NextResponse.json({
          status: 'success',
          connected: true,
          message: 'Connected to PocketBase, but no records found in screenshots collection',
          recordCount: 0
        });
      }
      
      const sampleRecord = records.items[0];
      console.log(`Sample record ID: ${sampleRecord.id}`);
      console.log(`Sample record screenshot field: ${JSON.stringify(sampleRecord.screenshot)}`);
      
      // Check if screenshot field is populated
      if (!sampleRecord.screenshot) {
        return NextResponse.json({
          status: 'warning',
          connected: true,
          message: 'Connected to PocketBase, but screenshot file is missing in record',
          recordCount: records.totalItems,
          sampleRecord: {
            id: sampleRecord.id,
            timestamp: sampleRecord.timestamp,
            onlineDevices: sampleRecord.onlineDevices,
            created: sampleRecord.created,
            screenshotData: sampleRecord.screenshot
          }
        });
      }
      
      const sampleFileUrl = pb.files.getURL(sampleRecord, sampleRecord.screenshot);
      console.log(`Generated file URL: ${sampleFileUrl}`);
      
      return NextResponse.json({
        status: 'success',
        connected: true,
        message: 'Successfully connected to PocketBase',
        recordCount: records.totalItems,
        sampleRecord: {
          id: sampleRecord.id,
          timestamp: sampleRecord.timestamp,
          onlineDevices: sampleRecord.onlineDevices,
          created: sampleRecord.created,
          screenshotUrl: sampleFileUrl
        }
      });
    } catch (error) {
      console.error('Error fetching records:', error);
      
      // Check if this is an auth error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('auth')) {
        return NextResponse.json({
          status: 'error',
          connected: true,
          message: 'Connected to PocketBase but authentication required',
          error: errorMessage
        }, { status: 401 });
      }
      
      return NextResponse.json({
        status: 'error',
        connected: true,
        message: 'Connected to PocketBase but failed to fetch records',
        error: errorMessage
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to connect to PocketBase:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to PocketBase',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 