import { BrowserRouter, Routes, Route } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import HomeSplash from './views/HomeSplash';
import ProjectsMatrix from './views/ProjectsMatrix';
import ProjectDetails from './views/ProjectDetails';
import VerificationDesk from './views/VerificationDesk';
import AnalyticsCenter from './views/AnalyticsCenter';
import BlockchainMonitor from './views/BlockchainMonitor';
import AdminControlRoom from './views/AdminControlRoom';
import AuthView from './views/AuthView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/"                   element={<HomeSplash />} />
            <Route path="/projects"           element={<ProjectsMatrix />} />
            <Route path="/projects/:id"       element={<ProjectDetails />} />
            <Route path="/verification-desk"  element={<VerificationDesk />} />
            <Route path="/analytics"          element={<AnalyticsCenter />} />
            <Route path="/blockchain-logs"    element={<BlockchainMonitor />} />
            <Route path="/admin-panel"        element={<AdminControlRoom />} />
            <Route path="/auth"               element={<AuthView />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
