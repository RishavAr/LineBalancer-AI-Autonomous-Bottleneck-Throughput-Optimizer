'use client';

import { Activity, AlertTriangle, Brain, FlaskConical, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeTab: 'overview' | 'bottlenecks' | 'simulation' | 'query';
  onTabChange: (tab: 'overview' | 'bottlenecks' | 'simulation' | 'query') => void;
  alertCount: number;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'bottlenecks', label: 'Bottlenecks', icon: AlertTriangle },
  { id: 'simulation', label: 'What-If Sim', icon: FlaskConical },
  { id: 'query', label: 'Ask AI', icon: MessageSquare },
] as const;

export function Header({ activeTab, onTabChange, alertCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-steel-950/95 backdrop-blur-md border-b border-steel-800">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">LineBalancer AI</h1>
              <p className="text-xs text-steel-400">Autonomous Optimizer</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/20'
                      : 'text-steel-400 hover:text-white hover:bg-steel-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'bottlenecks' && alertCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-danger-500 text-white rounded-full">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="status-dot running" />
              <span className="text-steel-300">System Online</span>
            </div>
            <button className="btn-ghost p-2">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
