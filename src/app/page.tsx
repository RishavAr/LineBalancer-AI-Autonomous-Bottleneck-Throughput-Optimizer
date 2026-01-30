'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MetricsGrid } from '@/components/MetricsGrid';
import { ProductionLine } from '@/components/ProductionLine';
import { BottleneckPanel } from '@/components/BottleneckPanel';
import { AlertsPanel } from '@/components/AlertsPanel';
import { NLPQueryPanel } from '@/components/NLPQueryPanel';
import { SimulationPanel } from '@/components/SimulationPanel';
import { TrendChart } from '@/components/TrendChart';
import type { DashboardMetrics, StationMetrics, BottleneckAnalysis, Alert } from '@/types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bottlenecks' | 'simulation' | 'query'>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stations, setStations] = useState<StationMetrics[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [metricsRes, stationsRes, bottlenecksRes, alertsRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/stations'),
        fetch('/api/bottlenecks'),
        fetch('/api/alerts'),
      ]);

      const [metricsData, stationsData, bottlenecksData, alertsData] = await Promise.all([
        metricsRes.json(),
        stationsRes.json(),
        bottlenecksRes.json(),
        alertsRes.json(),
      ]);

      setMetrics(metricsData);
      setStations(stationsData);
      setBottlenecks(bottlenecksData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-steel-400">Initializing LineBalancer AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        alertCount={alerts.filter(a => !a.acknowledged).length}
      />
      
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Metrics Overview */}
            {metrics && <MetricsGrid metrics={metrics} />}
            
            {/* Production Line Visualization */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold">Production Line Status</h2>
                <span className="text-sm text-steel-400">Real-time station monitoring</span>
              </div>
              <div className="card-body">
                <ProductionLine stations={stations} bottlenecks={bottlenecks} />
              </div>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              <AlertsPanel 
                alerts={alerts} 
                onAcknowledge={handleAcknowledgeAlert}
              />
              
              {/* Top Bottlenecks */}
              <BottleneckPanel 
                bottlenecks={bottlenecks.slice(0, 5)} 
                compact
              />
            </div>

            {/* Trend Chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Performance Trends</h2>
              </div>
              <div className="card-body">
                <TrendChart />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bottlenecks' && (
          <div className="animate-fade-in">
            <BottleneckPanel bottlenecks={bottlenecks} />
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in">
            <SimulationPanel stations={stations} />
          </div>
        )}

        {activeTab === 'query' && (
          <div className="animate-fade-in">
            <NLPQueryPanel />
          </div>
        )}
      </main>
    </div>
  );
}
