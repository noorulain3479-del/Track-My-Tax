import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link2, Cpu, Hash, Wallet, RefreshCw, Activity, Wifi, WifiOff } from 'lucide-react';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { shortAddress, formatCurrency, formatDate } from '../lib/utils';

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';

interface ChainLog {
  id: string;
  blockNumber: number;
  txHash: string;
  method: string;
  projectId: string;
  amount: number;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

interface GanacheAccount {
  address: string;
  balance: number;
  index: number;
}

const METHOD_COLORS: Record<string, string> = {
  mintCredits:    '#10B981',
  allocateCredits:'#8B5CF6',
  ALLOCATE:       '#8B5CF6',
  lockEscrow:     '#3B82F6',
  LOCK:           '#3B82F6',
  releaseEscrow:  '#06B6D4',
  RELEASE:        '#06B6D4',
  freezeEscrow:   '#EF4444',
  FREEZE:         '#EF4444',
  MINT:           '#10B981',
};

const METHOD_LABELS: Record<string, string> = {
  ALLOCATE: 'allocateCredits()',
  LOCK:     'lockEscrow()',
  RELEASE:  'releaseEscrow()',
  FREEZE:   'freezeEscrow()',
  MINT:     'mintCredits()',
};

export default function BlockchainMonitor() {
  const [accounts, setAccounts]       = useState<GanacheAccount[]>([]);
  const [chainLogs, setChainLogs]     = useState<ChainLog[]>([]);
  const [blockNumber, setBlockNumber] = useState(0);
  const [connected, setConnected]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [minting, setMinting]         = useState(false);
  const [mintAddr, setMintAddr]       = useState('');
  const [mintAmt, setMintAmt]         = useState(10000);
  const [mintMsg, setMintMsg]         = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, logRes] = await Promise.all([
        fetch(`${API}/blockchain/accounts`),
        fetch(`${API}/blockchain/logs`),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts ?? []);
        setConnected(accData.connected ?? false);
        if (accData.accounts?.length > 0 && !mintAddr) {
          setMintAddr(accData.accounts[0].address);
        }
      }

      if (logRes.ok) {
        const logData = await logRes.json();
        setBlockNumber(logData.blockNumber ?? 0);
        setChainLogs(logData.logs ?? []);
        setConnected(prev => prev || logData.connected);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [mintAddr]);

  useEffect(() => {
    load();
    // Auto-refresh every 5 s — picks up new MySQL transactions in real time
    timerRef.current = setInterval(() => {
      fetch(`${API}/blockchain/logs`)
        .then(r => r.json())
        .then(d => {
          if (d.blockNumber) setBlockNumber(d.blockNumber);
          if (d.logs)        setChainLogs(d.logs);
          if ('connected' in d) setConnected(d.connected);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  async function handleMint() {
    if (!mintAddr || mintAmt <= 0) return;
    setMinting(true);
    setMintMsg('');
    try {
      const res = await fetch(`${API}/blockchain/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: mintAddr, amount: mintAmt }),
      });
      const data = await res.json();
      if (data.success) {
        setMintMsg(`✅ Minted ${mintAmt.toLocaleString()} CC → ${shortAddress(mintAddr)}`);
        await load();
      } else {
        setMintMsg(`❌ ${data.error ?? 'Mint failed'}`);
      }
    } catch {
      setMintMsg('❌ Flask not reachable — start the backend first');
    }
    setMinting(false);
    setTimeout(() => setMintMsg(''), 4000);
  }

  const color = (method: string) => METHOD_COLORS[method] ?? '#64748B';
  const label = (method: string) => METHOD_LABELS[method] ?? method;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <Link2 size={20} className="text-blue-400" />
            <GradientText as="h1" className="text-3xl font-bold">Blockchain Node Monitor</GradientText>
          </div>
          <div className="flex items-center gap-2">
            {connected
              ? <><Wifi size={13} className="text-emerald-400" /><span className="text-xs text-emerald-400 font-medium">Ganache Live</span></>
              : <><WifiOff size={13} className="text-slate-500" /><span className="text-xs text-slate-500">MySQL only</span></>
            }
          </div>
        </div>
        <p className="text-slate-500 text-sm">
          {connected
            ? 'Live data from your local Ganache node — CitizenCredits.sol contract state and call history'
            : 'Flask not connected — showing MySQL transaction history. Start Flask + Ganache to see live chain data.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Activity, label: 'Current Block',     value: blockNumber ? `#${blockNumber.toLocaleString()}` : '—', color: '#10B981' },
          { icon: Cpu,      label: 'Network',            value: connected ? 'Ganache :7545' : 'MySQL only',            color: connected ? '#10B981' : '#64748B' },
          { icon: Hash,     label: 'Total Transactions', value: chainLogs.length.toString(),                           color: '#3B82F6' },
          { icon: Wallet,   label: 'Ganache Accounts',   value: accounts.length ? `${accounts.length} loaded` : '—',  color: '#06B6D4' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} style={{ color: m.color }} />
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
              <p className="font-mono font-bold text-sm" style={{ color: m.color }}>{m.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          {/* Ganache accounts */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Wallet size={14} className="text-purple-400" />
              Ganache Accounts
              {connected && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>}
            </h3>
            {accounts.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Start Ganache + Flask to load accounts</p>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc, i) => (
                  <div key={acc.address} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                    <div>
                      <span className="text-[10px] text-slate-600">Account {acc.index ?? i}</span>
                      <p className="text-xs font-mono text-slate-300">{shortAddress(acc.address)}</p>
                    </div>
                    <p className="text-xs font-semibold text-emerald-400">{acc.balance.toFixed(2)} ETH</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Mint credits */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-emerald-400" />
              mintCredits()
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Target Address</label>
                {accounts.length > 0 ? (
                  <select value={mintAddr} onChange={e => setMintAddr(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    style={{ background: '#0D1526', border: '1px solid #1E2D4A' }}>
                    {accounts.map((a, i) => (
                      <option key={a.address} value={a.address}>
                        Account {i} — {shortAddress(a.address)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={mintAddr} onChange={e => setMintAddr(e.target.value)}
                    placeholder="0x... (start Flask to auto-populate)"
                    className="w-full rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                    style={{ background: '#0D1526', border: '1px solid #1E2D4A' }} />
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Amount (CitizenCredits)</label>
                <input type="number" value={mintAmt} onChange={e => setMintAmt(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  style={{ background: '#0D1526', border: '1px solid #1E2D4A' }} />
              </div>
            </div>

            {mintMsg && (
              <p className="text-xs mb-3 text-center" style={{ color: mintMsg.startsWith('✅') ? '#10B981' : '#EF4444' }}>
                {mintMsg}
              </p>
            )}

            <StarBorderButton size="sm" loading={minting} onClick={handleMint} className="w-full justify-center" variant="success">
              Execute mintCredits()
            </StarBorderButton>

            <div className="mt-3 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
              <strong className="text-emerald-400/80">What this does:</strong> Calls <code>mintCredits(address, amount)</code> on CitizenCredits.sol → saves to MySQL → auto-refreshes feed below every 5 s.
            </div>
          </motion.div>
        </div>

        {/* Live transaction feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Hash size={14} className="text-blue-400" />
              Contract Call History
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                LIVE · 5 s
              </span>
            </h3>
            <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Refresh now">
              <RefreshCw size={13} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chainLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Hash size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Allocate credits or verify a project to see contract calls appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-600 border-b border-slate-800">
                    <th className="text-left py-2 pr-3">Block</th>
                    <th className="text-left py-2 pr-3">Method</th>
                    <th className="text-left py-2 pr-3">Project</th>
                    <th className="text-left py-2 pr-3">Amount</th>
                    <th className="text-left py-2 pr-3">Tx Hash</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {chainLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-800/30 hover:bg-white/2 transition-colors">
                      <td className="py-2 pr-3 font-mono text-slate-400">#{log.blockNumber}</td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{ background: `${color(log.method)}18`, color: color(log.method) }}>
                          {label(log.method)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-slate-400">{log.projectId || '—'}</td>
                      <td className="py-2 pr-3 text-slate-300">{log.amount > 0 ? formatCurrency(log.amount) : '—'}</td>
                      <td className="py-2 pr-3 font-mono text-slate-600 text-[10px]">{log.txHash ? log.txHash.slice(0, 14) + '…' : '—'}</td>
                      <td className="py-2 text-slate-600">{log.timestamp ? formatDate(log.timestamp) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-800/50">
            {Object.entries(METHOD_LABELS).map(([key, lbl]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color(key) }} />
                <span className="text-[10px] font-mono text-slate-600">{lbl}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
