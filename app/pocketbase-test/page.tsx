'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function PocketBaseTestPage() {
  const [status, setStatus] = useState('Loading...');
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug-pocketbase');
        const data = await response.json();
        
        if (data.status === 'success') {
          setStatus(`Connected to PocketBase. Found ${data.recordCount} records.`);
          if (data.sampleRecord) {
            setSampleImage(data.sampleRecord.screenshotUrl);
          }
        } else {
          setStatus('Error connecting to PocketBase');
          setError(data.error || 'Unknown error');
        }
      } catch (error) {
        setStatus('Failed to fetch debug info');
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">PocketBase Connection Test</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className="text-lg">{status}</p>
        {error && (
          <div className="mt-2 p-3 bg-red-100 text-red-800 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Actions</h2>
        <div className="space-y-2">
          <Link href="/pocketbase-test/test-upload" className="text-blue-500 hover:underline block">
            Test File Upload to PocketBase
          </Link>
          <Link href="/api/debug-pocketbase" className="text-blue-500 hover:underline block" target="_blank">
            View Raw Debug JSON
          </Link>
          <Link href="/api/test-screenshot-upload" className="text-blue-500 hover:underline block" target="_blank">
            Run Test File Upload
          </Link>
        </div>
      </div>
      
      {sampleImage && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Sample Image</h2>
          <div className="mt-4 border rounded p-4">
            <p className="mb-2">Image using next/image (with unoptimized=true):</p>
            <div className="relative w-full h-[300px] bg-gray-100">
              <Image 
                src={sampleImage}
                alt="Sample screenshot from PocketBase"
                fill
                unoptimized={true}
                className="object-contain"
              />
            </div>
          </div>
          
          <div className="mt-4 border rounded p-4">
            <p className="mb-2">Image using standard img tag:</p>
            <img 
              src={sampleImage}
              alt="Sample screenshot from PocketBase"
              className="max-w-full h-auto max-h-[300px] object-contain"
            />
          </div>
          
          <div className="mt-4 border rounded p-4">
            <p className="mb-2">Direct URL:</p>
            <a href={sampleImage} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
              {sampleImage}
            </a>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 