import { NextRequest, NextResponse } from 'next/server';
import pb from '@/lib/pocketbase';

export async function POST(request: NextRequest) {
  try {
    console.log('Processing client upload...');
    
    // Get the form data from the request
    let formData = await request.formData();
    
    // Log what's in the form data
    console.log('Form data entries:');
    for (const pair of formData.entries()) {
      console.log(`- ${pair[0]}: ${typeof pair[1]} ${pair[1] instanceof File ? `(File: ${pair[1].name}, ${pair[1].size} bytes)` : pair[1]}`);
    }
    
    // Extract the file - ensure we're using the correct field name
    const file = formData.get('screenshot');
    
    if (!file || !(file instanceof File)) {
      // Check if file was submitted with wrong field name and fix it
      const wrongFieldFile = formData.get('screenshots');
      if (wrongFieldFile && wrongFieldFile instanceof File) {
        console.log('Found file with wrong field name "screenshots", fixing to "screenshot"');
        
        // Create a new FormData with the correct field name
        const fixedFormData = new FormData();
        fixedFormData.append('screenshot', wrongFieldFile);
        
        // Copy over other fields
        for (const [key, value] of formData.entries()) {
          if (key !== 'screenshots') {
            fixedFormData.append(key, value);
          }
        }
        
        // Replace the formData
        formData = fixedFormData;
      } else {
        return NextResponse.json({
          success: false,
          error: 'No file provided or invalid file'
        }, { status: 400 });
      }
    }
    
    // Re-check to make sure we have the file
    const finalFile = formData.get('screenshot');
    if (!finalFile || !(finalFile instanceof File)) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process file upload'
      }, { status: 400 });
    }
    
    console.log(`Processing file: ${finalFile.name}, size: ${finalFile.size} bytes, type: ${finalFile.type}`);
    
    try {
      // Create record in PocketBase
      const record = await pb.collection('screenshots').create(formData);
      console.log(`Record created successfully with ID: ${record.id}`);
      
      // Get file URL - using the correct field name
      const fileUrl = record.screenshot ? pb.files.getURL(record, record.screenshot) : null;
      console.log(`File URL: ${fileUrl || 'MISSING'}`);
      
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        id: record.id,
        fileUrl: fileUrl
      });
    } catch (error) {
      console.error('PocketBase upload error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 