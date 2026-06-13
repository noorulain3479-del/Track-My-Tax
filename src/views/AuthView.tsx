import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import type { User as UserType } from '../types';

const ROLES: { value: UserType['role']; label: string; icon: typeof Shield; desc: string }[] = [
  { value: 'Student',  label: 'Student',  icon: GraduationCap, desc: 'Read-only, credit allocation' },
  { value: 'Faculty',  label: 'Faculty',  icon: BookOpen,       desc: 'Verification uploads, forensics' },
];

export default function AuthView() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserType['role']>('Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result: { error: string | null };
    if (mode === 'signin') {
      result = await signIn(email, password);
    } else {
      if (!name.trim()) { setError('Name is required.'); setLoading(false); return; }
      result = await signUp(name, email, password, role);
    }

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <GradientText as="h1" className="text-3xl font-bold mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </GradientText>
          <p className="text-slate-500 text-sm">
            {mode === 'signin' ? 'Sign in to access the platform' : 'Join the governance network'}
          </p>
          {mode === 'signin' && (
            <p className="text-slate-600 text-xs mt-2">
              Admin login: admin@tax.local / admin123
            </p>
          )}
        </div>

        <div className="glass-card p-8">
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(13,21,38,0.8)', border: '1px solid rgba(30,45,74,0.6)' }}>
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={mode === m ? {
                  background: 'rgba(139,92,246,0.2)',
                  color: '#A78BFA',
                  boxShadow: '0 0 12px rgba(139,92,246,0.2)',
                } : { color: '#64748B' }}
              >
                {m === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="text-xs text-slate-400 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Dr. Ahmed Khan"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      style={{ background: '#0D1526', border: '1px solid #1E2D4A' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tax.local"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  style={{ background: '#0D1526', border: '1px solid #1E2D4A' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={1}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  style={{ background: '#0D1526', border: '1px solid #1E2D4A' }}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Access Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const selected = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200"
                        style={{
                          background: selected ? 'rgba(139,92,246,0.15)' : 'rgba(13,21,38,0.5)',
                          border: selected ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(30,45,74,0.6)',
                        }}
                      >
                        <Icon size={16} className={selected ? 'text-purple-400' : 'text-slate-500'} />
                        <span className={`text-xs font-medium ${selected ? 'text-purple-300' : 'text-slate-500'}`}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <StarBorderButton type="submit" size="lg" loading={loading} className="w-full justify-center mt-2">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </StarBorderButton>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Admin: admin@tax.local / admin123
        </p>
      </motion.div>
    </div>
  );
}
