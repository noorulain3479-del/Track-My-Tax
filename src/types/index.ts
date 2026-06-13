export interface User {
  id: number;
  name: string;
  email: string;
  wallet_address: string;
  role: 'Student' | 'Faculty' | 'Admin';
  credits: number;
  created_at: string;
}

export interface Project {
  id?: number;
  project_id: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  expected_label: string;
  budget: number;
  escrow: number;
  progress: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  wallet_address: string;
  project_id: string;
  amount: number;
  type: 'MINT' | 'ALLOCATE' | 'LOCK' | 'RELEASE' | 'FREEZE';
  timestamp: string;
}

export interface Verification {
  id: number;
  project_id: string;
  gps_status: 'PASSED' | 'FAILED' | 'PENDING';
  timestamp_status: 'PASSED' | 'FAILED' | 'PENDING';
  mobilenet_status: string;
  confidence: number;
  result: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
  image_path?: string;
  created_at: string;
}

export interface Prediction {
  id: number;
  project_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface BlockchainAccount {
  address: string;
  balance: number;
  index: number;
}

export interface BlockchainLog {
  id: string;
  blockNumber: number;
  txHash: string;
  method: string;
  projectId?: string;
  amount?: number;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface RiskPredictionInput {
  fundingVelocity: number;
  projectAge: number;
  escrowUtilization: number;
  transactionCount: number;
}
