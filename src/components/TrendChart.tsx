'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_COLORS } from '@/lib/utils';

type MetricType = 'cycle_time' | 'throughput' | 'defect_rate';

interface TrendData {
  hour: string;
  station_id: string;
  value: number;
}

export function TrendChart() {
  const [metric, setMetric] = useState<MetricType>('cycle_time');
  const [data, setData] = useState<Record<string, number | string>[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [metric]);

  async function fetchTrendData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/trends?metric=${metric}&hours=168`);
      const rawData: TrendData[] = await response.json();
      
      // Transform data for recharts (pivot by hour)
      const byHour: Record<string, Record<string, number | string>> = {};
      const stationSet = new Set<string>();
      
      for (const point of rawData) {
        if (!byHour[point.hour]) {
          byHour[point.hour] = { hour: formatHour(point.hour) };
        }
        byHour[point.hour][point.station_id] = Math.round(point.value * 10) / 10;
        stationSet.add(point.station_id);
      }
      
      setData(Object.values(byHour));
      setStations(Array.from(stationSet).slice(0, 5)); // Show top 5 stations
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatHour(hourStr: string): string {
    const date = new Date(hourStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric'
    });
  }

  const metricLabels: Record<MetricType, string> = {
    cycle_time: 'Cycle Time (seconds)',
    throughput: 'Throughput (units)',
    defect_rate: 'Defect Rate (%)',
  };

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="flex gap-2">
        {(['cycle_time', 'throughput', 'defect_rate'] as MetricType[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metric === m
                ? 'bg-accent-600 text-white'
                : 'bg-steel-800 text-steel-400 hover:text-white hover:bg-steel-700'
            }`}
          >
            {m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#343b47" />
            <XAxis 
              dataKey="hour" 
              stroke="#667791"
              tick={{ fill: '#667791', fontSize: 11 }}
              tickLine={{ stroke: '#343b47' }}
            />
            <YAxis 
              stroke="#667791"
              tick={{ fill: '#667791', fontSize: 11 }}
              tickLine={{ stroke: '#343b47' }}
              label={{ 
                value: metricLabels[metric], 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#667791', fontSize: 12 }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#22262f',
                border: '1px solid #343b47',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#b0bac9' }}
              itemStyle={{ color: '#eceef2' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ color: '#b0bac9' }}>{value}</span>}
            />
            {stations.map((stationId, index) => (
              <Line
                key={stationId}
                type="monotone"
                dataKey={stationId}
                name={stationId}
                stroke={CHART_COLORS[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS[index] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
