import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, AuthState } from '../types';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:5000/api';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string, role: User['role']) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FALLBACK_USERS: Record<string, { name: string; role: User['role']; walletAddress: string; credits: number }> = {
  'admin@tax.local': { name: 'Admin User', role: 'Admin', walletAddress: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', credits: 1000000 },
  'faculty@tax.local': { name: 'Faculty Reviewer', role: 'Faculty', walletAddress: '0xB2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2', credits: 50000 },
  'student@tax.local': { name: 'Student User', role: 'Student', walletAddress: '0xC3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3', credits: 10000 },
};

const FALLBACK_PASSWORDS: Record<string, string> = {
  'admin@tax.local': 'admin123',
};

function userFromStoredJSON(raw: string | null): User | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    const stored = userFromStoredJSON(localStorage.getItem('tmtUser'));
    if (stored) {
      setState({ user: stored, isAuthenticated: true, isLoading: false });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      const user: User = data.user;
      localStorage.setItem('tmtUser', JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return { error: null };
    } catch {
      const fb = FALLBACK_USERS[email];
      if (!fb) return { error: 'Invalid credentials' };
      const expectedPw = FALLBACK_PASSWORDS[email];
      if (expectedPw && password !== expectedPw) return { error: 'Invalid credentials' };
      const user: User = {
        id: Object.keys(FALLBACK_USERS).indexOf(email),
        email,
        name: fb.name,
        wallet_address: fb.walletAddress,
        role: fb.role,
        credits: fb.credits,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('tmtUser', JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return { error: null };
    }
  }

  async function signOut() {
    localStorage.removeItem('tmtUser');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }

  async function signUp(name: string, email: string, password: string, role: User['role']): Promise<{ error: string | null }> {
    try {
      const wallet = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, wallet_address: wallet }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Registration failed' };
      const user: User = data.user;
      localStorage.setItem('tmtUser', JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return { error: null };
    } catch {
      if (FALLBACK_USERS[email]) return { error: 'Email already registered' };
      const wallet = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();
      const user: User = {
        id: Date.now(),
        email,
        name,
        wallet_address: wallet,
        role,
        credits: role === 'Faculty' ? 50000 : 10000,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('tmtUser', JSON.stringify(user));
      setState({ user, isAuthenticated: true, isLoading: false });
      return { error: null };
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
