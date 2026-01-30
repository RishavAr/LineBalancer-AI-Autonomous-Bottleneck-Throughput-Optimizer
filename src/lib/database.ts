// ============================================
// LineBalancer AI - Database Layer
// SQLite with better-sqlite3 for server-side
// ============================================

import Database from 'better-sqlite3';
import path from 'path';

// Database singleton
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'linebalancer.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  // Stations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      target_cycle_time REAL NOT NULL,
      position INTEGER NOT NULL,
      operator_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'running',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Operators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      shift TEXT NOT NULL,
      skill_level INTEGER DEFAULT 3,
      station_id TEXT,
      efficiency REAL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    )
  `);

  // Production records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_records (
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
    )
  `);

  // Alerts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
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
    )
  `);

  // Simulations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      changes TEXT NOT NULL,
      baseline TEXT NOT NULL,
      projected TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // NLP queries history
  db.exec(`
    CREATE TABLE IF NOT EXISTS nlp_queries (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      parsed_intent TEXT,
      generated_sql TEXT,
      result TEXT,
      explanation TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_production_station ON production_records(station_id);
    CREATE INDEX IF NOT EXISTS idx_production_timestamp ON production_records(timestamp);
    CREATE INDEX IF NOT EXISTS idx_production_shift ON production_records(shift);
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
  `);
}

// ============================================
// Query Helpers
// ============================================

export function getAllStations() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM stations ORDER BY position').all();
}

export function getStationById(id: string) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
}

export function getProductionRecords(options: {
  stationId?: string;
  startDate?: string;
  endDate?: string;
  shift?: string;
  limit?: number;
}) {
  const db = getDatabase();
  let query = 'SELECT * FROM production_records WHERE 1=1';
  const params: (string | number)[] = [];

  if (options.stationId) {
    query += ' AND station_id = ?';
    params.push(options.stationId);
  }
  if (options.startDate) {
    query += ' AND timestamp >= ?';
    params.push(options.startDate);
  }
  if (options.endDate) {
    query += ' AND timestamp <= ?';
    params.push(options.endDate);
  }
  if (options.shift) {
    query += ' AND shift = ?';
    params.push(options.shift);
  }

  query += ' ORDER BY timestamp DESC';

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return db.prepare(query).all(...params);
}

export function getStationMetrics(stationId: string, hours = 24) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const metrics = db.prepare(`
    SELECT 
      station_id,
      AVG(cycle_time) as avg_cycle_time,
      MIN(cycle_time) as min_cycle_time,
      MAX(cycle_time) as max_cycle_time,
      SUM(quantity) as total_quantity,
      SUM(defects) as total_defects,
      SUM(downtime_minutes) as total_downtime,
      COUNT(*) as record_count
    FROM production_records
    WHERE station_id = ? AND timestamp >= ?
    GROUP BY station_id
  `).get(stationId, cutoff);

  return metrics;
}

export function getBottleneckAnalysis(hours = 24) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const analysis = db.prepare(`
    SELECT 
      s.id as station_id,
      s.name as station_name,
      s.target_cycle_time,
      AVG(pr.cycle_time) as avg_cycle_time,
      STDDEV(pr.cycle_time) as stddev_cycle_time,
      COUNT(*) as sample_count,
      SUM(pr.downtime_minutes) as total_downtime,
      ((AVG(pr.cycle_time) - s.target_cycle_time) / s.target_cycle_time * 100) as variance_percent
    FROM stations s
    LEFT JOIN production_records pr ON s.id = pr.station_id AND pr.timestamp >= ?
    GROUP BY s.id
    ORDER BY variance_percent DESC
  `).all(cutoff);

  return analysis;
}

export function getActiveAlerts() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM alerts 
    WHERE acknowledged = 0 
    ORDER BY 
      CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        ELSE 3 
      END,
      timestamp DESC
  `).all();
}

export function getShiftComparison(days = 7) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return db.prepare(`
    SELECT 
      shift,
      AVG(cycle_time) as avg_cycle_time,
      SUM(quantity) as total_quantity,
      AVG(defects * 1.0 / NULLIF(quantity, 0) * 100) as avg_defect_rate,
      SUM(downtime_minutes) as total_downtime
    FROM production_records
    WHERE timestamp >= ?
    GROUP BY shift
  `).all(cutoff);
}

export function getTrendData(metric: string, stationId: string | null, hours = 168) {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let query = `
    SELECT 
      strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
      station_id,
  `;

  switch (metric) {
    case 'cycle_time':
      query += 'AVG(cycle_time) as value';
      break;
    case 'throughput':
      query += 'SUM(quantity) as value';
      break;
    case 'defect_rate':
      query += 'AVG(defects * 1.0 / NULLIF(quantity, 0) * 100) as value';
      break;
    case 'downtime':
      query += 'SUM(downtime_minutes) as value';
      break;
    default:
      query += 'AVG(cycle_time) as value';
  }

  query += ' FROM production_records WHERE timestamp >= ?';

  const params: string[] = [cutoff];

  if (stationId) {
    query += ' AND station_id = ?';
    params.push(stationId);
  }

  query += ' GROUP BY hour, station_id ORDER BY hour';

  return db.prepare(query).all(...params);
}

// ============================================
// Insert/Update Helpers
// ============================================

export function insertStation(station: {
  id: string;
  name: string;
  description?: string;
  targetCycleTime: number;
  position: number;
  operatorCount?: number;
}) {
  const db = getDatabase();
  return db.prepare(`
    INSERT INTO stations (id, name, description, target_cycle_time, position, operator_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    station.id,
    station.name,
    station.description || '',
    station.targetCycleTime,
    station.position,
    station.operatorCount || 1
  );
}

export function insertOperator(operator: {
  id: string;
  name: string;
  shift: string;
  skillLevel?: number;
  stationId: string;
  efficiency?: number;
}) {
  const db = getDatabase();
  return db.prepare(`
    INSERT INTO operators (id, name, shift, skill_level, station_id, efficiency)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    operator.id,
    operator.name,
    operator.shift,
    operator.skillLevel || 3,
    operator.stationId,
    operator.efficiency || 100
  );
}

export function insertProductionRecord(record: {
  id: string;
  stationId: string;
  operatorId: string;
  timestamp: string;
  cycleTime: number;
  quantity?: number;
  defects?: number;
  shift: string;
  downtimeMinutes?: number;
  downtimeReason?: string;
}) {
  const db = getDatabase();
  return db.prepare(`
    INSERT INTO production_records 
    (id, station_id, operator_id, timestamp, cycle_time, quantity, defects, shift, downtime_minutes, downtime_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.stationId,
    record.operatorId,
    record.timestamp,
    record.cycleTime,
    record.quantity || 1,
    record.defects || 0,
    record.shift,
    record.downtimeMinutes || 0,
    record.downtimeReason || null
  );
}

export function insertAlert(alert: {
  id: string;
  type: string;
  severity: string;
  stationId?: string;
  message: string;
  details?: string;
}) {
  const db = getDatabase();
  return db.prepare(`
    INSERT INTO alerts (id, type, severity, station_id, message, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    alert.id,
    alert.type,
    alert.severity,
    alert.stationId || null,
    alert.message,
    alert.details || ''
  );
}

export function acknowledgeAlert(alertId: string) {
  const db = getDatabase();
  return db.prepare(`
    UPDATE alerts SET acknowledged = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(alertId);
}

// Execute arbitrary SQL (for NLP agent)
export function executeSQL(sql: string, params: unknown[] = []) {
  const db = getDatabase();
  // Only allow SELECT statements for safety
  if (!sql.trim().toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed');
  }
  return db.prepare(sql).all(...params);
}

export default getDatabase;
