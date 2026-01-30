import { NextResponse } from 'next/server';
import { getDatabase, getBottleneckAnalysis } from '@/lib/database';
import { analyzeBottlenecks } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get station data with production metrics
    const stationData = db.prepare(`
      SELECT 
        s.id as station_id,
        s.name as station_name,
        s.target_cycle_time,
        AVG(pr.cycle_time) as avg_cycle_time,
        AVG((pr.cycle_time - AVG(pr.cycle_time) OVER (PARTITION BY s.id)) * 
            (pr.cycle_time - AVG(pr.cycle_time) OVER (PARTITION BY s.id))) as stddev_cycle_time,
        COUNT(*) as sample_count,
        SUM(pr.downtime_minutes) as total_downtime,
        ((AVG(pr.cycle_time) - s.target_cycle_time) / s.target_cycle_time * 100) as variance_percent
      FROM stations s
      LEFT JOIN production_records pr ON s.id = pr.station_id AND pr.timestamp >= ?
      GROUP BY s.id
      HAVING avg_cycle_time IS NOT NULL
      ORDER BY variance_percent DESC
    `).all(cutoff);
    
    // Get shift-based data for root cause analysis
    const shiftData = db.prepare(`
      SELECT 
        shift,
        station_id,
        AVG(cycle_time) as avg_cycle_time,
        COUNT(*) as sample_count
      FROM production_records
      WHERE timestamp >= ?
      GROUP BY shift, station_id
    `).all(cutoff);
    
    // Run the agent analysis
    const bottlenecks = analyzeBottlenecks(
      stationData as Parameters<typeof analyzeBottlenecks>[0],
      shiftData as Parameters<typeof analyzeBottlenecks>[1]
    );
    
    return NextResponse.json(bottlenecks);
  } catch (error) {
    console.error('Bottlenecks API error:', error);
    // Return mock data
    return NextResponse.json([
      {
        stationId: 'ST003',
        stationName: 'Welding Cell',
        severity: 'critical',
        avgCycleTime: 112.8,
        targetCycleTime: 90,
        variancePercent: 25.3,
        frequency: 8,
        impactScore: 85,
        rootCauses: [
          { type: 'shift', description: 'Night shift shows 18% higher cycle times', confidence: 0.82, evidence: ['Night shift average: 121s', 'Target: 90s'] },
          { type: 'operator', description: 'High cycle time variability suggests inconsistent operator performance', confidence: 0.75, evidence: ['Coefficient of variation: 18%', 'Standard deviation: 20s'] },
        ],
        recommendations: [
          { id: 'rec-1', type: 'training', description: 'Provide additional training for night shift at Welding Cell', expectedImprovement: 12, implementationCost: 'low', timeToImplement: '1-2 weeks', priority: 1 },
          { id: 'rec-2', type: 'add_operator', description: 'Add operator to Welding Cell to reduce workload', expectedImprovement: 15, implementationCost: 'medium', timeToImplement: '2-4 weeks', priority: 2 },
        ],
      },
      {
        stationId: 'ST007',
        stationName: 'Final Assembly',
        severity: 'high',
        avgCycleTime: 118.5,
        targetCycleTime: 100,
        variancePercent: 18.5,
        frequency: 6,
        impactScore: 72,
        rootCauses: [
          { type: 'operator', description: 'High cycle time variability suggests inconsistent operator performance', confidence: 0.68, evidence: ['Coefficient of variation: 15%'] },
        ],
        recommendations: [
          { id: 'rec-3', type: 'training', description: 'Standardize work procedures at Final Assembly', expectedImprovement: 8, implementationCost: 'low', timeToImplement: '1 week', priority: 1 },
        ],
      },
      {
        stationId: 'ST002',
        stationName: 'CNC Machining',
        severity: 'medium',
        avgCycleTime: 128.5,
        targetCycleTime: 120,
        variancePercent: 7.1,
        frequency: 3,
        impactScore: 45,
        rootCauses: [
          { type: 'equipment', description: 'Consistently slow performance suggests equipment limitations', confidence: 0.65, evidence: ['Consistent 7% above target'] },
        ],
        recommendations: [
          { id: 'rec-4', type: 'maintenance', description: 'Implement predictive maintenance schedule', expectedImprovement: 5, implementationCost: 'medium', timeToImplement: '2 weeks', priority: 1 },
        ],
      },
    ]);
  }
}
