import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Brain, Link2, ChevronRight, Star } from 'lucide-react';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: Link2,  title: 'Blockchain Escrow',    desc: 'Smart contract-secured funds released only on milestone verification.' },
  { icon: Brain,  title: 'AI Risk Prediction',   desc: 'Random Forest classifier evaluates project stability in real-time.' },
  { icon: Shield, title: 'Digital Forensics',    desc: 'MobileNetV2 + EXIF GPS validation ensures authentic field evidence.' },
  { icon: Zap,    title: 'CitizenCredits Token', desc: 'Mint, allocate, lock, and release infrastructure credits transparently.' },
];

const stats = [
  { label: 'Active Projects',  value: '4' },
  { label: 'Secured Escrow',   value: '465K' },
  { label: 'Verifications',    value: '4' },
  { label: 'Risk Predictions', value: '12' },
];

export default function HomeSplash() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-medium"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}
          >
            <Star size={12} className="text-purple-400" />
            AI-Powered Infrastructure Governance Platform — UET Peshawar
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <GradientText className="block text-5xl md:text-7xl font-bold">
              Track-My-Tax
            </GradientText>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered blockchain governance for transparent infrastructure funding at UET Peshawar.
            Every credit tracked. Every milestone verified. Every amount accountable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <StarBorderButton size="lg" onClick={() => navigate('/projects')}>
              <span>Explore Projects</span>
              <ChevronRight size={16} />
            </StarBorderButton>

            {isAuthenticated ? (
              <StarBorderButton size="lg" variant="secondary" onClick={() => navigate('/analytics')}>
                <span>View Analytics</span>
              </StarBorderButton>
            ) : (
              <StarBorderButton size="lg" variant="secondary" onClick={() => navigate('/auth')}>
                <span>Connect Wallet</span>
                <Link2 size={16} />
              </StarBorderButton>
            )}
          </div>

          {isAuthenticated && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-sm text-slate-400"
            >
              Welcome back,{' '}
              <span className="text-purple-400 font-medium">{user.name}</span>
              {' '}—{' '}
              <span className="text-emerald-400">{user.credits.toLocaleString()} credits</span> available
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full mx-auto"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="glass-card p-4 text-center"
            >
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="px-6 pb-28 max-w-5xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-bold text-slate-200 mb-10"
        >
          Platform Capabilities
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-5"
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <Icon size={18} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
