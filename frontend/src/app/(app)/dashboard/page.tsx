"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Shield, Zap, Activity, AlertOctagon } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mf-mlcllm-api.onrender.com/api/v1";

    const fetchData = async () => {
      try {
        const [metricsRes, detailedRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/llm/metrics`),
          fetch(`${API_URL}/llm/metrics/detailed`),
          fetch(`${API_URL}/llm/history`, { headers: { "X-User-ID": "00000000-0000-0000-0000-000000000000" } })
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (detailedRes.ok) setDetailedMetrics(await detailedRes.json());
        
        if (historyRes.ok) {
          const data = await historyRes.json();
          const formattedHistory = data.map((log: any) => ({
            id: log.id,
            prompt: log.prompt,
            score: (log.injection_score || 0).toFixed(2),
            blocked: log.is_blocked,
            date: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setHistory(formattedHistory);

          const liveChartData = data
            .filter((log: any) => !log.is_blocked && (log.quality_score > 0 || log.speed_score > 0))
            .slice(0, 15)
            .reverse()
            .map((log: any) => ({
              time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quality: log.quality_score,
              speed: log.speed_score
            }));
            
          if (liveChartData.length > 0) {
            setChartData(liveChartData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch backend metrics:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Format Data for New Charts
  const securityData = detailedMetrics ? [
    { name: 'Clean', value: detailedMetrics.security_ratio.clean || 0 },
    { name: 'Blocked', value: detailedMetrics.security_ratio.blocked || 0 }
  ] : [];

  const qualityData = detailedMetrics ? [
    { name: 'Low', count: detailedMetrics.quality_distribution.low || 0 },
    { name: 'Medium', count: detailedMetrics.quality_distribution.medium || 0 },
    { name: 'High', count: detailedMetrics.quality_distribution.high || 0 }
  ] : [];

  const COLORS = ['#10b981', '#ef4444'];
  const threatFeed = history.filter(h => h.blocked);

  return (
    <div className="flex flex-col font-sans min-h-[90vh]">
      <div className="max-w-7xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center shadow-lg">
            <div className="bg-blue-900/30 p-4 rounded-lg mr-4">
              <Activity className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Prompts</p>
              <h2 className="text-2xl font-bold">{metrics?.total_prompts || 0}</h2>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="bg-red-900/30 p-4 rounded-lg mr-4 border border-red-500/20">
              <Shield className="text-red-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Threats Blocked</p>
              <h2 className="text-2xl font-bold text-red-400">{metrics?.blocked_prompts || 0}</h2>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center shadow-lg">
            <div className="bg-green-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Quality</p>
              <h2 className="text-2xl font-bold text-green-400">{(metrics?.average_quality || 0).toFixed(2)}</h2>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center shadow-lg">
            <div className="bg-purple-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-purple-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Speed (cps)</p>
              <h2 className="text-2xl font-bold text-purple-400">{(metrics?.average_speed || 0).toFixed(2)}</h2>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Area Chart */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              Performance Timeline <span className="text-xs text-gray-500 font-normal ml-auto">(Last 15 Prompts)</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 1]} />
                  <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333', borderRadius: '8px'}} itemStyle={{fontWeight: 'bold'}}/>
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Area type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorQuality)" />
                  <Area type="monotone" dataKey="speed" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorSpeed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-6">
            {/* Security Donut Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center relative">
              <h3 className="text-sm font-semibold text-gray-400 absolute top-4 left-6">Traffic Analysis</h3>
              <div className="h-40 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={securityData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                      {securityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333', borderRadius: '8px'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality Distribution Bar Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg relative">
              <h3 className="text-sm font-semibold text-gray-400 absolute top-4 left-6">Quality Distribution</h3>
              <div className="h-40 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#666', fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#000', borderColor: '#333', borderRadius: '8px'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Row: Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Feed */}
          <div className="bg-gray-900/50 border border-red-900/50 rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent" />
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> Threat Feed
            </h3>
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {threatFeed.length === 0 ? (
                <div className="text-gray-500 text-sm h-full flex items-center justify-center">No threats detected.</div>
              ) : (
                <div className="space-y-3">
                  {threatFeed.map((h, i) => (
                    <div key={i} className="bg-black/50 border border-red-900/30 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 font-bold">Injection Attempt</span>
                        <span className="text-xs text-red-500/50">{h.date}</span>
                      </div>
                      <p className="text-sm mt-2 text-red-200/80 font-mono truncate">{h.prompt}</p>
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-red-500 font-mono bg-red-950 px-2 py-0.5 rounded">Score: {h.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clean Feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Live Traffic Feed</h3>
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              <div className="space-y-3">
                {history.filter(h => !h.blocked).slice(0, 20).map((h, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{h.date}</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-300 font-mono truncate">{h.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
