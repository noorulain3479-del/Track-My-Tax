export function getRiskBadge(risk: string) {
  switch (risk) {
    case 'LOW':      return 'badge-low';
    case 'MEDIUM':   return 'badge-medium';
    case 'HIGH':     return 'badge-high';
    case 'CRITICAL': return 'badge-critical';
    default:         return 'badge-low';
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'LOW':      return '#10B981';
    case 'MEDIUM':   return '#F59E0B';
    case 'HIGH':     return '#EF4444';
    case 'CRITICAL': return '#DC2626';
    default:         return '#10B981';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'OPTIMAL':    return '#10B981';
    case 'MONITORING': return '#F59E0B';
    case 'AT_RISK':    return '#EF4444';
    case 'FROZEN':     return '#DC2626';
    default:           return '#64748B';
  }
}

export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(v);
}

export function shortAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function simulateRiskPrediction(input: { fundingVelocity: number; projectAge: number; escrowUtilization: number; transactionCount: number }) {
  const { fundingVelocity, projectAge, escrowUtilization, transactionCount } = input;

  if (fundingVelocity < 1500 || fundingVelocity > 5000) {
    throw new Error(`Funding velocity ${fundingVelocity} exceeds operational boundary [1500–5000 credits/day].`);
  }

  const score =
    (fundingVelocity - 1500) / 3500 * 30 +
    Math.min(projectAge / 365, 1) * 25 +
    escrowUtilization * 30 +
    Math.min(transactionCount / 50, 1) * 15;

  if (score < 20)      return { risk_level: 'LOW' as const,      confidence: 0.85 + Math.random() * 0.12 };
  if (score < 45)      return { risk_level: 'MEDIUM' as const,   confidence: 0.75 + Math.random() * 0.15 };
  if (score < 70)      return { risk_level: 'HIGH' as const,     confidence: 0.70 + Math.random() * 0.18 };
  return               { risk_level: 'CRITICAL' as const,         confidence: 0.80 + Math.random() * 0.15 };
}

export function simulateVerification(projectType: string) {
  const classMap: Record<string, string> = {
    'SOL-001': 'Solar Panels',
    'FAN-001': 'Ceiling Fans',
    'LAB-001': 'Computers',
    'NET-001': 'Networking Equipment',
  };

  const targetClass = classMap[projectType] ?? 'Unknown Asset';
  const confidence = 0.75 + Math.random() * 0.22;
  const gpsPass = Math.random() > 0.25;
  const tsPass = Math.random() > 0.15;
  const verified = confidence > 0.85 && gpsPass;

  return {
    gps_status: gpsPass ? 'PASSED' : 'FAILED' as const,
    timestamp_status: tsPass ? 'PASSED' : 'FAILED' as const,
    mobilenet_status: targetClass,
    confidence,
    result: verified ? 'VERIFIED' : confidence > 0.6 ? 'UNDER_REVIEW' : 'REJECTED' as const,
    gpsCoords: { lat: 34.0131 + (Math.random() - 0.5) * 0.002, lng: 71.5785 + (Math.random() - 0.5) * 0.002 },
    expectedCoords: { lat: 34.0131, lng: 71.5785 },
    deltaSeconds: Math.floor(Math.random() * 300),
  };
}

export const MOCK_BLOCKCHAIN_ACCOUNTS = Array.from({ length: 6 }, (_, i) => ({
  address: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
  balance: Math.floor(50000 + Math.random() * 950000),
  index: i,
}));

export const CONTRACT_ADDRESS = '0x' + Array.from({ length: 40 }, () =>
  Math.floor(Math.random() * 16).toString(16)
).join('').toUpperCase();

export const GANACHE_BLOCK = Math.floor(4200 + Math.random() * 800);
