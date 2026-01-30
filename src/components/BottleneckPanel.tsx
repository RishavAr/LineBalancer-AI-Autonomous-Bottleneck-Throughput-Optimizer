'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { cn, formatPercent, formatDuration } from '@/lib/utils';
import type { BottleneckAnalysis, Recommendation } from '@/types';

interface BottleneckPanelProps {
  bottlenecks: BottleneckAnalysis[];
  compact?: boolean;
}

export function BottleneckPanel({ bottlenecks, compact = false }: BottleneckPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSeverityBadge = (severity: BottleneckAnalysis['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-critical">CRITICAL</span>;
      case 'high':
        return <span className="badge badge-warning">HIGH</span>;
      case 'medium':
        return <span className="badge badge-info">MEDIUM</span>;
      default:
        return <span className="badge badge-success">LOW</span>;
    }
  };

  const getCostBadge = (cost: Recommendation['implementationCost']) => {
    switch (cost) {
      case 'low':
        return <span className="text-success-400">Low Cost</span>;
      case 'medium':
        return <span className="text-warning-400">Medium Cost</span>;
      case 'high':
        return <span className="text-danger-400">High Cost</span>;
    }
  };

  if (bottlenecks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500/20 flex items-center justify-center">
          <Target className="w-8 h-8 text-success-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Bottlenecks Detected</h3>
        <p className="text-steel-400">All stations are operating within target parameters.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Bottleneck Analysis</h2>
            <p className="text-sm text-steel-400">
              {bottlenecks.length} station{bottlenecks.length !== 1 ? 's' : ''} identified
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-steel-800">
        {bottlenecks.map((bottleneck, index) => {
          const isExpanded = expandedId === bottleneck.stationId;
          
          return (
            <div 
              key={bottleneck.stationId}
              className={cn(
                'transition-all duration-300',
                index === 0 && 'bg-danger-500/5'
              )}
            >
              {/* Main Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : bottleneck.stationId)}
                className="w-full p-4 flex items-center gap-4 hover:bg-steel-800/30 transition-colors text-left"
              >
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-danger-500 text-white' :
                  index === 1 ? 'bg-warning-500 text-white' :
                  'bg-steel-700 text-steel-300'
                )}>
                  {index + 1}
                </div>

                {/* Station Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{bottleneck.stationName}</span>
                    {getSeverityBadge(bottleneck.severity)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-steel-400">
                    <span>
                      Cycle: {formatDuration(bottleneck.avgCycleTime)} 
                      <span className="text-steel-500"> / {formatDuration(bottleneck.targetCycleTime)}</span>
                    </span>
                    <span className={cn(
                      bottleneck.variancePercent > 15 ? 'text-danger-400' :
                      bottleneck.variancePercent > 5 ? 'text-warning-400' : 'text-steel-400'
                    )}>
                      +{formatPercent(bottleneck.variancePercent)} over target
                    </span>
                  </div>
                </div>

                {/* Impact Score */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-white">{bottleneck.impactScore}</div>
                  <div className="text-xs text-steel-500 uppercase tracking-wider">Impact</div>
                </div>

                {/* Expand Icon */}
                {isExpanded 
                  ? <ChevronDown className="w-5 h-5 text-steel-400" />
                  : <ChevronRight className="w-5 h-5 text-steel-400" />
                }
              </button>

              {/* Expanded Content */}
              {isExpanded && !compact && (
                <div className="px-4 pb-4 space-y-4 animate-slide-down">
                  {/* Root Causes */}
                  {bottleneck.rootCauses.length > 0 && (
                    <div className="p-4 bg-steel-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-steel-300 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Root Causes
                      </h4>
                      <div className="space-y-3">
                        {bottleneck.rootCauses.map((cause, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={cn(
                              'px-2 py-1 rounded text-xs uppercase font-medium',
                              cause.type === 'shift' ? 'bg-accent-500/20 text-accent-400' :
                              cause.type === 'operator' ? 'bg-warning-500/20 text-warning-400' :
                              cause.type === 'equipment' ? 'bg-danger-500/20 text-danger-400' :
                              'bg-steel-700 text-steel-300'
                            )}>
                              {cause.type}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white">{cause.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 flex-1 bg-steel-700 rounded-full max-w-[100px]">
                                  <div 
                                    className="h-full bg-accent-500 rounded-full"
                                    style={{ width: `${cause.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-steel-500">
                                  {formatPercent(cause.confidence * 100, 0)} confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {bottleneck.recommendations.length > 0 && (
                    <div className="p-4 bg-steel-800/50 rounded-lg">
                      <h4 className="text-sm font-semibold text-steel-300 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-warning-400" />
                        Recommendations
                      </h4>
                      <div className="space-y-3">
                        {bottleneck.recommendations.slice(0, 3).map((rec, i) => (
                          <div key={rec.id} className="flex items-start gap-3 p-3 bg-steel-900/50 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center text-xs font-bold text-accent-400">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white mb-2">{rec.description}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-success-400">
                                  <TrendingUp className="w-3 h-3" />
                                  +{rec.expectedImprovement}% improvement
                                </span>
                                {getCostBadge(rec.implementationCost)}
                                <span className="text-steel-500">{rec.timeToImplement}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
