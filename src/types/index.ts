// ============================================
// LineBalancer AI - Core Type Definitions
// ============================================

// Production Line Types
export interface Station {
  id: string;
  name: string;
  description: string;
  targetCycleTime: number; // seconds
  position: number; // order in line
  operatorCount: number;
  status: 'running' | 'idle' | 'maintenance' | 'blocked';
}

export interface Operator {
  id: string;
  name: string;
  shift: 'day' | 'night' | 'swing';
  skillLevel: number; // 1-5
  stationId: string;
  efficiency: number; // percentage
}

export interface ProductionRecord {
  id: string;
  stationId: string;
  operatorId: string;
  timestamp: Date;
  cycleTime: number; // actual seconds
  quantity: number;
  defects: number;
  shift: 'day' | 'night' | 'swing';
  downtimeMinutes: number;
  downtimeReason?: string;
}

// Analytics Types
export interface BottleneckAnalysis {
  stationId: string;
  stationName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  avgCycleTime: number;
  targetCycleTime: number;
  variancePercent: number;
  frequency: number; // times identified as bottleneck
  impactScore: number; // 0-100
  rootCauses: RootCause[];
  recommendations: Recommendation[];
}

export interface RootCause {
  type: 'operator' | 'equipment' | 'material' | 'process' | 'shift';
  description: string;
  confidence: number; // 0-1
  evidence: string[];
}

export interface Recommendation {
  id: string;
  type: 'add_operator' | 'training' | 'equipment' | 'rebalance' | 'maintenance';
  description: string;
  expectedImprovement: number; // percentage
  implementationCost: 'low' | 'medium' | 'high';
  timeToImplement: string;
  priority: number; // 1-5
}

// Simulation Types
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  changes: SimulationChange[];
  baseline: SimulationResult;
  projected: SimulationResult;
  createdAt: Date;
}

export interface SimulationChange {
  type: 'add_operator' | 'remove_operator' | 'change_cycle_time' | 'add_station' | 'remove_station';
  stationId: string;
  value: number;
  description: string;
}

export interface SimulationResult {
  throughputPerHour: number;
  avgCycleTime: number;
  lineEfficiency: number;
  bottleneckStation: string | null;
  waitTimeTotal: number;
  utilizationByStation: Record<string, number>;
}

// Alert & Warning Types
export interface Alert {
  id: string;
  type: 'bottleneck' | 'delay' | 'quality' | 'maintenance' | 'pattern_change';
  severity: 'critical' | 'warning' | 'info';
  stationId?: string;
  message: string;
  details: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface Prediction {
  id: string;
  type: 'delay' | 'bottleneck' | 'quality_drop' | 'maintenance_needed';
  stationId: string;
  predictedTime: Date;
  confidence: number;
  description: string;
  preventiveActions: string[];
}

// NLP Query Types
export interface NLPQuery {
  id: string;
  query: string;
  timestamp: Date;
  parsedIntent: QueryIntent;
  generatedSQL?: string;
  result?: QueryResult;
  explanation: string;
}

export interface QueryIntent {
  action: 'find' | 'compare' | 'trend' | 'predict' | 'explain';
  entities: {
    stations?: string[];
    operators?: string[];
    timeRange?: { start: Date; end: Date };
    metrics?: string[];
  };
  filters: Record<string, unknown>;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  summary: string;
  visualizationType?: 'table' | 'bar' | 'line' | 'pie';
  insights: string[];
}

// Dashboard Types
export interface DashboardMetrics {
  currentThroughput: number;
  targetThroughput: number;
  lineEfficiency: number;
  activeAlerts: number;
  bottleneckCount: number;
  oee: number; // Overall Equipment Effectiveness
  qualityRate: number;
  availabilityRate: number;
  performanceRate: number;
}

export interface StationMetrics {
  stationId: string;
  stationName: string;
  currentCycleTime: number;
  targetCycleTime: number;
  utilization: number;
  throughput: number;
  defectRate: number;
  status: Station['status'];
  trend: 'improving' | 'stable' | 'declining';
}

// Historical Data Types
export interface TrendData {
  timestamp: Date;
  value: number;
  stationId?: string;
  metric: string;
}

export interface ShiftComparison {
  shift: 'day' | 'night' | 'swing';
  avgThroughput: number;
  avgCycleTime: number;
  avgDefectRate: number;
  topBottleneck: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Agent Reasoning Types
export interface AgentReasoning {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
}

export interface AgentResponse {
  answer: string;
  reasoning: AgentReasoning[];
  confidence: number;
  sources: string[];
  suggestions?: string[];
}
