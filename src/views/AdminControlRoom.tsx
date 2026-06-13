import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Lock, Unlock, AlertTriangle, RefreshCw, Plus, Edit2, Check, X, Trash2, MapPin } from 'lucide-react';
import type { Project, Prediction, Verification } from '../types';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getRiskBadge, getStatusColor, formatDate } from '../lib/utils';
import { blockchain } from '../lib/blockchain';

type ProjectStatus = 'OPTIMAL' | 'MONITORING' | 'AT_RISK' | 'FROZEN';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:5000/api';

interface NewProjectForm {
  project_id: string;
  title: string;
  description: string;
  location: string;
  lat: string;
  lng: string;
  expected_label: string;
  budget: string;
  escrow: string;
  progress: string;
  risk_level: string;
}

const emptyForm: NewProjectForm = {
  project_id: '', title: '', description: '', location: '',
  lat: '34.008', lng: '71.428', expected_label: '',
  budget: '0', escrow: '0', progress: '0', risk_level: 'LOW',
};

const FALLBACK_PROJECTS: Project[] = [
  { project_id: 'SOL-001', title: 'Solar Panel Installation', budget: 5000, escrow: 2500, progress: 60, risk_level: 'LOW', status: 'OPTIMAL', location: 'EE Dept, UET Peshawar', lat: 34.008, lng: 71.428, expected_label: 'solar_cell', description: 'Installation of solar panels at EE Department, UET', created_at: new Date().toISOString() },
  { project_id: 'FAN-001', title: 'Ceiling Fan Distribution', budget: 3000, escrow: 1500, progress: 45, risk_level: 'MEDIUM', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'electric_fan', description: 'Ceiling fans in New Academic Block, UET', created_at: new Date().toISOString() },
  { project_id: 'LAB-001', title: 'Lab Equipment Setup', budget: 8000, escrow: 4000, progress: 30, risk_level: 'HIGH', status: 'LOCKED', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'desktop_computer', description: 'Computer lab in New Academic Block, UET', created_at: new Date().toISOString() },
  { project_id: 'NET-001', title: 'Network Infrastructure', budget: 12000, escrow: 6000, progress: 75, risk_level: 'LOW', status: 'OPTIMAL', location: 'New Academic Block, UET Peshawar', lat: 34.0017, lng: 71.4854, expected_label: 'modem', description: 'Network infrastructure in New Academic Block, UET', created_at: new Date().toISOString() },
];

export default function AdminControlRoom() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<ProjectStatus>('OPTIMAL');
  const [toast, setToast] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<NewProjectForm>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'Admin') navigate('/');
  }, [isAuthenticated, user]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [projRes, predRes, verRes] = await Promise.all([
        fetch(`${API}/projects`),
        fetch(`${API}/risk-prediction/history`),
        fetch(`${API}/verification/results`),
      ]);
      const projData = await projRes.json();
      const predData = await predRes.json();
      const verData = await verRes.json();
      setProjects(projData.projects || FALLBACK_PROJECTS);
      setPredictions(predData.predictions || []);
      setVerifications(verData.verifications || []);
    } catch {
      setProjects(FALLBACK_PROJECTS);
      setPredictions([
        { id: 1, project_id: 'SOL-001', risk_level: 'LOW', confidence: 0.95, created_at: new Date().toISOString() },
        { id: 2, project_id: 'FAN-001', risk_level: 'MEDIUM', confidence: 0.82, created_at: new Date().toISOString() },
      ]);
      setVerifications([
        { id: 1, project_id: 'SOL-001', gps_status: 'PASSED', timestamp_status: 'PASSED', mobilenet_status: 'solar_cell', confidence: 0.92, result: 'VERIFIED', created_at: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function handleFreeze(projectId: string) {
    setActionLoading(`freeze-${projectId}`);
    await blockchain.freezeEscrow(projectId, 'Admin freeze');
    showToast(`Escrow frozen for ${projectId}`);
    load();
    setActionLoading(null);
  }

  async function handleRelease(projectId: string) {
    setActionLoading(`release-${projectId}`);
    await blockchain.releaseEscrow(projectId);
    showToast(`Escrow released for ${projectId}`);
    load();
    setActionLoading(null);
  }

  async function handleSaveEdit(projectId: string) {
    setActionLoading(`edit-${projectId}`);
    try {
      await fetch(`${API}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: editProgress, status: editStatus }),
      });
    } catch { /* handled below */ }
    setProjects(prev => prev.map(p =>
      p.project_id === projectId ? { ...p, progress: editProgress, status: editStatus } : p
    ));
    showToast(`Updated ${projectId}`);
    setEditingProject(null);
    setActionLoading(null);
  }

  async function handleAddProject() {
    if (!form.project_id || !form.title) {
      showToast('Project ID and Title are required');
      return;
    }
    setActionLoading('add');
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: form.project_id,
          title: form.title,
          description: form.description,
          location: form.location,
          lat: parseFloat(form.lat) || 0,
          lng: parseFloat(form.lng) || 0,
          expected_label: form.expected_label,
          budget: parseFloat(form.budget) || 0,
          escrow: parseFloat(form.escrow) || 0,
          progress: parseInt(form.progress) || 0,
          risk_level: form.risk_level,
          status: 'OPTIMAL',
        }),
      });
      const data = await res.json();
      showToast(data.project ? `Project ${form.project_id} created` : data.error || 'Failed to create project');
      setForm(emptyForm);
      setShowAddForm(false);
      load();
    } catch {
      const newProj: Project = {
        project_id: form.project_id,
        title: form.title,
        description: form.description,
        location: form.location,
        lat: parseFloat(form.lat) || 0,
        lng: parseFloat(form.lng) || 0,
        expected_label: form.expected_label,
        budget: parseFloat(form.budget) || 0,
        escrow: parseFloat(form.escrow) || 0,
        progress: parseInt(form.progress) || 0,
        risk_level: form.risk_level as any,
        status: 'OPTIMAL',
        created_at: new Date().toISOString(),
      };
      setProjects(prev => [...prev, newProj]);
      showToast(`Project ${form.project_id} added (local)`);
      setForm(emptyForm);
      setShowAddForm(false);
    }
    setActionLoading(null);
  }

  async function handleDeleteProject(projectId: string) {
    setDeletingId(projectId);
    try {
      await fetch(`${API}/projects/${projectId}`, { method: 'DELETE' });
    } catch { /* handled below */ }
    setProjects(prev => prev.filter(p => p.project_id !== projectId));
    showToast(`Project ${projectId} deleted`);
    setDeletingId(null);
  }

  if (!isAuthenticated || user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Shield size={40} className="mb-4 text-red-400" />
        <p className="text-lg font-semibold text-red-400">Access Restricted</p>
        <p className="text-sm mt-2">Admin credentials required to access this panel.</p>
        <button onClick={() => navigate('/auth')} className="mt-4 text-sky-400 hover:underline text-sm">Sign In as Admin</button>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500/50 transition-colors";
  const inputStyle = { background: '#0A0F1C', border: '1px solid #1E2D4A' };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)' }}>
            <Settings size={18} className="text-sky-400" />
          </div>
          <GradientText as="h1" className="text-3xl font-bold">Admin Control Room</GradientText>
        </div>
        <p className="text-slate-500 text-sm">Master administrative override — escrow controls, project management, ML audit logs</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Plus size={14} className="text-sky-400" />
                Project Management
              </h3>
              <div className="flex items-center gap-2">
                <StarBorderButton size="sm" variant="primary" onClick={() => setShowAddForm(v => !v)}>
                  <Plus size={12} />
                  {showAddForm ? 'Cancel' : 'Add Project'}
                </StarBorderButton>
                <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl mb-4"
                    style={{ background: 'rgba(10,15,28,0.6)', border: '1px solid rgba(30,45,74,0.5)' }}>
                    {[
                      { key: 'project_id', label: 'Project ID *', placeholder: 'e.g. SOL-002' },
                      { key: 'title', label: 'Title *', placeholder: 'e.g. Solar Panel Phase 2' },
                      { key: 'description', label: 'Description', placeholder: 'Brief description' },
                      { key: 'location', label: 'Location', placeholder: 'e.g. EE Dept, UET Peshawar' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                        <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder} className={inputCls} style={inputStyle} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><MapPin size={10} /> Latitude</label>
                      <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="34.008" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1"><MapPin size={10} /> Longitude</label>
                      <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="71.428" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Expected ML Label</label>
                      <input value={form.expected_label} onChange={e => setForm(f => ({ ...f, expected_label: e.target.value }))} placeholder="e.g. solar_cell" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Budget ($)</label>
                      <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Initial Escrow ($)</label>
                      <input type="number" value={form.escrow} onChange={e => setForm(f => ({ ...f, escrow: e.target.value }))} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Progress (%)</label>
                      <input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Risk Level</label>
                      <select value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))} className={inputCls} style={inputStyle}>
                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <StarBorderButton size="sm" variant="success" loading={actionLoading === 'add'} onClick={handleAddProject} className="w-full justify-center">
                        <Check size={12} /> Create Project
                      </StarBorderButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {projects.map(project => (
                <motion.div key={project.project_id} layout
                  className="rounded-xl p-4 transition-all"
                  style={{ background: 'rgba(13,21,38,0.5)', border: '1px solid rgba(30,45,74,0.6)' }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-slate-500 w-16 shrink-0">{project.project_id}</span>
                    <span className="text-sm font-medium text-slate-200 flex-1 min-w-32">{project.title}</span>
                    <span className="text-xs text-slate-500 hidden md:inline">{project.location}</span>
                    <span className={getRiskBadge(project.risk_level)}>{project.risk_level}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${getStatusColor(project.status)}15`, color: getStatusColor(project.status), border: `1px solid ${getStatusColor(project.status)}30` }}>
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-400">{formatCurrency(project.escrow)} locked</span>

                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={() => { setEditingProject(project.project_id); setEditProgress(project.progress); setEditStatus(project.status as ProjectStatus); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>

                      <StarBorderButton size="sm" variant="danger" loading={actionLoading === `freeze-${project.project_id}`}
                        onClick={() => handleFreeze(project.project_id)}>
                        <Lock size={11} /> Freeze
                      </StarBorderButton>

                      <StarBorderButton size="sm" variant="success" loading={actionLoading === `release-${project.project_id}`}
                        onClick={() => handleRelease(project.project_id)}>
                        <Unlock size={11} /> Release
                      </StarBorderButton>

                      <button onClick={() => handleDeleteProject(project.project_id)}
                        disabled={deletingId === project.project_id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50" title="Delete project">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {editingProject === project.project_id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-800/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Progress ({editProgress}%)</label>
                            <input type="range" min={0} max={100} value={editProgress}
                              onChange={e => setEditProgress(parseInt(e.target.value))} className="w-full" style={{ accentColor: '#0EA5E9' }} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Status</label>
                            <select value={editStatus} onChange={e => setEditStatus(e.target.value as ProjectStatus)}
                              className={inputCls} style={inputStyle}>
                              {['OPTIMAL', 'MONITORING', 'AT_RISK', 'FROZEN'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <StarBorderButton size="sm" loading={actionLoading === `edit-${project.project_id}`}
                              onClick={() => handleSaveEdit(project.project_id)}>
                              <Check size={12} /> Save
                            </StarBorderButton>
                            <button onClick={() => setEditingProject(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-400" /> ML Prediction Audit Log
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {predictions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No predictions recorded.</p>
                ) : predictions.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: 'rgba(13,21,38,0.5)', border: '1px solid rgba(30,45,74,0.4)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{p.project_id}</span>
                      <span className={getRiskBadge(p.risk_level)}>{p.risk_level}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-300">{(p.confidence * 100).toFixed(1)}%</p>
                      <p className="text-[10px] text-slate-600">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Check size={14} className="text-emerald-400" /> Verification Audit Log
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {verifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No verifications recorded.</p>
                ) : verifications.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: 'rgba(13,21,38,0.5)', border: '1px solid rgba(30,45,74,0.4)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{v.project_id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        v.result === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-400' :
                        v.result === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                        'bg-yellow-500/15 text-yellow-400'
                      }`}>{v.result}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">{(v.confidence * 100).toFixed(1)}%</p>
                      <p className="text-[10px] text-slate-600">{formatDate(v.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium text-slate-100 z-50"
            style={{ background: 'rgba(14,165,233,0.9)', border: '1px solid rgba(14,165,233,0.4)', backdropFilter: 'blur(12px)' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
