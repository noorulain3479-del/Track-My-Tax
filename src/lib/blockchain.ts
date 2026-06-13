const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';

interface EscrowResponse {
  success: boolean;
  amount?: number;
  lockedAmount?: number;
  releasedAmount?: number;
  frozenAmount?: number;
  reason?: string;
  error?: string;
}

interface BalanceResponse {
  balance: number;
  error?: string;
}

interface RiskPredictionResponse {
  projectId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  features: {
    fundingVelocity: number;
    projectAge: number;
    escrowUtilization: number;
    transactionCount: number;
  };
  modelVersion: string;
  timestamp: string;
  error?: string;
}

interface VerificationResponse {
  projectId: string;
  verificationId: number;
  exif: {
    gps: { lat: number; lng: number };
    timestamp: string;
  } | null;
  checks: {
    gps: { status: string; distanceMeters: number | null; threshold: number };
    timestamp: { status: string; driftSeconds: number | null; thresholdSeconds: number };
    classification: { label: string; confidence: number; threshold: number };
  };
  result: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
  timestamp: string;
  error?: string;
}

export const blockchain = {
  async getWalletAddress(): Promise<string | null> {
    const mockWallets: Record<string, string> = {
      'admin@tax.local': '0xA1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1',
      'faculty@tax.local': '0xB2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2',
      'student@tax.local': '0xC3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3',
    };
    const currentUser = localStorage.getItem('currentUser') || 'student@tax.local';
    return mockWallets[currentUser] || '0xC3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3';
  },

  async getBalance(walletAddress: string): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/escrow/balance/${walletAddress}`);
      const data: BalanceResponse = await response.json();
      return data.balance ?? 0;
    } catch {
      return 0;
    }
  },

  async getProjectFunding(projectId: string): Promise<{ budget: number; escrow: number; lat: number; lng: number; expectedLabel: string }> {
    try {
      const response = await fetch(`${API_URL}/escrow/project/${projectId}`);
      const data: any = await response.json();
      return { budget: data.budget ?? 0, escrow: data.escrow ?? 0, lat: data.lat ?? 0, lng: data.lng ?? 0, expectedLabel: data.expectedLabel ?? '' };
    } catch {
      return { budget: 0, escrow: 0, lat: 0, lng: 0, expectedLabel: '' };
    }
  },

  async allocateCredits(projectId: string, amount: number, walletAddress: string): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${API_URL}/escrow/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, amount, walletAddress }),
      });
      return await response.json();
    } catch {
      return { success: true, amount };
    }
  },

  async lockEscrow(projectId: string, walletAddress?: string): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${API_URL}/escrow/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, walletAddress: walletAddress ?? 'SYSTEM' }),
      });
      return await response.json();
    } catch {
      return { success: true };
    }
  },

  async releaseEscrow(projectId: string, walletAddress?: string): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${API_URL}/escrow/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, walletAddress: walletAddress ?? 'SYSTEM' }),
      });
      return await response.json();
    } catch {
      return { success: true };
    }
  },

  async freezeEscrow(projectId: string, reason: string, walletAddress?: string): Promise<EscrowResponse> {
    try {
      const response = await fetch(`${API_URL}/escrow/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, reason, walletAddress: walletAddress ?? 'SYSTEM' }),
      });
      return await response.json();
    } catch {
      return { success: true };
    }
  },

  isConnected(): boolean {
    return true;
  },
};

export const ml = {
  async predictRisk(
    projectId: string,
    features: {
      fundingVelocity: number;
      projectAge: number;
      escrowUtilization: number;
      transactionCount: number;
    }
  ): Promise<RiskPredictionResponse> {
    try {
      const response = await fetch(`${API_URL}/risk-prediction/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, features }),
      });
      return await response.json();
    } catch {
      const { simulateRiskPrediction } = await import('./utils');
      const result = simulateRiskPrediction(features);
      return {
        projectId,
        riskLevel: result.risk_level,
        confidence: result.confidence,
        features,
        modelVersion: 'mock-v1',
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getPredictionHistory(projectId?: string): Promise<{ predictions: unknown[] }> {
    try {
      const url = projectId
        ? `${API_URL}/risk-prediction/history?projectId=${projectId}`
        : `${API_URL}/risk-prediction/history`;
      const response = await fetch(url);
      return await response.json();
    } catch {
      return { predictions: [] };
    }
  },
};

export const verification = {
  async analyzeImage(
    projectId: string,
    _imageData: string,
    _evidenceGps?: { lat: number; lng: number }
  ): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${API_URL}/verification/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, imageData: _imageData, evidenceGps: _evidenceGps }),
      });
      return await response.json();
    } catch {
      const { simulateVerification } = await import('./utils');
      const sim = simulateVerification(projectId);
      return {
        projectId,
        verificationId: Date.now(),
        exif: {
          gps: sim.gpsCoords,
          timestamp: new Date(Date.now() - sim.deltaSeconds * 1000).toISOString(),
        },
        checks: {
          gps: { status: sim.gps_status, distanceMeters: Math.random() * 300, threshold: 500 },
          timestamp: { status: sim.timestamp_status, driftSeconds: sim.deltaSeconds, thresholdSeconds: 604800 },
          classification: { label: sim.mobilenet_status, confidence: sim.confidence, threshold: 0.85 },
        },
        result: sim.result as 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW',
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getResults(projectId?: string): Promise<{ verifications: unknown[] }> {
    try {
      const url = projectId
        ? `${API_URL}/verification/results?projectId=${projectId}`
        : `${API_URL}/verification/results`;
      const response = await fetch(url);
      return await response.json();
    } catch {
      return { verifications: [] };
    }
  },
};

export const notifications = {
  async send(
    _userId: string,
    _type: string,
    _projectId: string,
    _message: string,
    _metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: _userId, type: _type, projectId: _projectId, message: _message, metadata: _metadata }),
      });
      return await response.json();
    } catch {
      return { success: true };
    }
  },

  async broadcastProject(
    _projectId: string,
    _type: string,
    _message: string,
    _metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/notifications/broadcast/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: _projectId, type: _type, message: _message, metadata: _metadata }),
      });
      return await response.json();
    } catch {
      return { success: true };
    }
  },
};

export const contract = {
  address: '0x0000000000000000000000000000000000000000',
  abi: [],

  async connectMetamask(): Promise<string | null> {
    if (typeof window !== 'undefined' && 'ethereum' in window) {
      try {
        const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
        return accounts[0] ?? null;
      } catch {
        return null;
      }
    }
    return null;
  },

  isMetamaskInstalled(): boolean {
    return typeof window !== 'undefined' && 'ethereum' in window;
  },
};
