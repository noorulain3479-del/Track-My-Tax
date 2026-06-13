import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Upload, Brain, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ml, blockchain } from '../lib/blockchain';
import type { Project, Transaction, Prediction, Verification } from '../types';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { getRiskBadge, getRiskColor, getStatusColor, formatCurrency, formatDate } from '../lib/utils';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:5000/api';

const TX_TYPE_COLORS: Record<string, string> = {
  MINT: '#10B981', ALLOCATE: '#8B5CF6', LOCK: '#3B82F6',
  RELEASE: '#06B6D4', FREEZE: '#EF4444',
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskInput, setRiskInput] = useState({ fundingVelocity: 2500, projectAge: 60, escrowUtilization: 0.5, transactionCount: 8 });
  const [riskResult, setRiskResult] = useState<{ risk_level: string; confidence: number } | null>(null);
  const [riskError, setRiskError] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [projRes, txRes, predRes, verRes] = await Promise.all([
          fetch(`${API}/projects/${id}`),
          fetch(`${API}/transactions?projectId=${id}`),
          fetch(`${API}/risk-prediction/history?projectId=${id}`),
          fetch(`${API}/verification/results?projectId=${id}`),
        ]);
        const projData = await projRes.json();
        const txData = await txRes.json();
        const predData = await predRes.json();
        const verData = await verRes.json();
        setProject(projData.project || null);
        setTransactions(txData.transactions || []);
        setPrediction(predData.predictions?.[0] || null);
        setVerifications(verData.verifications || []);
      } catch {
        const fallbackMap: Record<string, Project> = {
          'SOL-001': { project_id: 'SOL-001', title: 'Solar Panel Installation', budget: 5000, escrow: 2500, progress: 60, risk_level: 'LOW', status: 'OPTIMAL', location: 'EE Dept, UET Peshawar', lat: 34.008, lng: 71.428, expected_label: 'solar_cell', description: 'Installation of solar panels at Electrical Engineering Department, UET', created_at: new Date().toISOString() },
          'FAN-001': { project_id: 'FAN-001', title: 'Ceiling Fan Distribution', budget: 3000, escrow: 1500, progress: 45, risk_level: 'MEDIUM', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'electric_fan', description: 'Distribution and installation of energy-efficient ceiling fans in New Academic Block, UET', created_at: new Date().toISOString() },
          'LAB-001': { project_id: 'LAB-001', title: 'Lab Equipment Setup', budget: 8000, escrow: 4000, progress: 30, risk_level: 'HIGH', status: 'LOCKED', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'desktop_computer', description: 'Setup of computer lab with 50 workstations in New Academic Block, UET', created_at: new Date().toISOString() },
          'NET-001': { project_id: 'NET-001', title: 'Network Infrastructure', budget: 12000, escrow: 6000, progress: 75, risk_level: 'LOW', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'modem', description: 'Deployment of fiber-optic network infrastructure in New Academic Block, UET', created_at: new Date().toISOString() },
        };
        setProject(fallbackMap[id || ''] || null);
        setTransactions([]);
        setPrediction(null);
        setVerifications([]);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const chartData = transactions
    .slice().reverse()
    .reduce<{ date: string; escrow: number }[]>((acc, tx, i) => {
      const prev = acc[i - 1]?.escrow ?? 0;
      const delta = tx.type === 'ALLOCATE' || tx.type === 'LOCK' ? tx.amount
                  : tx.type === 'RELEASE' || tx.type === 'FREEZE' ? -tx.amount : 0;
      acc.push({ date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), escrow: Math.max(0, prev + delta) });
      return acc;
    }, []);

  async function handleRiskPredict() {
    if (!id) return;
    setRiskError('');
    setPredicting(true);

    try {
      const result = await ml.predictRisk(id, {
        fundingVelocity: Math.max(1500, Math.min(5000, riskInput.fundingVelocity)),
        projectAge: Math.max(0, Math.min(365, riskInput.projectAge)),
        escrowUtilization: Math.max(0, Math.min(1, riskInput.escrowUtilization)),
        transactionCount: Math.max(0, riskInput.transactionCount),
      });

      if (result.error) {
        setRiskError(result.error || 'Prediction failed');
      } else {
        setRiskResult({ risk_level: result.riskLevel, confidence: result.confidence });
        setPrediction(result as any);
      }
    } catch (e: any) {
      setRiskError(e.message || 'Prediction failed');
    }
    setPredicting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <p>Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-purple-400 hover:underline text-sm">Back to Projects</button>
      </div>
    );
  }

  const riskColor = getRiskColor(project.risk_level);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-xs font-mono text-slate-500">{project.project_id}</span>
          <GradientText as="h1" className="text-2xl font-bold block">{project.title}</GradientText>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={getRiskBadge(project.risk_level)}>{project.risk_level}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${getStatusColor(project.status)}15`, color: getStatusColor(project.status), border: `1px solid ${getStatusColor(project.status)}30` }}>
            {project.status}
          </span>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-slate-500" />
              <span className="text-sm text-slate-400">{project.location}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">{project.description}</p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Budget', value: formatCurrency(project.budget), color: '#8B5CF6' },
                { label: 'Locked Escrow', value: formatCurrency(project.escrow), color: '#3B82F6' },
                { label: 'Progress', value: `${project.progress}%`, color: '#10B981' },
              ].map(m => (
                <div key={m.label} className="text-center rounded-xl p-3" style={{ background: `${m.color}10`, border: `1px solid ${m.color}20` }}>
                  <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5 text-slate-500">
                <span>Milestone Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="progress-bar">
                <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">Escrow History</h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,74,0.6)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#0D1526', border: '1px solid #1E2D4A', borderRadius: '10px', fontSize: '11px' }}
                    labelStyle={{ color: '#94A3B8' }}
                    formatter={(v: number) => [formatCurrency(v), 'Escrow']}
                  />
                  <Line type="monotone" dataKey="escrow" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">No transaction history yet.</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Transaction History</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No transactions yet.</p>
              ) : transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/3 transition-colors" style={{ border: '1px solid rgba(30,45,74,0.4)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium" style={{ background: `${TX_TYPE_COLORS[tx.type]}15`, color: TX_TYPE_COLORS[tx.type] }}>{tx.type}</span>
                    <span className="text-xs text-slate-500 font-mono">{tx.wallet_address.slice(0, 10)}...</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-200">{formatCurrency(tx.amount)}</p>
                    <p className="text-[10px] text-slate-600">{formatDate(tx.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">AI Risk Predictor</h3>
            </div>

            <div className="space-y-3 mb-4">
              {[
                { key: 'fundingVelocity', label: 'Funding Velocity (credits/day)', min: 1500, max: 5000 },
                { key: 'projectAge', label: 'Project Age (days)', min: 0, max: 365 },
                { key: 'escrowUtilization', label: 'Escrow Utilization (0–1)', min: 0, max: 1, step: 0.01 },
                { key: 'transactionCount', label: 'Transaction Count', min: 0, max: 100 },
              ].map(f => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{f.label}</span>
                    <span className="text-slate-300">{(riskInput as any)[f.key]}</span>
                  </div>
                  <input
                    type="range" min={f.min} max={f.max} step={f.step ?? 1}
                    value={(riskInput as any)[f.key]}
                    onChange={e => setRiskInput(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#8B5CF6', background: 'rgba(30,45,74,0.6)' }}
                  />
                </div>
              ))}
            </div>

            {riskError && <p className="text-xs text-red-400 mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">{riskError}</p>}

            <StarBorderButton size="sm" loading={predicting} onClick={handleRiskPredict} className="w-full justify-center">
              <Brain size={13} />
              Run Prediction
            </StarBorderButton>

            {riskResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl"
                style={{ background: `${getRiskColor(riskResult.risk_level)}10`, border: `1px solid ${getRiskColor(riskResult.risk_level)}30` }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Risk Classification</span>
                  <span className={getRiskBadge(riskResult.risk_level)}>{riskResult.risk_level}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <span className="text-sm font-bold" style={{ color: getRiskColor(riskResult.risk_level) }}>
                    {(riskResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Upload Evidence</h3>
            </div>

            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file) setUploadedFile(file);
              }}
              className="border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer"
              style={{
                borderColor: dragActive ? '#8B5CF6' : 'rgba(30,45,74,0.8)',
                background: dragActive ? 'rgba(139,92,246,0.05)' : 'transparent',
              }}
              onClick={() => document.getElementById('evidence-input')?.click()}
            >
              <input id="evidence-input" type="file" className="hidden" accept="image/*"
                onChange={e => e.target.files?.[0] && setUploadedFile(e.target.files[0])} />
              <Upload size={24} className="mx-auto mb-2 text-slate-600" />
              {uploadedFile ? (
                <p className="text-xs text-emerald-400">{uploadedFile.name}</p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">Drag & drop field evidence image</p>
                  <p className="text-[10px] text-slate-600 mt-1">JPEG, PNG — GPS EXIF required</p>
                </>
              )}
            </div>

            {uploadedFile && (
              <StarBorderButton
                size="sm"
                className="w-full justify-center mt-3"
                onClick={() => navigate(`/verification-desk?project=${id}&filename=${uploadedFile.name}`)}
              >
                Run Forensic Pipeline
              </StarBorderButton>
            )}
          </motion.div>

          {verifications[0] && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Latest Verification</h3>
              {[
                { label: 'GPS Check', value: verifications[0].gps_status },
                { label: 'Timestamp', value: verifications[0].timestamp_status },
                { label: 'Model Class', value: verifications[0].mobilenet_status },
                { label: 'Confidence', value: `${(verifications[0].confidence * 100).toFixed(1)}%` },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-xs py-1.5 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={
                    row.value === 'PASSED' ? 'text-emerald-400' :
                    row.value === 'FAILED' ? 'text-red-400' : 'text-slate-300'
                  }>{row.value}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-slate-500">Result</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  verifications[0].result === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  verifications[0].result === 'REJECTED' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                  'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                }`}>{verifications[0].result}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
