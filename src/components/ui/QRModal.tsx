import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QRModalProps {
  open: boolean;
  url: string;
  onClose: () => void;
}

export default function QRModal({ open, url, onClose }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(14px)', background: 'rgba(6,9,19,0.75)' }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden w-72"
            style={{
              background: 'rgba(13,21,38,0.9)',
              border: '1.5px solid rgba(139,92,246,0.5)',
              boxShadow: '0 0 0 1px rgba(139,92,246,0.15), 0 24px 64px rgba(0,0,0,0.7), 0 0 48px rgba(139,92,246,0.12)',
            }}
          >
            {/* Neon glow top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)' }}
            />

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Scan to Open</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Works with iOS · Android · WhatsApp Camera</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors -mt-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center px-5 pb-5">
              <div
                className="relative rounded-2xl p-4 mb-4 w-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  boxShadow: 'inset 0 0 24px rgba(139,92,246,0.04)',
                }}
              >
                <QRCodeSVG
                  value={url || window.location.origin}
                  size={192}
                  bgColor="transparent"
                  fgColor="#c4b5fd"
                  level="M"
                  style={{ borderRadius: 8 }}
                />
                {/* Center logo overlay */}
                <div
                  className="absolute flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    background: '#0D1526',
                    border: '1.5px solid rgba(139,92,246,0.6)',
                    boxShadow: '0 0 12px rgba(139,92,246,0.3)',
                  }}
                >
                  <span className="text-purple-400 font-bold text-xs">T</span>
                </div>
              </div>

              {/* URL copy row */}
              <button
                onClick={copy}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-all duration-200 group"
                style={{ background: 'rgba(13,21,38,0.9)', border: '1px solid rgba(30,45,74,0.9)' }}
                title={url}
              >
                <span className="flex-1 truncate text-left">{url || window.location.origin}</span>
                <span className="shrink-0 transition-colors">
                  {copied
                    ? <Check size={12} className="text-emerald-400" />
                    : <Copy size={12} className="group-hover:text-purple-400" />}
                </span>
              </button>

              {copied && (
                <p className="text-[10px] text-emerald-400 mt-2">Copied to clipboard!</p>
              )}
            </div>

            {/* Neon glow bottom edge */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
