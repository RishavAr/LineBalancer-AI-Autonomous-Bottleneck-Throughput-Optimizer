import { NextResponse } from 'next/server';
import { getTrendData } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'cycle_time';
    const hours = parseInt(searchParams.get('hours') || '168');
    const stationId = searchParams.get('stationId') || null;
    
    const data = getTrendData(metric, stationId, hours);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Trends API error:', error);
    
    // Generate mock trend data
    const mockData = [];
    const now = Date.now();
    const stations = ['ST001', 'ST002', 'ST003', 'ST004', 'ST005'];
    
    for (let i = 168; i >= 0; i -= 6) {
      const hour = new Date(now - i * 60 * 60 * 1000);
      const hourStr = hour.toISOString().slice(0, 13) + ':00:00';
      
      for (const stationId of stations) {
        const baseValue = stationId === 'ST003' ? 110 : stationId === 'ST007' ? 105 : 75;
        const variation = (Math.random() - 0.5) * 20;
        
        mockData.push({
          hour: hourStr,
          station_id: stationId,
          value: baseValue + variation,
        });
      }
    }
    
    return NextResponse.json(mockData);
  }
}
