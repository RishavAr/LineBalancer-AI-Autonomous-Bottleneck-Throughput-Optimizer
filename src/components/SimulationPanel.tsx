'use client';

import { useState } from 'react';
import { 
  FlaskConical, Play, Plus, Minus, RotateCcw, 
  TrendingUp, TrendingDown, ArrowRight, Clock,
  Users, Gauge, Target 
} from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';
import type { StationMetrics, SimulationResult, SimulationChange } from '@/types';

interface SimulationPanelProps {
  stations: StationMetrics[];
}

export function SimulationPanel({ stations }: SimulationPanelProps) {
  const [changes, setChanges] = useState<SimulationChange[]>([]);
  const [results, setResults] = useState<{
    baseline: SimulationResult;
    projected: SimulationResult;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const addChange = (stationId: string, type: SimulationChange['type'], value: number) => {
    const existingIndex = changes.findIndex(
      c => c.stationId === stationId && c.type === type
    );
    
    if (existingIndex >= 0) {
      const updated = [...changes];
      updated[existingIndex].value += value;
      if (updated[existingIndex].value === 0) {
        updated.splice(existingIndex, 1);
      }
      setChanges(updated);
    } else {
      const station = stations.find(s => s.stationId === stationId);
      setChanges([...changes, {
        type,
        stationId,
        value,
        description: `${value > 0 ? 'Add' : 'Remove'} ${Math.abs(value)} operator${Math.abs(value) !== 1 ? 's' : ''} ${value > 0 ? 'to' : 'from'} ${station?.stationName}`,
      }]);
    }
    setResults(null);
  };

  const resetChanges = () => {
    setChanges([]);
    setResults(null);
  };

  const runSimulation = async () => {
    if (changes.length === 0) return;
    
    setIsRunning(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getOperatorChange = (stationId: string): number => {
    return changes
      .filter(c => c.stationId === stationId && c.type === 'add_operator')
      .reduce((sum, c) => sum + c.value, 0);
  };

  const getImprovementColor = (baseline: number, projected: number, lowerIsBetter: boolean = false) => {
    const improvement = lowerIsBetter ? baseline - projected : projected - baseline;
    if (improvement > 0) return 'text-success-400';
    if (improvement < 0) return 'text-danger-400';
    return 'text-steel-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">What-If Simulation</h2>
              <p className="text-sm text-steel-400">
                Simulate changes and see projected impact on throughput
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={resetChanges}
              disabled={changes.length === 0}
              className="btn-ghost gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={runSimulation}
              disabled={changes.length === 0 || isRunning}
              className="btn-primary gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Active Changes */}
        {changes.length > 0 && (
          <div className="px-6 py-3 bg-steel-800/50 border-t border-steel-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-steel-400">Changes:</span>
              {changes.map((change, i) => (
                <span
                  key={i}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    change.value > 0 
                      ? 'bg-success-500/20 text-success-400'
                      : 'bg-danger-500/20 text-danger-400'
                  )}
                >
                  {change.description}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Station Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stations.map(station => {
          const operatorChange = getOperatorChange(station.stationId);
          const hasChange = operatorChange !== 0;
          
          return (
            <div
              key={station.stationId}
              className={cn(
                'card p-4 transition-all',
                hasChange && 'ring-2 ring-accent-500/50 bg-accent-500/5'
              )}
            >
              <div className="text-xs text-steel-500 mb-1">{station.stationId}</div>
              <div className="font-semibold text-white mb-3 truncate" title={station.stationName}>
                {station.stationName}
              </div>
              
              {/* Current Stats */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-steel-400">Utilization</span>
                  <span className="text-white">{formatPercent(station.utilization, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-400">Cycle Time</span>
                  <span className="text-white">{station.currentCycleTime.toFixed(0)}s</span>
                </div>
              </div>

              {/* Operator Controls */}
              <div className="flex items-center justify-between p-2 bg-steel-800/50 rounded-lg">
                <button
                  onClick={() => addChange(station.stationId, 'add_operator', -1)}
                  className="w-8 h-8 rounded-lg bg-steel-700 hover:bg-steel-600 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="text-center">
                  <div className={cn(
                    'text-lg font-bold',
                    operatorChange > 0 ? 'text-success-400' :
                    operatorChange < 0 ? 'text-danger-400' : 'text-white'
                  )}>
                    {operatorChange > 0 && '+'}
                    {operatorChange || '0'}
                  </div>
                  <div className="text-xs text-steel-500">
                    <Users className="w-3 h-3 inline mr-1" />
                    operators
                  </div>
                </div>
                
                <button
                  onClick={() => addChange(station.stationId, 'add_operator', 1)}
                  className="w-8 h-8 rounded-lg bg-steel-700 hover:bg-steel-600 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results */}
      {results && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Simulation Results</h3>
          </div>
          
          <div className="card-body">
            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Throughput */}
              <div className="p-4 bg-steel-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-steel-400 mb-3">
                  <Gauge className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wider">Throughput</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-steel-400">
                    {results.baseline.throughputPerHour}
                  </div>
                  <ArrowRight className="w-5 h-5 text-steel-600" />
                  <div className={cn(
                    'text-2xl font-bold',
                    getImprovementColor(results.baseline.throughputPerHour, results.projected.throughputPerHour)
                  )}>
                    {results.projected.throughputPerHour}
                  </div>
                  <span className="text-sm text-steel-500">/hr</span>
                </div>
                <div className={cn(
                  'text-sm mt-2 flex items-center gap-1',
                  getImprovementColor(results.baseline.throughputPerHour, results.projected.throughputPerHour)
                )}>
                  {results.projected.throughputPerHour > results.baseline.throughputPerHour ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(((results.projected.throughputPerHour - results.baseline.throughputPerHour) / results.baseline.throughputPerHour) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Line Efficiency */}
              <div className="p-4 bg-steel-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-steel-400 mb-3">
                  <Target className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wider">Line Efficiency</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-steel-400">
                    {results.baseline.lineEfficiency.toFixed(1)}%
                  </div>
                  <ArrowRight className="w-5 h-5 text-steel-600" />
                  <div className={cn(
                    'text-2xl font-bold',
                    getImprovementColor(results.baseline.lineEfficiency, results.projected.lineEfficiency)
                  )}>
                    {results.projected.lineEfficiency.toFixed(1)}%
                  </div>
                </div>
                <div className={cn(
                  'text-sm mt-2 flex items-center gap-1',
                  getImprovementColor(results.baseline.lineEfficiency, results.projected.lineEfficiency)
                )}>
                  {results.projected.lineEfficiency > results.baseline.lineEfficiency ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(results.projected.lineEfficiency - results.baseline.lineEfficiency).toFixed(1)} pts
                </div>
              </div>

              {/* Avg Cycle Time */}
              <div className="p-4 bg-steel-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-steel-400 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wider">Avg Cycle Time</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-steel-400">
                    {results.baseline.avgCycleTime.toFixed(1)}s
                  </div>
                  <ArrowRight className="w-5 h-5 text-steel-600" />
                  <div className={cn(
                    'text-2xl font-bold',
                    getImprovementColor(results.baseline.avgCycleTime, results.projected.avgCycleTime, true)
                  )}>
                    {results.projected.avgCycleTime.toFixed(1)}s
                  </div>
                </div>
                <div className={cn(
                  'text-sm mt-2 flex items-center gap-1',
                  getImprovementColor(results.baseline.avgCycleTime, results.projected.avgCycleTime, true)
                )}>
                  {results.projected.avgCycleTime < results.baseline.avgCycleTime ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {Math.abs(((results.projected.avgCycleTime - results.baseline.avgCycleTime) / results.baseline.avgCycleTime) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Bottleneck Change */}
            <div className="p-4 bg-steel-800/30 rounded-xl">
              <h4 className="text-sm font-semibold text-steel-300 mb-3">Bottleneck Analysis</h4>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-steel-500 mb-1">Current Bottleneck</div>
                  <span className="badge badge-critical">
                    {results.baseline.bottleneckStation || 'None'}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-steel-600" />
                <div>
                  <div className="text-xs text-steel-500 mb-1">Projected Bottleneck</div>
                  <span className={cn(
                    'badge',
                    results.projected.bottleneckStation === results.baseline.bottleneckStation
                      ? 'badge-warning'
                      : 'badge-info'
                  )}>
                    {results.projected.bottleneckStation || 'None'}
                  </span>
                </div>
                {results.projected.bottleneckStation !== results.baseline.bottleneckStation && (
                  <div className="text-sm text-steel-400 ml-4">
                    ✓ Bottleneck will shift - consider addressing new constraint
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
