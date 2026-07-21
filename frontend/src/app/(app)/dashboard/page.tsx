"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield, Zap, Activity } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mf-mlcllm-api.onrender.com/api/v1";

    const fetchData = async () => {
      try {
        const metricsRes = await fetch(`${API_URL}/llm/metrics`);
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }

        const historyRes = await fetch(`${API_URL}/llm/history`, {
          headers: { "X-User-ID": "00000000-0000-0000-0000-000000000000" }
        });
        if (historyRes.ok) {
          const data = await historyRes.json();
          const formattedHistory = data.map((log: any) => ({
            id: log.id,
            prompt: log.prompt,
            score: log.injection_score.toFixed(2),
            blocked: log.is_blocked,
            date: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setHistory(formattedHistory);
        }
      } catch (err) {
        console.error("Failed to fetch backend metrics:", err);
      }
    };

    fetchData();
    // Refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { time: '10:00', quality: 0.8, speed: 0.9 },
    { time: '10:15', quality: 0.85, speed: 0.88 },
    { time: '10:30', quality: 0.89, speed: 0.95 },
    { time: '10:45', quality: 0.87, speed: 0.91 },
    { time: '11:00', quality: 0.92, speed: 0.94 },
  ];

  return (
    <div className="flex flex-col font-sans">
      <div className="max-w-6xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center">
            <div className="bg-blue-900/30 p-4 rounded-lg mr-4">
              <Activity className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Prompts</p>
              <h2 className="text-2xl font-bold">{metrics?.total_prompts || 0}</h2>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center">
            <div className="bg-red-900/30 p-4 rounded-lg mr-4">
              <Shield className="text-red-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Injections Blocked</p>
              <h2 className="text-2xl font-bold">{metrics?.blocked_prompts || 0}</h2>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center">
            <div className="bg-green-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Quality</p>
              <h2 className="text-2xl font-bold">{metrics?.average_quality || 0}</h2>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center">
            <div className="bg-purple-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-purple-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Speed</p>
              <h2 className="text-2xl font-bold">{metrics?.average_speed || 0}</h2>
            </div>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Performance Trends</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} domain={[0.7, 1.0]} />
                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="speed" stroke="#a855f7" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div key={i} className="border-b border-gray-800 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${h.blocked ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                        {h.blocked ? 'BLOCKED' : 'CLEAN'}
                      </span>
                      <span className="text-xs text-gray-500">{h.date}</span>
                    </div>
                    <p className="text-sm mt-2 text-gray-300 font-mono truncate">{h.prompt}</p>
                    {h.blocked && <p className="text-xs text-red-500 mt-1">Injection Score: {h.score}</p>}
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
