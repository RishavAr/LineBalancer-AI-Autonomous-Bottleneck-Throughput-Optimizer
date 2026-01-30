// ============================================
// LineBalancer AI - Agent Reasoning Engine
// Core intelligence for bottleneck detection,
// predictions, and natural language queries
// ============================================

import {
  BottleneckAnalysis,
  RootCause,
  Recommendation,
  Prediction,
  SimulationResult,
  SimulationChange,
  AgentReasoning,
  AgentResponse,
  QueryIntent,
} from '@/types';

// ============================================
// Bottleneck Detection Agent
// ============================================

interface StationData {
  station_id: string;
  station_name: string;
  target_cycle_time: number;
  avg_cycle_time: number | null;
  stddev_cycle_time: number | null;
  sample_count: number;
  total_downtime: number | null;
  variance_percent: number | null;
}

interface ShiftData {
  shift: string;
  station_id: string;
  avg_cycle_time: number;
  sample_count: number;
}

export function analyzeBottlenecks(
  stationData: StationData[],
  shiftData: ShiftData[]
): BottleneckAnalysis[] {
  const analyses: BottleneckAnalysis[] = [];

  for (const station of stationData) {
    if (!station.avg_cycle_time) continue;

    const variancePercent = station.variance_percent || 0;
    const severity = getSeverity(variancePercent);
    const impactScore = calculateImpactScore(station, stationData);
    
    // Analyze root causes
    const rootCauses = analyzeRootCauses(station, shiftData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(station, rootCauses, impactScore);

    analyses.push({
      stationId: station.station_id,
      stationName: station.station_name,
      severity,
      avgCycleTime: station.avg_cycle_time,
      targetCycleTime: station.target_cycle_time,
      variancePercent,
      frequency: Math.floor(impactScore / 10),
      impactScore,
      rootCauses,
      recommendations,
    });
  }

  // Sort by impact score descending
  return analyses.sort((a, b) => b.impactScore - a.impactScore);
}

function getSeverity(variancePercent: number): BottleneckAnalysis['severity'] {
  if (variancePercent > 20) return 'critical';
  if (variancePercent > 10) return 'high';
  if (variancePercent > 5) return 'medium';
  return 'low';
}

function calculateImpactScore(station: StationData, allStations: StationData[]): number {
  // Impact based on:
  // 1. How much over target (40%)
  // 2. Variability/consistency (20%)
  // 3. Position in line - earlier = more impact (20%)
  // 4. Downtime contribution (20%)

  const varianceScore = Math.min(40, (station.variance_percent || 0) * 2);
  
  const stddev = station.stddev_cycle_time || 0;
  const coefficientOfVariation = station.avg_cycle_time ? (stddev / station.avg_cycle_time) * 100 : 0;
  const consistencyScore = Math.min(20, coefficientOfVariation);
  
  // Position impact (assuming lower station numbers are earlier in line)
  const stationNumber = parseInt(station.station_id.replace('ST', ''));
  const positionScore = Math.max(0, 20 - stationNumber * 2);
  
  // Downtime score
  const totalDowntime = allStations.reduce((sum, s) => sum + (s.total_downtime || 0), 0);
  const downtimeScore = totalDowntime > 0 
    ? ((station.total_downtime || 0) / totalDowntime) * 20 
    : 0;

  return Math.round(varianceScore + consistencyScore + positionScore + downtimeScore);
}

function analyzeRootCauses(station: StationData, shiftData: ShiftData[]): RootCause[] {
  const rootCauses: RootCause[] = [];
  
  // Check shift-based patterns
  const stationShifts = shiftData.filter(s => s.station_id === station.station_id);
  if (stationShifts.length > 1) {
    const avgByShift = stationShifts.reduce((acc, s) => {
      acc[s.shift] = s.avg_cycle_time;
      return acc;
    }, {} as Record<string, number>);
    
    const shiftVariance = Math.max(...Object.values(avgByShift)) - Math.min(...Object.values(avgByShift));
    const shiftVariancePercent = (shiftVariance / station.target_cycle_time) * 100;
    
    if (shiftVariancePercent > 10) {
      const worstShift = Object.entries(avgByShift).sort((a, b) => b[1] - a[1])[0];
      rootCauses.push({
        type: 'shift',
        description: `${worstShift[0]} shift shows ${Math.round(shiftVariancePercent)}% higher cycle times`,
        confidence: Math.min(0.9, shiftVariancePercent / 20),
        evidence: [
          `${worstShift[0]} shift average: ${Math.round(worstShift[1])}s`,
          `Target: ${station.target_cycle_time}s`,
        ],
      });
    }
  }
  
  // High variance suggests operator or process issues
  const stddev = station.stddev_cycle_time || 0;
  const cv = station.avg_cycle_time ? (stddev / station.avg_cycle_time) * 100 : 0;
  
  if (cv > 15) {
    rootCauses.push({
      type: 'operator',
      description: 'High cycle time variability suggests inconsistent operator performance',
      confidence: Math.min(0.85, cv / 25),
      evidence: [
        `Coefficient of variation: ${Math.round(cv)}%`,
        `Standard deviation: ${Math.round(stddev)}s`,
      ],
    });
  }
  
  // Consistent slowness suggests equipment or process issues
  if ((station.variance_percent || 0) > 15 && cv < 10) {
    rootCauses.push({
      type: 'equipment',
      description: 'Consistently slow performance suggests equipment limitations',
      confidence: 0.75,
      evidence: [
        `Consistent ${Math.round(station.variance_percent || 0)}% above target`,
        `Low variability indicates systematic issue`,
      ],
    });
  }
  
  // High downtime
  if ((station.total_downtime || 0) > 60) {
    rootCauses.push({
      type: 'equipment',
      description: 'Significant downtime indicates equipment reliability issues',
      confidence: 0.8,
      evidence: [
        `Total downtime: ${Math.round(station.total_downtime || 0)} minutes`,
      ],
    });
  }
  
  return rootCauses;
}

function generateRecommendations(
  station: StationData,
  rootCauses: RootCause[],
  impactScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let priority = 1;

  for (const cause of rootCauses) {
    switch (cause.type) {
      case 'shift':
        recommendations.push({
          id: `rec-${station.station_id}-shift`,
          type: 'training',
          description: `Provide additional training for underperforming shift at ${station.station_name}`,
          expectedImprovement: Math.round(cause.confidence * 15),
          implementationCost: 'low',
          timeToImplement: '1-2 weeks',
          priority: priority++,
        });
        break;
        
      case 'operator':
        recommendations.push({
          id: `rec-${station.station_id}-operator`,
          type: 'add_operator',
          description: `Add operator to ${station.station_name} to reduce workload and improve consistency`,
          expectedImprovement: Math.round(cause.confidence * 20),
          implementationCost: 'medium',
          timeToImplement: '2-4 weeks',
          priority: priority++,
        });
        recommendations.push({
          id: `rec-${station.station_id}-training`,
          type: 'training',
          description: `Standardize work procedures at ${station.station_name}`,
          expectedImprovement: Math.round(cause.confidence * 10),
          implementationCost: 'low',
          timeToImplement: '1 week',
          priority: priority++,
        });
        break;
        
      case 'equipment':
        recommendations.push({
          id: `rec-${station.station_id}-equipment`,
          type: 'equipment',
          description: `Upgrade or maintain equipment at ${station.station_name}`,
          expectedImprovement: Math.round(cause.confidence * 25),
          implementationCost: 'high',
          timeToImplement: '4-8 weeks',
          priority: priority++,
        });
        recommendations.push({
          id: `rec-${station.station_id}-maintenance`,
          type: 'maintenance',
          description: `Implement predictive maintenance schedule for ${station.station_name}`,
          expectedImprovement: Math.round(cause.confidence * 12),
          implementationCost: 'medium',
          timeToImplement: '2 weeks',
          priority: priority++,
        });
        break;
    }
  }

  // Line rebalancing for high impact stations
  if (impactScore > 50) {
    recommendations.push({
      id: `rec-${station.station_id}-rebalance`,
      type: 'rebalance',
      description: `Consider redistributing work from ${station.station_name} to adjacent stations`,
      expectedImprovement: 15,
      implementationCost: 'medium',
      timeToImplement: '2-3 weeks',
      priority: priority++,
    });
  }

  return recommendations;
}

// ============================================
// What-If Simulation Engine
// ============================================

interface SimulationInput {
  stations: Array<{
    id: string;
    name: string;
    targetCycleTime: number;
    avgCycleTime: number;
    operatorCount: number;
  }>;
  changes: SimulationChange[];
}

export function runSimulation(input: SimulationInput): {
  baseline: SimulationResult;
  projected: SimulationResult;
} {
  // Calculate baseline
  const baseline = calculateLineMetrics(input.stations);
  
  // Apply changes and calculate projected
  const modifiedStations = input.stations.map(station => {
    const stationChanges = input.changes.filter(c => c.stationId === station.id);
    let modified = { ...station };
    
    for (const change of stationChanges) {
      switch (change.type) {
        case 'add_operator':
          modified.operatorCount += change.value;
          // More operators = faster cycle time (diminishing returns)
          const improvement = 1 - (0.15 * change.value * (1 / Math.sqrt(modified.operatorCount)));
          modified.avgCycleTime = station.avgCycleTime * improvement;
          break;
          
        case 'remove_operator':
          modified.operatorCount = Math.max(1, modified.operatorCount - change.value);
          // Fewer operators = slower cycle time
          const degradation = 1 + (0.2 * change.value);
          modified.avgCycleTime = station.avgCycleTime * degradation;
          break;
          
        case 'change_cycle_time':
          modified.avgCycleTime = change.value;
          break;
      }
    }
    
    return modified;
  });
  
  const projected = calculateLineMetrics(modifiedStations);
  
  return { baseline, projected };
}

function calculateLineMetrics(
  stations: Array<{
    id: string;
    name: string;
    targetCycleTime: number;
    avgCycleTime: number;
    operatorCount: number;
  }>
): SimulationResult {
  // Find bottleneck (station with highest cycle time)
  let bottleneckStation: string | null = null;
  let maxCycleTime = 0;
  
  for (const station of stations) {
    if (station.avgCycleTime > maxCycleTime) {
      maxCycleTime = station.avgCycleTime;
      bottleneckStation = station.id;
    }
  }
  
  // Line throughput is constrained by bottleneck
  const throughputPerHour = Math.floor(3600 / maxCycleTime);
  
  // Average cycle time across all stations
  const avgCycleTime = stations.reduce((sum, s) => sum + s.avgCycleTime, 0) / stations.length;
  
  // Calculate wait times and utilization
  const utilizationByStation: Record<string, number> = {};
  let waitTimeTotal = 0;
  
  for (const station of stations) {
    // Utilization = actual time / max time (bottleneck time)
    utilizationByStation[station.id] = Math.min(1, station.avgCycleTime / maxCycleTime);
    
    // Wait time is the difference from bottleneck
    waitTimeTotal += maxCycleTime - station.avgCycleTime;
  }
  
  // Line efficiency = sum of target times / (bottleneck * number of stations)
  const totalTargetTime = stations.reduce((sum, s) => sum + s.targetCycleTime, 0);
  const lineEfficiency = (totalTargetTime / (maxCycleTime * stations.length)) * 100;
  
  return {
    throughputPerHour,
    avgCycleTime: Math.round(avgCycleTime * 10) / 10,
    lineEfficiency: Math.round(lineEfficiency * 10) / 10,
    bottleneckStation,
    waitTimeTotal: Math.round(waitTimeTotal),
    utilizationByStation,
  };
}

// ============================================
// Prediction Engine
// ============================================

interface TrendDataPoint {
  hour: string;
  station_id: string;
  value: number;
}

export function generatePredictions(
  trendData: TrendDataPoint[],
  currentBottlenecks: BottleneckAnalysis[]
): Prediction[] {
  const predictions: Prediction[] = [];
  const now = new Date();
  
  // Group by station
  const byStation: Record<string, number[]> = {};
  for (const point of trendData) {
    if (!byStation[point.station_id]) {
      byStation[point.station_id] = [];
    }
    byStation[point.station_id].push(point.value);
  }
  
  // Analyze trends for each station
  for (const [stationId, values] of Object.entries(byStation)) {
    if (values.length < 10) continue;
    
    // Calculate trend (simple linear regression slope)
    const trend = calculateTrend(values);
    const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const historicalAvg = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Check for deteriorating performance
    if (trend > 0.5 && recentAvg > historicalAvg * 1.1) {
      const bottleneck = currentBottlenecks.find(b => b.stationId === stationId);
      
      predictions.push({
        id: `pred-${stationId}-delay`,
        type: 'delay',
        stationId,
        predictedTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
        confidence: Math.min(0.85, 0.5 + trend * 0.1),
        description: `${bottleneck?.stationName || stationId} showing deteriorating trend - expect delays within 4 hours`,
        preventiveActions: [
          'Monitor station closely',
          'Prepare backup operators',
          'Check equipment status',
        ],
      });
    }
    
    // Check for pattern indicating maintenance need
    const variance = calculateVariance(values.slice(-20));
    if (variance > historicalAvg * 0.3) {
      predictions.push({
        id: `pred-${stationId}-maintenance`,
        type: 'maintenance_needed',
        stationId,
        predictedTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        confidence: 0.7,
        description: `Increased variability at ${stationId} suggests equipment wear`,
        preventiveActions: [
          'Schedule preventive maintenance',
          'Inspect critical components',
          'Prepare spare parts',
        ],
      });
    }
  }
  
  return predictions;
}

function calculateTrend(values: number[]): number {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================
// Natural Language Query Agent
// ============================================

const QUERY_PATTERNS = [
  {
    pattern: /which station (hurt|affected|impacted|caused).*(output|throughput|production)/i,
    intent: { action: 'find' as const, metrics: ['throughput'] },
    sqlTemplate: `
      SELECT s.name as station_name, s.id as station_id,
        AVG(pr.cycle_time) as avg_cycle_time,
        s.target_cycle_time,
        ((AVG(pr.cycle_time) - s.target_cycle_time) / s.target_cycle_time * 100) as variance_pct
      FROM stations s
      JOIN production_records pr ON s.id = pr.station_id
      WHERE pr.timestamp >= datetime('now', '-{timeRange}')
      GROUP BY s.id
      ORDER BY variance_pct DESC
      LIMIT 5
    `,
  },
  {
    pattern: /compare.*(shifts?|day|night|swing)/i,
    intent: { action: 'compare' as const, metrics: ['cycle_time', 'throughput'] },
    sqlTemplate: `
      SELECT shift,
        AVG(cycle_time) as avg_cycle_time,
        SUM(quantity) as total_output,
        AVG(defects * 1.0 / NULLIF(quantity, 0) * 100) as defect_rate
      FROM production_records
      WHERE timestamp >= datetime('now', '-{timeRange}')
      GROUP BY shift
      ORDER BY shift
    `,
  },
  {
    pattern: /trend|trending|over time|history/i,
    intent: { action: 'trend' as const, metrics: ['cycle_time'] },
    sqlTemplate: `
      SELECT strftime('%Y-%m-%d', timestamp) as date,
        AVG(cycle_time) as avg_cycle_time,
        SUM(quantity) as total_output
      FROM production_records
      WHERE timestamp >= datetime('now', '-{timeRange}')
      GROUP BY date
      ORDER BY date
    `,
  },
  {
    pattern: /defect|quality|reject/i,
    intent: { action: 'find' as const, metrics: ['defect_rate'] },
    sqlTemplate: `
      SELECT s.name as station_name, s.id as station_id,
        SUM(pr.defects) as total_defects,
        SUM(pr.quantity) as total_quantity,
        (SUM(pr.defects) * 1.0 / NULLIF(SUM(pr.quantity), 0) * 100) as defect_rate
      FROM stations s
      JOIN production_records pr ON s.id = pr.station_id
      WHERE pr.timestamp >= datetime('now', '-{timeRange}')
      GROUP BY s.id
      ORDER BY defect_rate DESC
    `,
  },
  {
    pattern: /downtime|down time|stopped|idle/i,
    intent: { action: 'find' as const, metrics: ['downtime'] },
    sqlTemplate: `
      SELECT s.name as station_name, s.id as station_id,
        SUM(pr.downtime_minutes) as total_downtime,
        pr.downtime_reason,
        COUNT(*) as occurrences
      FROM stations s
      JOIN production_records pr ON s.id = pr.station_id
      WHERE pr.timestamp >= datetime('now', '-{timeRange}')
        AND pr.downtime_minutes > 0
      GROUP BY s.id, pr.downtime_reason
      ORDER BY total_downtime DESC
    `,
  },
  {
    pattern: /operator|worker|employee/i,
    intent: { action: 'find' as const, metrics: ['operator_performance'] },
    sqlTemplate: `
      SELECT o.name as operator_name, o.shift, s.name as station_name,
        AVG(pr.cycle_time) as avg_cycle_time,
        SUM(pr.defects) as total_defects,
        COUNT(*) as records
      FROM operators o
      JOIN production_records pr ON o.id = pr.operator_id
      JOIN stations s ON o.station_id = s.id
      WHERE pr.timestamp >= datetime('now', '-{timeRange}')
      GROUP BY o.id
      ORDER BY avg_cycle_time DESC
      LIMIT 10
    `,
  },
];

export function parseNaturalLanguageQuery(query: string): {
  intent: QueryIntent;
  sql: string;
  explanation: string;
} {
  // Extract time range
  let timeRange = '7 days';
  const timeMatch = query.match(/last\s+(\d+)\s+(day|week|hour|month)s?/i);
  if (timeMatch) {
    const [, num, unit] = timeMatch;
    timeRange = `${num} ${unit}s`;
  } else if (query.includes('today')) {
    timeRange = '1 day';
  } else if (query.includes('yesterday')) {
    timeRange = '2 days';
  } else if (query.includes('this week')) {
    timeRange = '7 days';
  } else if (query.includes('this month')) {
    timeRange = '30 days';
  }

  // Find matching pattern
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.pattern.test(query)) {
      const sql = pattern.sqlTemplate.replace('{timeRange}', timeRange);
      
      return {
        intent: {
          action: pattern.intent.action,
          entities: {
            timeRange: {
              start: new Date(Date.now() - parseDuration(timeRange)),
              end: new Date(),
            },
            metrics: pattern.intent.metrics,
          },
          filters: {},
        },
        sql,
        explanation: generateExplanation(pattern.intent.action, pattern.intent.metrics, timeRange),
      };
    }
  }

  // Default query - general bottleneck analysis
  return {
    intent: {
      action: 'find',
      entities: {
        timeRange: {
          start: new Date(Date.now() - parseDuration(timeRange)),
          end: new Date(),
        },
        metrics: ['cycle_time'],
      },
      filters: {},
    },
    sql: `
      SELECT s.name as station_name, s.id as station_id,
        AVG(pr.cycle_time) as avg_cycle_time,
        s.target_cycle_time,
        ((AVG(pr.cycle_time) - s.target_cycle_time) / s.target_cycle_time * 100) as variance_pct
      FROM stations s
      JOIN production_records pr ON s.id = pr.station_id
      WHERE pr.timestamp >= datetime('now', '-${timeRange}')
      GROUP BY s.id
      ORDER BY variance_pct DESC
    `,
    explanation: `Analyzing overall station performance for the ${timeRange}`,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(day|week|hour|month)s?/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  
  const [, num, unit] = match;
  const value = parseInt(num);
  
  switch (unit.toLowerCase()) {
    case 'hour': return value * 60 * 60 * 1000;
    case 'day': return value * 24 * 60 * 60 * 1000;
    case 'week': return value * 7 * 24 * 60 * 60 * 1000;
    case 'month': return value * 30 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

function generateExplanation(action: string, metrics: string[], timeRange: string): string {
  const metricNames = metrics.map(m => m.replace('_', ' ')).join(', ');
  
  switch (action) {
    case 'find':
      return `Finding stations with notable ${metricNames} patterns over the ${timeRange}`;
    case 'compare':
      return `Comparing ${metricNames} across different dimensions for the ${timeRange}`;
    case 'trend':
      return `Analyzing ${metricNames} trends over the ${timeRange}`;
    case 'predict':
      return `Generating predictions based on ${metricNames} data from the ${timeRange}`;
    default:
      return `Analyzing ${metricNames} for the ${timeRange}`;
  }
}

export function generateAgentResponse(
  query: string,
  data: Record<string, unknown>[],
  parsedQuery: { intent: QueryIntent; sql: string; explanation: string }
): AgentResponse {
  const reasoning: AgentReasoning[] = [
    {
      step: 1,
      thought: 'Parsing user query to understand intent and extract parameters',
      action: 'Parse natural language',
      observation: `Detected ${parsedQuery.intent.action} query about ${parsedQuery.intent.entities?.metrics?.join(', ') || 'general metrics'}`,
    },
    {
      step: 2,
      thought: 'Generating SQL query to fetch relevant data',
      action: 'Generate SQL',
      observation: `Created query to analyze data from ${parsedQuery.intent.entities?.timeRange?.start?.toLocaleDateString() || 'recent period'}`,
    },
    {
      step: 3,
      thought: 'Executing query and analyzing results',
      action: 'Execute and analyze',
      observation: `Retrieved ${data.length} data points for analysis`,
    },
    {
      step: 4,
      thought: 'Synthesizing findings into actionable insights',
      action: 'Generate response',
      observation: 'Formulating natural language response with key findings',
    },
  ];

  // Generate natural language answer
  let answer = '';
  const insights: string[] = [];
  
  if (data.length === 0) {
    answer = 'No data found for the specified query and time range.';
  } else if (parsedQuery.intent.action === 'find') {
    // Find worst performer
    const worst = data[0] as Record<string, unknown>;
    answer = `Based on the analysis, **${worst.station_name || worst.station_id}** shows the most significant issues`;
    
    if ('variance_pct' in worst) {
      answer += ` with cycle times **${Math.round(worst.variance_pct as number)}% above target**.`;
      insights.push(`The top 3 underperforming stations account for most of the throughput loss`);
    } else if ('defect_rate' in worst) {
      answer += ` with a defect rate of **${(worst.defect_rate as number).toFixed(1)}%**.`;
      insights.push(`Quality issues are concentrated in specific stations`);
    } else if ('total_downtime' in worst) {
      answer += ` with **${Math.round(worst.total_downtime as number)} minutes** of total downtime.`;
      insights.push(`Downtime patterns suggest equipment reliability issues`);
    }
    
    if (data.length > 1) {
      const second = data[1] as Record<string, unknown>;
      insights.push(`${second.station_name || second.station_id} is the second most impacted station`);
    }
  } else if (parsedQuery.intent.action === 'compare') {
    answer = 'Shift comparison analysis:\n\n';
    for (const row of data as Array<Record<string, unknown>>) {
      answer += `**${row.shift}**: ${(row.avg_cycle_time as number).toFixed(1)}s avg cycle time, ${row.total_output || 0} units\n`;
    }
    
    // Find best/worst shift
    const sortedByTime = [...data].sort((a, b) => 
      (a.avg_cycle_time as number) - (b.avg_cycle_time as number)
    );
    insights.push(`${(sortedByTime[0] as Record<string, unknown>).shift} shift has the best performance`);
    if (sortedByTime.length > 1) {
      insights.push(`${(sortedByTime[sortedByTime.length - 1] as Record<string, unknown>).shift} shift may need attention`);
    }
  } else if (parsedQuery.intent.action === 'trend') {
    answer = 'Trend analysis shows ';
    if (data.length >= 2) {
      const first = data[0] as Record<string, unknown>;
      const last = data[data.length - 1] as Record<string, unknown>;
      const change = ((last.avg_cycle_time as number) - (first.avg_cycle_time as number)) / (first.avg_cycle_time as number) * 100;
      
      if (change > 5) {
        answer += `cycle times have **increased by ${Math.abs(change).toFixed(1)}%** over the period.`;
        insights.push('Performance is trending downward - investigation recommended');
      } else if (change < -5) {
        answer += `cycle times have **improved by ${Math.abs(change).toFixed(1)}%** over the period.`;
        insights.push('Performance is improving - current strategies appear effective');
      } else {
        answer += 'relatively **stable performance** over the period.';
        insights.push('Performance is consistent but may have room for improvement');
      }
    }
  }

  return {
    answer,
    reasoning,
    confidence: data.length > 10 ? 0.85 : data.length > 0 ? 0.7 : 0.3,
    sources: ['Production database', 'Real-time metrics'],
    suggestions: [
      'Would you like to see a detailed breakdown by station?',
      'Should I run a simulation to test improvement scenarios?',
      'Want me to analyze trends over a different time period?',
    ],
  };
}
