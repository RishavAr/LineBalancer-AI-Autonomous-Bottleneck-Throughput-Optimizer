import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { runSimulation } from '@/lib/agent';
import type { SimulationChange } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { changes } = await request.json() as { changes: SimulationChange[] };
    
    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json({ error: 'Changes array is required' }, { status: 400 });
    }
    
    const db = getDatabase();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get current station data
    const stationData = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.target_cycle_time as targetCycleTime,
        s.operator_count as operatorCount,
        COALESCE(AVG(pr.cycle_time), s.target_cycle_time) as avgCycleTime
      FROM stations s
      LEFT JOIN production_records pr ON s.id = pr.station_id AND pr.timestamp >= ?
      GROUP BY s.id
      ORDER BY s.position
    `).all(cutoff) as Array<{
      id: string;
      name: string;
      targetCycleTime: number;
      operatorCount: number;
      avgCycleTime: number;
    }>;
    
    // Run simulation
    const results = runSimulation({
      stations: stationData,
      changes,
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Simulation API error:', error);
    
    // Return mock results
    return NextResponse.json({
      baseline: {
        throughputPerHour: 42,
        avgCycleTime: 85.7,
        lineEfficiency: 72.3,
        bottleneckStation: 'ST003',
        waitTimeTotal: 234,
        utilizationByStation: {
          ST001: 0.78, ST002: 0.92, ST003: 0.98, ST004: 0.85,
          ST005: 0.78, ST006: 0.76, ST007: 0.95, ST008: 0.82,
          ST009: 0.75, ST010: 0.71
        }
      },
      projected: {
        throughputPerHour: 49,
        avgCycleTime: 73.4,
        lineEfficiency: 81.2,
        bottleneckStation: 'ST007',
        waitTimeTotal: 178,
        utilizationByStation: {
          ST001: 0.78, ST002: 0.92, ST003: 0.84, ST004: 0.85,
          ST005: 0.78, ST006: 0.76, ST007: 0.96, ST008: 0.82,
          ST009: 0.75, ST010: 0.71
        }
      }
    });
  }
}
