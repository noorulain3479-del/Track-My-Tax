const mockProjects: Record<string, any> = {
  'SOL-001': {
    id: 1,
    project_id: 'SOL-001',
    title: 'Solar Panel Installation',
    description: 'Installation of solar panels at Electrical Engineering Department, UET',
    location: 'EE Dept, UET Peshawar',
    lat: 34.008,
    lng: 71.428,
    expected_label: 'solar_cell',
    budget: 5000.00,
    escrow: 2500.00,
    progress: 60,
    risk_level: 'LOW',
    status: 'OPTIMAL',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  'FAN-001': {
    id: 2,
    project_id: 'FAN-001',
    title: 'Ceiling Fan Distribution',
    description: 'Distribution and installation of energy-efficient ceiling fans in New Academic Block, UET',
    location: 'New Academic Block, UET Peshawar',
    lat: 34.0017,
    lng: 71.4854,
    expected_label: 'electric_fan',
    budget: 3000.00,
    escrow: 1500.00,
    progress: 45,
    risk_level: 'MEDIUM',
    status: 'OPTIMAL',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  'LAB-001': {
    id: 3,
    project_id: 'LAB-001',
    title: 'Lab Equipment Setup',
    description: 'Setup of computer lab with 50 workstations in New Academic Block, UET',
    location: 'New Academic Block, UET Peshawar',
    lat: 34.0017,
    lng: 71.4854,
    expected_label: 'desktop_computer',
    budget: 8000.00,
    escrow: 4000.00,
    progress: 30,
    risk_level: 'HIGH',
    status: 'LOCKED',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  'NET-001': {
    id: 4,
    project_id: 'NET-001',
    title: 'Network Infrastructure',
    description: 'Deployment of fiber-optic network infrastructure in New Academic Block, UET',
    location: 'New Academic Block, UET Peshawar',
    lat: 34.0017,
    lng: 71.4854,
    expected_label: 'modem',
    budget: 12000.00,
    escrow: 6000.00,
    progress: 75,
    risk_level: 'LOW',
    status: 'OPTIMAL',
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
};

const mockTransactions: Record<string, any[]> = {
  'SOL-001': [
    { id: 1, wallet_address: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', project_id: 'SOL-001', amount: 2500.00, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
  ],
  'FAN-001': [
    { id: 2, wallet_address: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', project_id: 'FAN-001', amount: 1500.00, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  ],
  'LAB-001': [
    { id: 3, wallet_address: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', project_id: 'LAB-001', amount: 4000.00, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 4, wallet_address: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', project_id: 'LAB-001', amount: 4000.00, type: 'LOCK', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  ],
  'NET-001': [
    { id: 5, wallet_address: '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1', project_id: 'NET-001', amount: 6000.00, type: 'ALLOCATE', timestamp: new Date(Date.now() - 86400000 * 15).toISOString() },
  ],
};

const mockPredictions: Record<string, any[]> = {
  'SOL-001': [
    { id: 1, project_id: 'SOL-001', risk_level: 'LOW', confidence: 0.95, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  'FAN-001': [
    { id: 2, project_id: 'FAN-001', risk_level: 'MEDIUM', confidence: 0.82, created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  ],
  'LAB-001': [
    { id: 3, project_id: 'LAB-001', risk_level: 'HIGH', confidence: 0.78, created_at: new Date().toISOString() },
  ],
  'NET-001': [
    { id: 4, project_id: 'NET-001', risk_level: 'LOW', confidence: 0.91, created_at: new Date().toISOString() },
  ],
};

const mockVerifications: Record<string, any[]> = {
  'SOL-001': [
    { id: 1, project_id: 'SOL-001', gps_status: 'PASSED', timestamp_status: 'PASSED', mobilenet_status: 'solar_cell', confidence: 0.92, result: 'VERIFIED', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  ],
  'FAN-001': [
    { id: 2, project_id: 'FAN-001', gps_status: 'PASSED', timestamp_status: 'PASSED', mobilenet_status: 'electric_fan', confidence: 0.88, result: 'VERIFIED', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ],
  'LAB-001': [
    { id: 3, project_id: 'LAB-001', gps_status: 'FAILED', timestamp_status: 'PASSED', mobilenet_status: 'desktop_computer', confidence: 0.65, result: 'REJECTED', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  ],
  'NET-001': [],
};

export function getMockProject(id: string) {
  return mockProjects[id] || null;
}

export function getMockTransactions(id: string) {
  return mockTransactions[id] || [];
}

export function getMockPredictions(id: string) {
  return mockPredictions[id] || [];
}

export function getMockVerifications(id: string) {
  return mockVerifications[id] || [];
}
