import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Shield, BarChart3, Link, Settings, Search } from 'lucide-react';

const navItems = [
  { path: '/',                 icon: Home,         label: 'Home' },
  { path: '/projects',         icon: LayoutGrid,   label: 'Projects' },
  { path: '/verification-desk',icon: Search,       label: 'Verify' },
  { path: '/analytics',        icon: BarChart3,    label: 'Analytics' },
  { path: '/blockchain-logs',  icon: Link,         label: 'Chain' },
  { path: '/admin-panel',      icon: Settings,     label: 'Admin' },
];

export default function Dock() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{
          background: 'rgba(13,21,38,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(30,45,74,0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(139,92,246,0.3)',
        }}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200"
              style={{
                background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
                boxShadow: active ? '0 0 16px rgba(139,92,246,0.25)' : 'none',
              }}
              title={item.label}
            >
              <Icon
                size={20}
                className="transition-colors duration-200"
                style={{ color: active ? '#8B5CF6' : '#64748B' }}
              />
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? '#8B5CF6' : '#475569' }}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
