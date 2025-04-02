'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageModal from '@/components/ImageModal';
import { DevicesChart } from '@/components/DevicesChart';
import Loader from '@/components/loader';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Screenshot {
  name: string;
  path: string;
  date: string;
}

const SCREENSHOTS_PER_PAGE = 3;

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchScreenshots = async () => {
    try {
      const response = await fetch('/api/screenshots');
      const data = await response.json();
      setScreenshots(data.screenshots);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const takeScreenshot = async () => {
    setIsLoading(true);
    setMessage('Taking screenshot...');
    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
      });
      const data = await response.json();
      setMessage(data.message);
      await fetchScreenshots();
      setCurrentPage(1);
    } catch (error) {
      setMessage('Error taking screenshot');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(screenshots.length / SCREENSHOTS_PER_PAGE);
  const startIndex = (currentPage - 1) * SCREENSHOTS_PER_PAGE;
  const endIndex = startIndex + SCREENSHOTS_PER_PAGE;
  const currentScreenshots = screenshots.slice(startIndex, endIndex);

  return (
    <div className="py-8">
      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manual Screenshot</h2>
            <button
              onClick={takeScreenshot}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {isLoading ? 'Taking Screenshot...' : 'Take Screenshot Now'}
            </button>
          </div>
          {message && (
            <div className="mt-4 flex items-center gap-2">
              {isLoading && <div className="scale-50"><Loader /></div>}
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Online Devices History</h2>
          <DevicesChart />
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Latest Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentScreenshots.length > 0 ? (
              currentScreenshots.map((screenshot) => (
                <div 
                  key={screenshot.name} 
                  className="group relative aspect-video cursor-pointer rounded-lg overflow-hidden border bg-card shadow-sm transition-all hover:shadow-md"
                  onClick={() => setSelectedScreenshot(screenshot)}
                >
                  <Image
                    src={screenshot.path}
                    alt={`Screenshot from ${new Date(screenshot.date).toLocaleString()}`}
                    fill
                    className="object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm text-foreground">
                        {new Date(screenshot.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No screenshots available yet.
              </p>
            )}
          </div>

          {screenshots.length > SCREENSHOTS_PER_PAGE && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {selectedScreenshot && (
        <ImageModal
          imagePath={selectedScreenshot.path}
          date={selectedScreenshot.date}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </div>
  );
}
