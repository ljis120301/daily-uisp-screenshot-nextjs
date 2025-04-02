import { NextResponse } from 'next/server';
import { takeScreenshot } from '@/app/utils/screenshotService';

export async function POST() {
  try {
    const success = await takeScreenshot();
    if (success) {
      return NextResponse.json({ message: 'Screenshot taken successfully' });
    } else {
      return NextResponse.json({ message: 'Failed to take screenshot' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 