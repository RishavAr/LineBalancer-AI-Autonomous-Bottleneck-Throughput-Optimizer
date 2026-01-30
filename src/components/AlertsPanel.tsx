'use client';

import { Bell, AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import type { Alert } from '@/types';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}

export function AlertsPanel({ alerts, onAcknowledge }: AlertsPanelProps) {
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-danger-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning-400" />;
      default:
        return <Info className="w-5 h-5 text-accent-400" />;
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-danger-500 bg-danger-500/5';
      case 'warning':
        return 'border-l-warning-500 bg-warning-500/5';
      default:
        return 'border-l-accent-500 bg-accent-500/5';
    }
  };

  const getTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'bottleneck': return 'Bottleneck';
      case 'delay': return 'Delay';
      case 'quality': return 'Quality';
      case 'maintenance': return 'Maintenance';
      case 'pattern_change': return 'Pattern Change';
      default: return type;
    }
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-500/20 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-danger-400" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Active Alerts</h2>
            <p className="text-sm text-steel-400">
              {activeAlerts.length} requiring attention
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-success-400" />
            </div>
            <p className="text-steel-400">All clear! No active alerts.</p>
          </div>
        ) : (
          <div className="divide-y divide-steel-800">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  'p-4 border-l-4 transition-all hover:bg-steel-800/30',
                  getSeverityStyles(alert.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs uppercase font-medium px-2 py-0.5 rounded',
                        alert.severity === 'critical' ? 'bg-danger-500/20 text-danger-400' :
                        alert.severity === 'warning' ? 'bg-warning-500/20 text-warning-400' :
                        'bg-accent-500/20 text-accent-400'
                      )}>
                        {getTypeLabel(alert.type)}
                      </span>
                      <span className="text-xs text-steel-500">
                        {formatTimeAgo(new Date(alert.timestamp))}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-white mb-1">{alert.message}</h4>
                    <p className="text-sm text-steel-400 line-clamp-2">{alert.details}</p>
                    
                    {alert.stationId && (
                      <span className="inline-block mt-2 text-xs text-steel-500 bg-steel-800 px-2 py-1 rounded">
                        {alert.stationId}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="p-2 hover:bg-steel-700 rounded-lg transition-colors group"
                    title="Acknowledge"
                  >
                    <X className="w-4 h-4 text-steel-500 group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
