import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  glowColor?: string;
  onClick?: () => void;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto ${className}`}>
      {children}
    </div>
  );
}

export function BentoCard({ children, className = '', span = 1, rowSpan = 1, glowColor, onClick }: BentoCardProps) {
  const colClass = span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : '';
  const rowClass = rowSpan === 2 ? 'row-span-2' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={onClick ? { y: -3 } : undefined}
      className={`glass-card p-5 relative overflow-hidden transition-all duration-300
        ${colClass} ${rowClass}
        ${onClick ? 'cursor-pointer hover:border-purple-500/40' : ''}
        ${className}`}
      style={glowColor ? { borderColor: `${glowColor}30` } : undefined}
      onClick={onClick}
    >
      {glowColor && (
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: glowColor }}
        />
      )}
      {children}
    </motion.div>
  );
}
