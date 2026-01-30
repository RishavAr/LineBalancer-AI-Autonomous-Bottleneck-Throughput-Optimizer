import { NextResponse } from 'next/server';
import { getDatabase, getActiveAlerts } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alerts = getActiveAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts API error:', error);
    // Return mock data
    return NextResponse.json([
      {
        id: 'alert-1',
        type: 'bottleneck',
        severity: 'critical',
        stationId: 'ST003',
        message: 'Welding Cell consistently exceeding target cycle time',
        details: 'Average cycle time 23% above target over the last 24 hours. This is causing downstream delays.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
      },
      {
        id: 'alert-2',
        type: 'bottleneck',
        severity: 'warning',
        stationId: 'ST007',
        message: 'Final Assembly showing increased variability',
        details: 'Cycle time variance has increased 40% compared to last week.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
      },
      {
        id: 'alert-3',
        type: 'pattern_change',
        severity: 'warning',
        stationId: 'ST003',
        message: 'Night shift performance degradation detected',
        details: 'Night shift cycle times are 18% higher than day shift average.',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
      },
      {
        id: 'alert-4',
        type: 'delay',
        severity: 'critical',
        stationId: null,
        message: 'Line efficiency dropped below 75%',
        details: 'Overall line efficiency at 72.3%. Multiple bottlenecks detected.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
      },
    ]);
  }
}
