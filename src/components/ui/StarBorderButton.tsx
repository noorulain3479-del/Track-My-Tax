import { motion } from 'framer-motion';
import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface StarBorderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:   'text-white hover:text-white',
  secondary: 'text-slate-300 hover:text-white',
  danger:    'text-red-400 hover:text-red-300',
  success:   'text-emerald-400 hover:text-emerald-300',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm font-medium',
  lg: 'px-8 py-4 text-base font-semibold',
};

export default function StarBorderButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: StarBorderButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`star-border-btn inline-flex items-center justify-center gap-2 transition-all duration-200
        ${sizeStyles[size]} ${variantStyles[variant]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      <span className="relative flex items-center justify-center gap-2" style={{ zIndex: 2 }}>
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Processing...
          </>
        ) : children}
      </span>
    </motion.button>
  );
}
