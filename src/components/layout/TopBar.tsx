import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Shield, GraduationCap, BookOpen, QrCode, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const roleIcons = { Admin: Shield, Faculty: BookOpen, Student: GraduationCap };
const roleColors = { Admin: '#EF4444', Faculty: '#F59E0B', Student: '#10B981' };

export default function TopBar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // FIXED: Replaced window.location.origin with your computer's local IP address
  const qrUrl = 'http://192.168.31.208:5173';
  
  const qrRef = useRef<HTMLDivElement>(null);

  const RoleIcon = user ? roleIcons[user.role] : User;
  const roleColor = user ? roleColors[user.role] : '#64748B';

  useEffect(() => {
    if (!showQR) return;
    function handleClick(e: MouseEvent) {
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) {
        setShowQR(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowQR(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showQR]);

  function copyUrl() {
    navigator.clipboard.writeText(qrUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(6,9,19,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(30,45,74,0.5)',
      }}
    >
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
            boxShadow: '0 0 16px rgba(139,92,246,0.4)',
          }}
        >
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <div>
          <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Track-My-Tax
          </span>
          <p className="text-[10px] text-slate-500 -mt-0.5">Infrastructure Governance</p>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* QR dropdown */}
        <div className="relative" ref={qrRef}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => { setShowQR(v => !v); setShowMenu(false); }}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
            style={{
              background: showQR ? 'rgba(139,92,246,0.2)' : 'rgba(13,21,38,0.7)',
              border: showQR ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(30,45,74,0.8)',
              boxShadow: showQR ? '0 0 10px rgba(139,92,246,0.25)' : 'none',
            }}
            title="Scan QR to open on phone"
          >
            <QrCode size={13} className={showQR ? 'text-purple-400' : 'text-slate-400'} />
          </motion.button>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  width: 200,
                  background: 'rgba(13,21,38,0.97)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  zIndex: 50,
                }}
              >
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), rgba(59,130,246,0.5))' }} />
                <div style={{ padding: '12px 12px 12px 12px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                    Scan to open on phone
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, padding: 12, marginBottom: 8, position: 'relative',
                    background: 'rgba(139,92,246,0.05)',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}>
                    <QRCodeSVG
                      value={qrUrl || 'https://example.com'}
                      size={140}
                      bgColor="transparent"
                      fgColor="#c4b5fd"
                      level="M"
                      style={{ borderRadius: 6 }}
                    />
                    <div style={{
                      position: 'absolute',
                      width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 6,
                      background: '#0D1526',
                      border: '1px solid rgba(139,92,246,0.5)',
                    }}>
                      <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 8 }}>T</span>
                    </div>
                  </div>
                  <button
                    onClick={copyUrl}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(30,45,74,0.8)',
                      background: 'rgba(6,9,19,0.8)', cursor: 'pointer',
                      fontSize: 10, fontFamily: 'monospace', color: '#64748b',
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {qrUrl}
                    </span>
                    {copied
                      ? <Check size={10} color="#34d399" />
                      : <Copy size={10} />}
                  </button>
                  {copied && (
                    <p style={{ fontSize: 10, color: '#34d399', marginTop: 6, textAlign: 'center' }}>Copied!</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu or Sign In */}
        {isAuthenticated && user ? (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => { setShowMenu(v => !v); setShowQR(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(13,21,38,0.8)', border: '1px solid rgba(30,45,74,0.8)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${roleColor}20`, border: `1px solid ${roleColor}40` }}
              >
                <RoleIcon size={12} style={{ color: roleColor }} />
              </div>
              <span className="text-xs text-slate-300 font-medium">{user.name}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: `${roleColor}15`, color: roleColor }}
              >
                {user.role}
              </span>
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
                  style={{
                    background: '#0D1526',
                    border: '1px solid #1E2D4A',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Wallet</p>
                    <p className="text-xs font-mono text-slate-300 truncate">{user.wallet_address}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Credits: <span className="text-emerald-400 font-medium">{user.credits.toLocaleString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={async () => { setShowMenu(false); await signOut(); navigate('/'); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="text-xs px-4 py-1.5 rounded-xl font-medium text-slate-300 hover:text-white transition-colors"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}