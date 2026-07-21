"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <Card className="flex items-center p-6 bg-card border-border shadow-md">
            <div className="bg-blue-900/30 p-4 rounded-lg mr-4">
              <Activity className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Prompts</p>
              <h2 className="text-2xl font-bold text-foreground">{metrics?.total_prompts || 0}</h2>
            </div>
          </Card>
          <Card className="flex items-center p-6 bg-card border-border shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="bg-red-900/30 p-4 rounded-lg mr-4 border border-red-500/20">
              <Shield className="text-red-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Threats Blocked</p>
              <h2 className="text-2xl font-bold text-red-400">{metrics?.blocked_prompts || 0}</h2>
            </div>
          </Card>
          <Card className="flex items-center p-6 bg-card border-border shadow-md">
            <div className="bg-green-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Avg Quality</p>
              <h2 className="text-2xl font-bold text-green-400">{(metrics?.average_quality || 0).toFixed(2)}</h2>
            </div>
          </Card>
          <Card className="flex items-center p-6 bg-card border-border shadow-md">
            <div className="bg-purple-900/30 p-4 rounded-lg mr-4">
              <Zap className="text-purple-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Avg Speed (cps)</p>
              <h2 className="text-2xl font-bold text-purple-400">{(metrics?.average_speed || 0).toFixed(2)}</h2>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Area Chart */}
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                Performance Timeline
                <span className="text-xs text-muted-foreground font-normal">Last 15 Prompts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="grid grid-rows-2 gap-6">
            {/* Security Donut Chart */}
            <Card className="shadow-md flex flex-col justify-center">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="text-sm text-muted-foreground">Traffic Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-40 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={securityData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                      {securityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#333', borderRadius: '8px'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Distribution Bar Chart */}
            <Card className="shadow-md">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="text-sm text-muted-foreground">Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-40 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#666', fontSize: 11}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#000', borderColor: '#333', borderRadius: '8px'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lower Row: Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Feed */}
          <Card className="relative overflow-hidden border-destructive/50 bg-destructive/5 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-transparent" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" /> Threat Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {threatFeed.length === 0 ? (
                  <div className="text-muted-foreground text-sm h-full flex items-center justify-center py-10">No threats detected.</div>
                ) : (
                  <div className="space-y-3">
                    {threatFeed.map((h, i) => (
                      <div key={i} className="bg-background border border-destructive/20 p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider bg-destructive/20 text-destructive border-none">
                            Injection Attempt
                          </Badge>
                          <span className="text-xs text-destructive/50">{h.date}</span>
                        </div>
                        <p className="text-sm mt-2 text-destructive-foreground/80 font-mono truncate">{h.prompt}</p>
                        <div className="mt-2 flex justify-end">
                          <span className="text-xs text-destructive font-mono bg-destructive/10 px-2 py-0.5 rounded">Score: {h.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clean Feed */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Live Traffic Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {history.filter(h => !h.blocked).slice(0, 20).map((h, i) => (
                    <div key={i} className="bg-muted/30 border border-border p-3 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">{h.date}</span>
                      </div>
                      <p className="text-sm mt-1 text-foreground font-mono truncate">{h.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
