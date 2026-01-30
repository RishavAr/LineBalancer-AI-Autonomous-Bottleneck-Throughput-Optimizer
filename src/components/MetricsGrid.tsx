'use client';

import { TrendingUp, TrendingDown, Minus, Gauge, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';
import type { DashboardMetrics } from '@/types';

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const cards = [
    {
      label: 'Line Efficiency',
      value: formatPercent(metrics.lineEfficiency),
      target: '85%',
      trend: metrics.lineEfficiency > 80 ? 'up' : metrics.lineEfficiency > 70 ? 'stable' : 'down',
      color: metrics.lineEfficiency > 80 ? 'success' : metrics.lineEfficiency > 70 ? 'warning' : 'danger',
      icon: Gauge,
    },
    {
      label: 'OEE',
      value: formatPercent(metrics.oee),
      target: '75%',
      trend: metrics.oee > 70 ? 'up' : metrics.oee > 60 ? 'stable' : 'down',
      color: metrics.oee > 70 ? 'success' : metrics.oee > 60 ? 'warning' : 'danger',
      icon: Target,
    },
    {
      label: 'Throughput',
      value: `${metrics.currentThroughput}/hr`,
      target: `${metrics.targetThroughput}/hr`,
      trend: metrics.currentThroughput >= metrics.targetThroughput * 0.9 ? 'up' : 'down',
      color: metrics.currentThroughput >= metrics.targetThroughput * 0.9 ? 'success' : 'warning',
      icon: TrendingUp,
    },
    {
      label: 'Active Alerts',
      value: metrics.activeAlerts.toString(),
      target: '0',
      trend: metrics.activeAlerts === 0 ? 'up' : 'down',
      color: metrics.activeAlerts === 0 ? 'success' : metrics.activeAlerts < 3 ? 'warning' : 'danger',
      icon: AlertCircle,
    },
    {
      label: 'Quality Rate',
      value: formatPercent(metrics.qualityRate),
      target: '99%',
      trend: metrics.qualityRate > 98 ? 'up' : metrics.qualityRate > 95 ? 'stable' : 'down',
      color: metrics.qualityRate > 98 ? 'success' : metrics.qualityRate > 95 ? 'warning' : 'danger',
      icon: CheckCircle,
    },
    {
      label: 'Bottlenecks',
      value: metrics.bottleneckCount.toString(),
      target: '0',
      trend: metrics.bottleneckCount === 0 ? 'up' : 'down',
      color: metrics.bottleneckCount === 0 ? 'success' : metrics.bottleneckCount < 2 ? 'warning' : 'danger',
      icon: AlertCircle,
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success': return 'text-success-400 bg-success-500/10 border-success-500/20';
      case 'warning': return 'text-warning-400 bg-warning-500/10 border-warning-500/20';
      case 'danger': return 'text-danger-400 bg-danger-500/10 border-danger-500/20';
      default: return 'text-steel-400 bg-steel-500/10 border-steel-500/20';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const TrendIcon = getTrendIcon(card.trend);
        const Icon = card.icon;
        
        return (
          <div
            key={card.label}
            className={cn(
              'card p-4 border transition-all duration-300 hover:scale-[1.02]',
              getColorClasses(card.color)
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-5 h-5 opacity-70" />
              <TrendIcon className={cn(
                'w-4 h-4',
                card.trend === 'up' ? 'text-success-400' : 
                card.trend === 'down' ? 'text-danger-400' : 'text-steel-400'
              )} />
            </div>
            <div className="space-y-1">
              <div className="metric-value">{card.value}</div>
              <div className="metric-label">{card.label}</div>
              <div className="text-xs text-steel-500">Target: {card.target}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
