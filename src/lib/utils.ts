// ============================================
// LineBalancer AI - Utility Functions
// ============================================

import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number, decimals = 1): string {
  return num.toFixed(decimals);
}

export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function getSeverityColor(severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical':
      return 'text-danger-500 bg-danger-500/10 border-danger-500/30';
    case 'high':
    case 'warning':
      return 'text-warning-500 bg-warning-500/10 border-warning-500/30';
    case 'medium':
      return 'text-accent-500 bg-accent-500/10 border-accent-500/30';
    case 'low':
    case 'info':
      return 'text-success-500 bg-success-500/10 border-success-500/30';
    default:
      return 'text-steel-400 bg-steel-500/10 border-steel-500/30';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'text-success-400 bg-success-500/20';
    case 'idle':
      return 'text-warning-400 bg-warning-500/20';
    case 'maintenance':
      return 'text-accent-400 bg-accent-500/20';
    case 'blocked':
      return 'text-danger-400 bg-danger-500/20';
    default:
      return 'text-steel-400 bg-steel-500/20';
  }
}

export function getTrendIcon(trend: 'improving' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'improving':
      return '↗';
    case 'declining':
      return '↘';
    default:
      return '→';
  }
}

export function calculateOEE(availability: number, performance: number, quality: number): number {
  return (availability / 100) * (performance / 100) * (quality / 100) * 100;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    return {
      ...groups,
      [value]: [...(groups[value] || []), item],
    };
  }, {} as Record<string, T[]>);
}

// Color palette for charts
export const CHART_COLORS = [
  '#3b82f6', // accent-500
  '#10b981', // success-500
  '#f59e0b', // warning-500
  '#ef4444', // danger-500
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
