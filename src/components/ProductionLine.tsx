'use client';

import { useState } from 'react';
import { cn, formatDuration, formatPercent, getStatusColor } from '@/lib/utils';
import { ChevronRight, Users, Clock, AlertTriangle } from 'lucide-react';
import type { StationMetrics, BottleneckAnalysis } from '@/types';

interface ProductionLineProps {
  stations: StationMetrics[];
  bottlenecks: BottleneckAnalysis[];
}

export function ProductionLine({ stations, bottlenecks }: ProductionLineProps) {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const getBottleneckInfo = (stationId: string) => {
    return bottlenecks.find(b => b.stationId === stationId);
  };

  const getStationColor = (station: StationMetrics) => {
    const bottleneck = getBottleneckInfo(station.stationId);
    if (!bottleneck) return 'border-steel-700 bg-steel-800/50';
    
    switch (bottleneck.severity) {
      case 'critical': return 'border-danger-500 bg-danger-500/10 glow-danger';
      case 'high': return 'border-warning-500 bg-warning-500/10';
      case 'medium': return 'border-accent-500 bg-accent-500/10';
      default: return 'border-success-500 bg-success-500/10';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 95) return 'bg-danger-500';
    if (utilization > 85) return 'bg-warning-500';
    if (utilization > 70) return 'bg-success-500';
    return 'bg-steel-600';
  };

  return (
    <div className="space-y-6">
      {/* Production Line Flow */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {stations.map((station, index) => {
          const bottleneck = getBottleneckInfo(station.stationId);
          const isSelected = selectedStation === station.stationId;
          
          return (
            <div key={station.stationId} className="flex items-center">
              {/* Station Card */}
              <button
                onClick={() => setSelectedStation(isSelected ? null : station.stationId)}
                className={cn(
                  'relative min-w-[140px] p-4 rounded-xl border-2 transition-all duration-300',
                  'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-500',
                  getStationColor(station),
                  isSelected && 'ring-2 ring-accent-500'
                )}
              >
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1">
                  <span className={cn('status-dot', station.status)} />
                </div>
                
                {/* Bottleneck badge */}
                {bottleneck && bottleneck.severity !== 'low' && (
                  <div className="absolute -top-2 -left-2">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      bottleneck.severity === 'critical' ? 'bg-danger-500' :
                      bottleneck.severity === 'high' ? 'bg-warning-500' : 'bg-accent-500'
                    )}>
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-xs text-steel-400 mb-1">{station.stationId}</div>
                  <div className="text-sm font-semibold text-white truncate mb-2">
                    {station.stationName}
                  </div>
                  
                  {/* Utilization bar */}
                  <div className="h-1.5 bg-steel-700 rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn('h-full rounded-full transition-all duration-500', getUtilizationColor(station.utilization))}
                      style={{ width: `${Math.min(100, station.utilization)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-steel-400">{formatPercent(station.utilization, 0)}</span>
                    <span className={cn(
                      station.currentCycleTime > station.targetCycleTime * 1.1 
                        ? 'text-danger-400' 
                        : 'text-steel-300'
                    )}>
                      {formatDuration(station.currentCycleTime)}
                    </span>
                  </div>
                </div>
              </button>
              
              {/* Connector */}
              {index < stations.length - 1 && (
                <div className="flex items-center mx-1">
                  <div className="w-4 h-0.5 bg-steel-700" />
                  <ChevronRight className="w-4 h-4 text-steel-600" />
                  <div className="w-4 h-0.5 bg-steel-700" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Station Details */}
      {selectedStation && (
        <StationDetails 
          station={stations.find(s => s.stationId === selectedStation)!}
          bottleneck={getBottleneckInfo(selectedStation)}
        />
      )}
    </div>
  );
}

function StationDetails({ 
  station, 
  bottleneck 
}: { 
  station: StationMetrics; 
  bottleneck?: BottleneckAnalysis;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-steel-800/50 rounded-xl border border-steel-700 animate-slide-up">
      {/* Station Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-steel-300">{station.stationName}</h3>
        <div className="flex items-center gap-2">
          <span className={cn('status-dot', station.status)} />
          <span className={cn('text-sm capitalize', getStatusColor(station.status))}>
            {station.status}
          </span>
        </div>
      </div>

      {/* Cycle Time */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-steel-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Cycle Time</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-2xl font-bold',
            station.currentCycleTime > station.targetCycleTime * 1.1 
              ? 'text-danger-400' 
              : 'text-white'
          )}>
            {formatDuration(station.currentCycleTime)}
          </span>
          <span className="text-sm text-steel-500">
            / {formatDuration(station.targetCycleTime)} target
          </span>
        </div>
      </div>

      {/* Utilization */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-steel-400">
          <Users className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Utilization</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {formatPercent(station.utilization, 0)}
          </span>
        </div>
        <div className="h-2 bg-steel-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, station.utilization)}%` }}
          />
        </div>
      </div>

      {/* Bottleneck Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-steel-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Bottleneck Status</span>
        </div>
        {bottleneck ? (
          <div>
            <span className={cn(
              'badge',
              bottleneck.severity === 'critical' ? 'badge-critical' :
              bottleneck.severity === 'high' ? 'badge-warning' :
              bottleneck.severity === 'medium' ? 'badge-info' : 'badge-success'
            )}>
              {bottleneck.severity.toUpperCase()}
            </span>
            <p className="text-sm text-steel-400 mt-2">
              Impact Score: {bottleneck.impactScore}/100
            </p>
          </div>
        ) : (
          <span className="badge badge-success">Normal</span>
        )}
      </div>
    </div>
  );
}
