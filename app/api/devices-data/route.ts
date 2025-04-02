import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const devicesDataFile = path.join(dataDir, 'online_devices_history.json');
    
    if (!fs.existsSync(devicesDataFile)) {
      return NextResponse.json([]);
    }

    const data = JSON.parse(fs.readFileSync(devicesDataFile, 'utf8'));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading devices data:', error);
    return NextResponse.json({ error: 'Failed to read devices data' }, { status: 500 });
  }
} 