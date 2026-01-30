// ============================================
// LineBalancer AI - Database Seeding
// Generates realistic manufacturing line data
// ============================================

import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const dbPath = path.join(process.cwd(), 'linebalancer.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  DROP TABLE IF EXISTS nlp_queries;
  DROP TABLE IF EXISTS simulations;
  DROP TABLE IF EXISTS alerts;
  DROP TABLE IF EXISTS production_records;
  DROP TABLE IF EXISTS operators;
  DROP TABLE IF EXISTS stations;
`);

db.exec(`
  CREATE TABLE stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_cycle_time REAL NOT NULL,
    position INTEGER NOT NULL,
    operator_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'running',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    shift TEXT NOT NULL,
    skill_level INTEGER DEFAULT 3,
    station_id TEXT,
    efficiency REAL DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE production_records (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    cycle_time REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    defects INTEGER DEFAULT 0,
    shift TEXT NOT NULL,
    downtime_minutes REAL DEFAULT 0,
    downtime_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (operator_id) REFERENCES operators(id)
  );

  CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    station_id TEXT,
    message TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged INTEGER DEFAULT 0,
    resolved_at DATETIME,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE simulations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    changes TEXT NOT NULL,
    baseline TEXT NOT NULL,
    projected TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE nlp_queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    parsed_intent TEXT,
    generated_sql TEXT,
    result TEXT,
    explanation TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_production_station ON production_records(station_id);
  CREATE INDEX idx_production_timestamp ON production_records(timestamp);
  CREATE INDEX idx_production_shift ON production_records(shift);
  CREATE INDEX idx_alerts_type ON alerts(type);
  CREATE INDEX idx_alerts_severity ON alerts(severity);
`);

// ============================================
// Seed Data
// ============================================

// Manufacturing line stations (automotive assembly example)
const stations = [
  { id: 'ST001', name: 'Material Loading', description: 'Raw material input and verification', targetCycleTime: 45, position: 1, operatorCount: 2 },
  { id: 'ST002', name: 'CNC Machining', description: 'Precision metal cutting and shaping', targetCycleTime: 120, position: 2, operatorCount: 3 },
  { id: 'ST003', name: 'Welding Cell', description: 'Automated and manual welding operations', targetCycleTime: 90, position: 3, operatorCount: 4 },
  { id: 'ST004', name: 'Surface Treatment', description: 'Cleaning, coating, and finishing', targetCycleTime: 75, position: 4, operatorCount: 2 },
  { id: 'ST005', name: 'Sub-Assembly A', description: 'Component sub-assembly station', targetCycleTime: 60, position: 5, operatorCount: 3 },
  { id: 'ST006', name: 'Sub-Assembly B', description: 'Secondary component assembly', targetCycleTime: 55, position: 6, operatorCount: 3 },
  { id: 'ST007', name: 'Final Assembly', description: 'Main product assembly', targetCycleTime: 100, position: 7, operatorCount: 5 },
  { id: 'ST008', name: 'Quality Inspection', description: 'Final quality check and testing', targetCycleTime: 50, position: 8, operatorCount: 2 },
  { id: 'ST009', name: 'Packaging', description: 'Product packaging and labeling', targetCycleTime: 40, position: 9, operatorCount: 2 },
  { id: 'ST010', name: 'Shipping Prep', description: 'Palletizing and shipping preparation', targetCycleTime: 35, position: 10, operatorCount: 2 },
];

// Operators with varied skill levels
const operatorNames = [
  'Marcus Chen', 'Sarah Williams', 'James Rodriguez', 'Emily Thompson', 'Michael Kim',
  'Jessica Brown', 'David Singh', 'Amanda Lee', 'Robert Taylor', 'Maria Garcia',
  'William Johnson', 'Jennifer Davis', 'Christopher Martinez', 'Lisa Anderson', 'Daniel Wilson',
  'Michelle Thomas', 'Steven Jackson', 'Kimberly White', 'Paul Harris', 'Nancy Martin',
  'Kevin Robinson', 'Laura Clark', 'Brian Lewis', 'Sandra Walker', 'Joseph Hall',
  'Rebecca Allen', 'Charles Young', 'Elizabeth King', 'Matthew Wright', 'Patricia Scott',
];

const shifts = ['day', 'night', 'swing'] as const;

// Insert stations
const insertStation = db.prepare(`
  INSERT INTO stations (id, name, description, target_cycle_time, position, operator_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const station of stations) {
  insertStation.run(station.id, station.name, station.description, station.targetCycleTime, station.position, station.operatorCount);
}

// Insert operators
const insertOperator = db.prepare(`
  INSERT INTO operators (id, name, shift, skill_level, station_id, efficiency)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const operators: { id: string; name: string; shift: string; skillLevel: number; stationId: string; efficiency: number }[] = [];

let operatorIdx = 0;
for (const station of stations) {
  for (let i = 0; i < station.operatorCount * 3; i++) { // 3 shifts
    const opId = `OP${String(operatorIdx + 1).padStart(3, '0')}`;
    const shift = shifts[i % 3];
    const skillLevel = Math.floor(Math.random() * 3) + 3; // 3-5
    const efficiency = 85 + Math.random() * 15; // 85-100%
    
    operators.push({
      id: opId,
      name: operatorNames[operatorIdx % operatorNames.length],
      shift,
      skillLevel,
      stationId: station.id,
      efficiency,
    });
    
    insertOperator.run(opId, operatorNames[operatorIdx % operatorNames.length], shift, skillLevel, station.id, efficiency);
    operatorIdx++;
  }
}

console.log(`Inserted ${stations.length} stations and ${operators.length} operators`);

// Generate production records for the last 30 days
const insertRecord = db.prepare(`
  INSERT INTO production_records 
  (id, station_id, operator_id, timestamp, cycle_time, quantity, defects, shift, downtime_minutes, downtime_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const downtimeReasons = [
  'Equipment maintenance', 'Material shortage', 'Quality issue upstream',
  'Operator break', 'Tool change', 'System calibration', 'Power fluctuation',
  null, null, null, null, null, // More nulls for normal operation
];

// Bottleneck simulation: Station ST003 (Welding) and ST007 (Final Assembly) have issues
const problematicStations = ['ST003', 'ST007'];
const nightShiftProblematic = true; // Night shift performs worse

let recordCount = 0;
const now = Date.now();
const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

// Generate ~50k records
const transaction = db.transaction(() => {
  for (let timestamp = thirtyDaysAgo; timestamp < now; timestamp += 5 * 60 * 1000) { // Every 5 minutes
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    // Determine shift
    let shift: 'day' | 'night' | 'swing';
    if (hour >= 6 && hour < 14) shift = 'day';
    else if (hour >= 14 && hour < 22) shift = 'swing';
    else shift = 'night';
    
    // Process each station
    for (const station of stations) {
      // Find operator for this station and shift
      const stationOperators = operators.filter(op => op.stationId === station.id && op.shift === shift);
      if (stationOperators.length === 0) continue;
      
      const operator = stationOperators[Math.floor(Math.random() * stationOperators.length)];
      
      // Calculate cycle time with variations
      let cycleTimeMultiplier = 1;
      let defectProbability = 0.02; // 2% base defect rate
      let downtimeProbability = 0.05; // 5% base downtime probability
      
      // Problematic stations have higher cycle times
      if (problematicStations.includes(station.id)) {
        cycleTimeMultiplier += 0.15 + Math.random() * 0.2; // 15-35% slower
        defectProbability += 0.03;
        downtimeProbability += 0.1;
      }
      
      // Night shift issues
      if (shift === 'night' && nightShiftProblematic) {
        cycleTimeMultiplier += 0.08 + Math.random() * 0.1;
        defectProbability += 0.02;
      }
      
      // Operator efficiency effect
      cycleTimeMultiplier *= (200 - operator.efficiency) / 100;
      
      // Random daily variation
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 1) cycleTimeMultiplier += 0.05; // Monday blues
      if (dayOfWeek === 5) cycleTimeMultiplier += 0.03; // Friday fatigue
      
      // Calculate final cycle time
      const baseCycleTime = station.targetCycleTime * cycleTimeMultiplier;
      const variance = baseCycleTime * 0.15; // 15% variance
      const cycleTime = Math.max(
        station.targetCycleTime * 0.8,
        baseCycleTime + (Math.random() - 0.5) * 2 * variance
      );
      
      // Calculate defects
      const defects = Math.random() < defectProbability ? Math.floor(Math.random() * 3) + 1 : 0;
      
      // Calculate downtime
      let downtimeMinutes = 0;
      let downtimeReason: string | null = null;
      if (Math.random() < downtimeProbability) {
        downtimeMinutes = Math.floor(Math.random() * 15) + 2;
        downtimeReason = downtimeReasons[Math.floor(Math.random() * downtimeReasons.length)];
      }
      
      const recordId = randomUUID();
      
      insertRecord.run(
        recordId,
        station.id,
        operator.id,
        date.toISOString(),
        Math.round(cycleTime * 10) / 10,
        1,
        defects,
        shift,
        downtimeMinutes,
        downtimeReason
      );
      
      recordCount++;
    }
  }
});

transaction();
console.log(`Inserted ${recordCount} production records`);

// Generate alerts
const insertAlert = db.prepare(`
  INSERT INTO alerts (id, type, severity, station_id, message, details, timestamp, acknowledged)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const alerts = [
  {
    id: randomUUID(),
    type: 'bottleneck',
    severity: 'critical',
    stationId: 'ST003',
    message: 'Welding Cell consistently exceeding target cycle time',
    details: 'Average cycle time 23% above target over the last 24 hours. This is causing downstream delays.',
    timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: 0,
  },
  {
    id: randomUUID(),
    type: 'bottleneck',
    severity: 'warning',
    stationId: 'ST007',
    message: 'Final Assembly showing increased variability',
    details: 'Cycle time variance has increased 40% compared to last week. Pattern suggests operator-related issues.',
    timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    acknowledged: 0,
  },
  {
    id: randomUUID(),
    type: 'pattern_change',
    severity: 'warning',
    stationId: 'ST003',
    message: 'Night shift performance degradation detected',
    details: 'Night shift cycle times are 18% higher than day shift average. Recommend investigation.',
    timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    acknowledged: 0,
  },
  {
    id: randomUUID(),
    type: 'quality',
    severity: 'warning',
    stationId: 'ST002',
    message: 'Defect rate spike at CNC Machining',
    details: 'Defect rate increased from 2.1% to 4.8% in the last 6 hours.',
    timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    acknowledged: 0,
  },
  {
    id: randomUUID(),
    type: 'maintenance',
    severity: 'info',
    stationId: 'ST004',
    message: 'Scheduled maintenance reminder',
    details: 'Surface Treatment equipment due for preventive maintenance in 48 hours.',
    timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    acknowledged: 1,
  },
  {
    id: randomUUID(),
    type: 'delay',
    severity: 'critical',
    stationId: null,
    message: 'Line efficiency dropped below 75%',
    details: 'Overall line efficiency at 72.3%. Multiple bottlenecks detected affecting throughput.',
    timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    acknowledged: 0,
  },
];

for (const alert of alerts) {
  insertAlert.run(
    alert.id,
    alert.type,
    alert.severity,
    alert.stationId,
    alert.message,
    alert.details,
    alert.timestamp,
    alert.acknowledged
  );
}

console.log(`Inserted ${alerts.length} alerts`);

// Insert sample simulation
const insertSimulation = db.prepare(`
  INSERT INTO simulations (id, name, description, changes, baseline, projected, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const simulation = {
  id: randomUUID(),
  name: 'Add Operator to Welding Cell',
  description: 'Simulate impact of adding one operator to Station ST003 (Welding Cell)',
  changes: JSON.stringify([
    { type: 'add_operator', stationId: 'ST003', value: 1, description: 'Add 1 operator to Welding Cell' }
  ]),
  baseline: JSON.stringify({
    throughputPerHour: 42,
    avgCycleTime: 85.7,
    lineEfficiency: 72.3,
    bottleneckStation: 'ST003',
    waitTimeTotal: 234,
    utilizationByStation: {
      ST001: 0.89, ST002: 0.92, ST003: 0.98, ST004: 0.85,
      ST005: 0.78, ST006: 0.76, ST007: 0.95, ST008: 0.82,
      ST009: 0.75, ST010: 0.71
    }
  }),
  projected: JSON.stringify({
    throughputPerHour: 51,
    avgCycleTime: 71.2,
    lineEfficiency: 84.6,
    bottleneckStation: 'ST007',
    waitTimeTotal: 156,
    utilizationByStation: {
      ST001: 0.89, ST002: 0.92, ST003: 0.82, ST004: 0.85,
      ST005: 0.78, ST006: 0.76, ST007: 0.96, ST008: 0.82,
      ST009: 0.75, ST010: 0.71
    }
  }),
  createdAt: new Date().toISOString(),
};

insertSimulation.run(
  simulation.id,
  simulation.name,
  simulation.description,
  simulation.changes,
  simulation.baseline,
  simulation.projected,
  simulation.createdAt
);

console.log('Inserted sample simulation');

db.close();
console.log('\n✅ Database seeding complete!');
