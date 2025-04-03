'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TestUploadPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedImage(e.target.files[0]);
      setStatus(`File selected: ${e.target.files[0].name} (${e.target.files[0].size} bytes)`);
    }
  };

  // Handle test upload button
  const handleTestUpload = async () => {
    setIsLoading(true);
    setStatus('Testing server-side file upload...');
    setError(null);
    setImageUrl(null);
    
    try {
      const response = await fetch('/api/test-screenshot-upload');
      const data = await response.json();
      
      if (data.success) {
        setStatus('Test file upload successful!');
        setImageUrl(data.record.fileUrl);
      } else {
        setStatus('Test file upload failed');
        setError(data.error || 'Unknown error');
      }
    } catch (error) {
      setStatus('Error occurred during test');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual upload
  const handleManualUpload = async () => {
    if (!uploadedImage) {
      setError('Please select a file first');
      return;
    }
    
    setIsLoading(true);
    setStatus('Uploading file...');
    setError(null);
    setImageUrl(null);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('screenshot', uploadedImage);
      formData.append('timestamp', new Date().toISOString());
      formData.append('onlineDevices', '999');
      
      // Send to PocketBase directly from client
      const response = await fetch('/api/client-upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('File uploaded successfully!');
        setImageUrl(data.fileUrl);
      } else {
        setStatus('File upload failed');
        setError(data.error || 'Unknown error');
      }
    } catch (error) {
      setStatus('Error occurred during upload');
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">PocketBase File Upload Test</h1>

      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold">Test Server-Side Upload</h2>
        <p className="text-sm text-gray-600">Tests uploading a test image from the server to PocketBase</p>
        <button
          onClick={handleTestUpload}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Run Server Test'}
        </button>
      </div>

      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold">Test Client-Side Upload</h2>
        <p className="text-sm text-gray-600">Upload your own image to PocketBase</p>
        
        <div className="flex flex-col gap-4">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          
          <button
            onClick={handleManualUpload}
            disabled={isLoading || !uploadedImage}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Uploading...' : 'Upload to PocketBase'}
          </button>
        </div>
      </div>
      
      {status && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Status:</h3>
          <p>{status}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 border rounded bg-red-50 text-red-800">
          <h3 className="font-semibold mb-2">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {imageUrl && (
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold">Uploaded Image:</h3>
          <div className="border rounded p-4">
            <div className="relative w-full h-[300px]">
              <Image
                src={imageUrl}
                alt="Uploaded image"
                fill
                unoptimized={true}
                className="object-contain"
              />
            </div>
          </div>
          <p className="break-all text-sm text-gray-600">{imageUrl}</p>
        </div>
      )}

      <div className="mt-8">
        <Link href="/pocketbase-test" className="text-blue-500 hover:underline">
          Back to PocketBase Test
        </Link>
      </div>
    </div>
  );
} 