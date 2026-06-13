import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import type { Project, Transaction, Prediction } from '../types';
import GradientText from '../components/ui/GradientText';
import { formatCurrency, getRiskColor } from '../lib/utils';
import { TrendingUp, Activity, Shield, Layers } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:5000/api';

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const FALLBACK_PROJECTS: Project[] = [
  { project_id: 'SOL-001', title: 'Solar Panel Installation', budget: 5000, escrow: 2500, progress: 60, risk_level: 'LOW', status: 'OPTIMAL', location: 'EE Dept, UET Peshawar', lat: 34.008, lng: 71.428, expected_label: 'solar_cell', description: '', created_at: new Date().toISOString() },
  { project_id: 'FAN-001', title: 'Ceiling Fan Distribution', budget: 3000, escrow: 1500, progress: 45, risk_level: 'MEDIUM', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'electric_fan', description: '', created_at: new Date().toISOString() },
  { project_id: 'LAB-001', title: 'Lab Equipment Setup', budget: 8000, escrow: 4000, progress: 30, risk_level: 'HIGH', status: 'LOCKED', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'desktop_computer', description: '', created_at: new Date().toISOString() },
  { project_id: 'NET-001', title: 'Network Infrastructure', budget: 12000, escrow: 6000, progress: 75, risk_level: 'LOW', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'modem', description: '', created_at: new Date().toISOString() },
];

export default function AnalyticsCenter() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, txRes, predRes] = await Promise.all([
          fetch(`${API}/projects`),
          fetch(`${API}/transactions`),
          fetch(`${API}/risk-prediction/history`),
        ]);
        const projData = await projRes.json();
        const txData = await txRes.json();
        const predData = await predRes.json();
        setProjects(projData.projects || FALLBACK_PROJECTS);
        setTransactions(txData.transactions || []);
        setPredictions(predData.predictions || []);
      } catch {
        setProjects(FALLBACK_PROJECTS);
        setTransactions([
          { id: 1, wallet_address: '0xA1a1a1...', project_id: 'SOL-001', amount: 2500, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
          { id: 2, wallet_address: '0xA1a1a1...', project_id: 'FAN-001', amount: 1500, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
        ]);
        setPredictions([
          { id: 1, project_id: 'SOL-001', risk_level: 'LOW', confidence: 0.95, created_at: new Date().toISOString() },
        ]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalBudget   = projects.reduce((s, p) => s + p.budget, 0);
  const totalEscrow   = projects.reduce((s, p) => s + p.escrow, 0);
  const totalTxVolume = transactions.reduce((s, t) => s + t.amount, 0);
  const avgProgress   = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;

  const trendMap = new Map<string, number>();
  for (const tx of transactions) {
    const day = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendMap.set(day, (trendMap.get(day) ?? 0) + tx.amount);
  }
  const trendData = Array.from(trendMap.entries()).map(([date, volume]) => ({ date, volume }));

  const riskMap: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const p of projects) riskMap[p.risk_level]++;
  const riskPieData = Object.entries(riskMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const completionData = projects.map(p => ({
    id: p.project_id,
    progress: p.progress,
    escrow: Math.round((p.escrow / p.budget) * 100),
  }));

  const txTypeMap: Record<string, number> = {};
  for (const tx of transactions) txTypeMap[tx.type] = (txTypeMap[tx.type] ?? 0) + tx.amount;
  const txTypeData = Object.entries(txTypeMap).map(([type, amount]) => ({ type, amount }));

  const metrics = [
    { icon: Layers,    label: 'Total Budget',    value: totalBudget,   prefix: 'PKR ', suffix: '', format: (v: number) => (v/1000).toFixed(0)+'K', color: '#8B5CF6' },
    { icon: Shield,    label: 'Locked Escrow',   value: totalEscrow,   prefix: 'PKR ', suffix: '', format: (v: number) => (v/1000).toFixed(0)+'K', color: '#3B82F6' },
    { icon: TrendingUp,label: 'Token Velocity',  value: totalTxVolume, prefix: 'PKR ', suffix: '', format: (v: number) => (v/1000).toFixed(0)+'K', color: '#10B981' },
    { icon: Activity,  label: 'Avg. Progress',   value: avgProgress,   prefix: '',     suffix: '%', format: (v: number) => v.toString(),            color: '#06B6D4' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tooltipStyle = { background: '#0D1526', border: '1px solid #1E2D4A', borderRadius: '10px', fontSize: '11px' };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <GradientText as="h1" className="text-3xl font-bold">Analytics Center</GradientText>
        <p className="text-slate-500 text-sm mt-1">Platform-wide token velocity, risk distribution, and project health metrics</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                  <Icon size={14} style={{ color: m.color }} />
                </div>
                <p className="text-xs text-slate-500">{m.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: m.color }}>
                {m.prefix}<AnimatedCounter target={parseInt(m.format(m.value))} />{m.suffix}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-purple-400" />
            Funding Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#94A3B8' }} formatter={(v: number) => [formatCurrency(v), 'Volume']} />
              <Area type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={2} fill="url(#volumeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Shield size={15} className="text-blue-400" />
            Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {riskPieData.map((entry) => (
                  <Cell key={entry.name} fill={getRiskColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {riskPieData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: getRiskColor(d.name) }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={15} className="text-emerald-400" />
            Project Completion vs Escrow
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={completionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.5)" />
              <XAxis dataKey="id" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748B' }} />
              <Bar dataKey="progress" name="Progress" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="escrow" name="Escrow %" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Layers size={15} className="text-cyan-400" />
            Transaction Type Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={txTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.5)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Volume']} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {txTypeData.map((entry) => {
                  const c: Record<string, string> = { MINT: '#10B981', ALLOCATE: '#8B5CF6', LOCK: '#3B82F6', RELEASE: '#06B6D4', FREEZE: '#EF4444' };
                  return <Cell key={entry.type} fill={c[entry.type] ?? '#64748B'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
