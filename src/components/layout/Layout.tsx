import { type ReactNode } from 'react';
import ParticleCanvas from '../canvas/ParticleCanvas';
import TopBar from './TopBar';
import Dock from './Dock';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: '#060913' }}>
      <ParticleCanvas />
      <div className="relative z-10">
        <TopBar />
        <main className="pt-16 pb-28 min-h-screen">
          {children}
        </main>
        <Dock />
      </div>
    </div>
  );
}
