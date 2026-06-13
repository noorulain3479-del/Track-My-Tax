import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Lock, ChevronRight, Plus } from 'lucide-react';
import { blockchain } from '../lib/blockchain';
import type { Project } from '../types';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { BentoGrid, BentoCard } from '../components/ui/BentoGrid';
import { getRiskBadge, getRiskColor, formatCurrency, getStatusColor } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:5000/api';

const FALLBACK_PROJECTS: Project[] = [
  { project_id: 'SOL-001', title: 'Solar Panel Installation', budget: 5000, escrow: 2500, progress: 60, risk_level: 'LOW', status: 'OPTIMAL', location: 'EE Dept, UET Peshawar', lat: 34.008, lng: 71.428, expected_label: 'solar_cell', description: 'Installation of solar panels at Electrical Engineering Department, UET', created_at: new Date().toISOString() },
  { project_id: 'FAN-001', title: 'Ceiling Fan Distribution', budget: 3000, escrow: 1500, progress: 45, risk_level: 'MEDIUM', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'electric_fan', description: 'Distribution and installation of energy-efficient ceiling fans in New Academic Block, UET', created_at: new Date().toISOString() },
  { project_id: 'LAB-001', title: 'Lab Equipment Setup', budget: 8000, escrow: 4000, progress: 30, risk_level: 'HIGH', status: 'LOCKED', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'desktop_computer', description: 'Setup of computer lab with 50 workstations in New Academic Block, UET', created_at: new Date().toISOString() },
  { project_id: 'NET-001', title: 'Network Infrastructure', budget: 12000, escrow: 6000, progress: 75, risk_level: 'LOW', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'modem', description: 'Deployment of fiber-optic network infrastructure in New Academic Block, UET', created_at: new Date().toISOString() },
];

export default function ProjectsMatrix() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);
  const [allocateAmount] = useState(5000);
  const [toastMsg, setToastMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/projects`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setProjects(data.projects || FALLBACK_PROJECTS);
    } catch {
      setProjects(FALLBACK_PROJECTS);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAllocate(project: Project) {
    if (!isAuthenticated || !user) { navigate('/auth'); return; }
    setAllocating(project.project_id);
    try {
      const result = await blockchain.allocateCredits(project.project_id, allocateAmount, user.wallet_address);
      if (result.success) {
        setToastMsg(`Allocated ${formatCurrency(allocateAmount)} to ${project.project_id}`);
        setTimeout(() => setToastMsg(''), 3000);
        load();
      }
    } catch (err) {
      console.error('Allocation failed:', err);
    }
    setAllocating(null);
  }

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalEscrow = projects.reduce((s, p) => s + p.escrow, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <GradientText as="h1" className="text-3xl font-bold">Projects Matrix</GradientText>
        <p className="text-slate-500 text-sm mt-1">{projects.length} active infrastructure projects under blockchain governance</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Budget',   value: formatCurrency(totalBudget),  color: '#8B5CF6' },
          { label: 'Locked Escrow',  value: formatCurrency(totalEscrow),  color: '#3B82F6' },
          { label: 'Avg. Progress',  value: `${Math.round(projects.reduce((s,p)=>s+p.progress,0)/(projects.length||1))}%`, color: '#10B981' },
          { label: 'Projects',       value: projects.length.toString(),    color: '#06B6D4' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <BentoGrid>
          {projects.map((project, i) => {
            const riskColor = getRiskColor(project.risk_level);
            const escrowPct = project.budget > 0 ? (project.escrow / project.budget) * 100 : 0;

            return (
              <BentoCard key={project.project_id} glowColor={riskColor}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-500">{project.project_id}</span>
                    <h3 className="text-base font-semibold text-slate-100 mt-0.5 leading-tight">{project.title}</h3>
                  </div>
                  <span className={getRiskBadge(project.risk_level)}>{project.risk_level}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-4">
                  <MapPin size={11} className="text-slate-500" />
                  <span className="text-xs text-slate-500">{project.location}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{project.description}</p>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-300 font-medium">{project.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Escrow Utilization</span>
                      <span className="text-slate-300 font-medium">{escrowPct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="h-full rounded-full transition-all"
                        style={{ background: riskColor, width: `${escrowPct}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${escrowPct}%` }}
                        transition={{ duration: 1.2, delay: i * 0.1 + 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="rounded-lg p-2.5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <p className="text-slate-500 mb-0.5">Budget</p>
                    <p className="font-semibold text-purple-300">{formatCurrency(project.budget)}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <p className="text-slate-500 mb-0.5 flex items-center gap-1"><Lock size={9} />Escrow</p>
                    <p className="font-semibold text-blue-300">{formatCurrency(project.escrow)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: `${getStatusColor(project.status)}15`, color: getStatusColor(project.status), border: `1px solid ${getStatusColor(project.status)}30` }}>
                    {project.status}
                  </div>

                  <div className="flex-1" />

                  <StarBorderButton
                    size="sm"
                    loading={allocating === project.project_id}
                    onClick={() => handleAllocate(project)}
                  >
                    <Plus size={12} />
                    Allocate
                  </StarBorderButton>

                  <button
                    onClick={() => navigate(`/projects/${project.project_id}`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </BentoCard>
            );
          })}
        </BentoGrid>
      )}

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium text-emerald-300 z-50"
            style={{ background: 'rgba(6,78,59,0.9)', border: '1px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(12px)' }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
