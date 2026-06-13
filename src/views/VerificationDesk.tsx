import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, MapPin, Clock, Cpu, CheckCircle, XCircle, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import GradientText from '../components/ui/GradientText';
import StarBorderButton from '../components/ui/StarBorderButton';
import { verification, blockchain, notifications } from '../lib/blockchain';

const PROJECT_GPS: Record<string, { lat: number; lng: number; expectedLabel: string }> = {
  'SOL-001': { lat: 34.008, lng: 71.428, expectedLabel: 'solar_cell' },
  'FAN-001': { lat: 34.0017, lng: 71.4854, expectedLabel: 'electric_fan' },
  'LAB-001': { lat: 34.0017, lng: 71.4854, expectedLabel: 'desktop_computer' },
  'NET-001': { lat: 34.0017, lng: 71.4854, expectedLabel: 'modem' },
};

const mockStorage = {
  validateFile(file: File): { valid: boolean; error: string | null } {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) return { valid: false, error: 'Invalid file type. JPEG/PNG/WebP required.' };
    if (file.size > 10 * 1024 * 1024) return { valid: false, error: 'File too large (max 10MB).' };
    return { valid: true, error: null };
  },
  async uploadEvidence(
    projectId: string,
    file: File,
    onProgress: (p: number) => void
  ): Promise<{ success: boolean; path: string; publicUrl: string; error: string | null }> {
    for (let i = 0; i <= 100; i += 20) {
      onProgress(i);
      await new Promise(r => setTimeout(r, 80));
    }
    return {
      success: true,
      path: `evidence/${projectId}/${file.name}`,
      publicUrl: URL.createObjectURL(file),
      error: null,
    };
  },
};

interface LogLine {
  id: number;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' | 'CHAIN';
  msg: string;
}

interface VerificationResult {
  gps_status: string;
  timestamp_status: string;
  mobilenet_status: string;
  confidence: number;
  result: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
  exif: { gps: { lat: number; lng: number }; timestamp: string } | null;
  checks: {
    gps: { status: string; distanceMeters: number | null; threshold: number };
    timestamp: { status: string; driftSeconds: number | null; thresholdSeconds: number };
    classification: { label: string; confidence: number; threshold: number };
  };
}

let logSeq = 0;
function mkLog(type: LogLine['type'], msg: string): LogLine {
  return { id: logSeq++, time: new Date().toLocaleTimeString('en-US', { hour12: false }), type, msg };
}

const PROJECTS = ['SOL-001', 'FAN-001', 'LAB-001', 'NET-001'];

export default function VerificationDesk() {
  const [searchParams] = useSearchParams();
  const initProject = searchParams.get('project') ?? 'SOL-001';

  const [selectedProject, setSelectedProject] = useState(initProject);
  const [logs, setLogs] = useState<LogLine[]>([mkLog('INFO', 'Forensic engine ready. Awaiting image upload.')]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  function addLog(type: LogLine['type'], msg: string) {
    setLogs(prev => [...prev, mkLog(type, msg)]);
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function runPipeline() {
    if (!selectedFile) {
      addLog('ERROR', 'No image file selected. Upload evidence first.');
      return;
    }

    setRunning(true);
    setResult(null);
    setLogs([]);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    addLog('INFO', `[INIT] Starting forensic pipeline for project: ${selectedProject}`);
    await delay(300);

    addLog('INFO', '[UPLOAD] Validating file format...');
    const validation = mockStorage.validateFile(selectedFile);
    if (!validation.valid) {
      addLog('ERROR', `[UPLOAD] ${validation.error}`);
      setRunning(false);
      return;
    }
    addLog('SUCCESS', `[UPLOAD] File validated: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)}KB)`);

    await delay(400);
    addLog('INFO', '[STORAGE] Uploading evidence to secure storage...');
    setUploadProgress(0);

    const uploadResult = await mockStorage.uploadEvidence(
      selectedProject,
      selectedFile,
      (progress) => setUploadProgress(progress)
    );

    if (!uploadResult.success) {
      addLog('ERROR', `[STORAGE] Upload failed: ${uploadResult.error}`);
      setRunning(false);
      return;
    }
    addLog('SUCCESS', `[STORAGE] Evidence uploaded: ${uploadResult.path}`);
    addLog('INFO', `[STORAGE] Public URL: ${uploadResult.publicUrl}`);

    await delay(300);
    addLog('INFO', '[AI] Sending to verification Edge Function...');

    const imageData = await fileToBase64(selectedFile);

    const analysisResult = await verification.analyzeImage(selectedProject, imageData, {
      lat: PROJECT_GPS[selectedProject]?.lat ?? 0,
      lng: PROJECT_GPS[selectedProject]?.lng ?? 0,
    });

    if (analysisResult.error) {
      addLog('ERROR', `[AI] Analysis failed: ${analysisResult.error}`);
      setRunning(false);
      return;
    }

    addLog('SUCCESS', '[AI] Verification analysis complete');

    if (analysisResult.exif) {
      addLog('INFO', `[EXIF] Extracted GPS: ${analysisResult.exif.gps.lat.toFixed(6)}°, ${analysisResult.exif.gps.lng.toFixed(6)}°`);
      addLog('INFO', `[EXIF] Capture timestamp: ${analysisResult.exif.timestamp}`);
    } else {
      addLog('WARN', '[EXIF] No EXIF metadata found in image');
    }

    await delay(400);
    const gpsCheck = analysisResult.checks.gps;
    addLog(gpsCheck.status === 'PASSED' ? 'SUCCESS' : 'WARN',
      `[GPS] Spatial validation: ${gpsCheck.distanceMeters?.toFixed(1) ?? 'N/A'}m delta — ${gpsCheck.status}`);

    await delay(300);
    const tsCheck = analysisResult.checks.timestamp;
    addLog(tsCheck.status === 'PASSED' ? 'SUCCESS' : 'WARN',
      `[TIMESTAMP] Clock validation: ${tsCheck.driftSeconds?.toFixed(0) ?? 'N/A'}s drift — ${tsCheck.status}`);

    await delay(400);
    const classification = analysisResult.checks.classification;
    addLog('INFO', `[MOBILENET] Image classification: "${classification.label}"`);
    addLog(classification.confidence >= classification.threshold ? 'SUCCESS' : 'WARN',
      `[MOBILENET] Confidence: ${(classification.confidence * 100).toFixed(1)}% (threshold: ${(classification.threshold * 100).toFixed(0)}%)`);

    setResult({
      gps_status: gpsCheck.status,
      timestamp_status: tsCheck.status,
      mobilenet_status: classification.label,
      confidence: classification.confidence,
      result: analysisResult.result,
      exif: analysisResult.exif,
      checks: analysisResult.checks,
    });

    if (analysisResult.result === 'VERIFIED') {
      addLog('CHAIN', '[CONTRACT] Verification passed. Initiating releaseEscrow()...');
      await blockchain.releaseEscrow(selectedProject);
      addLog('SUCCESS', '[CONTRACT] Escrow released successfully.');
      await notifications.broadcastProject(selectedProject, 'VERIFICATION_COMPLETE', `Project ${selectedProject} evidence verified and escrow released.`);
    } else if (analysisResult.result === 'REJECTED') {
      addLog('ERROR', '[CONTRACT] Verification failed. Initiating freezeEscrow()...');
      await blockchain.freezeEscrow(selectedProject, 'Evidence verification failed');
      addLog('WARN', '[CONTRACT] Escrow frozen pending review.');
      await notifications.broadcastProject(selectedProject, 'ESCROW_FROZEN', `Project ${selectedProject} escrow frozen due to verification failure.`);
    } else {
      addLog('WARN', '[SYSTEM] Result: UNDER_REVIEW. Manual audit required.');
      await notifications.broadcastProject(selectedProject, 'RISK_ALERT', `Project ${selectedProject} flagged for manual review.`);
    }

    addLog(analysisResult.result === 'VERIFIED' ? 'SUCCESS' : analysisResult.result === 'REJECTED' ? 'ERROR' : 'WARN',
      `[RESULT] Final verdict: ${analysisResult.result}`);

    setRunning(false);
    setUploadProgress(0);
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const logColors: Record<string, string> = {
    INFO: '#94A3B8', SUCCESS: '#34D399', ERROR: '#F87171', WARN: '#FBBF24', CHAIN: '#A78BFA'
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Microscope size={20} className="text-purple-400" />
          <GradientText as="h1" className="text-3xl font-bold">Verification Desk</GradientText>
        </div>
        <p className="text-slate-500 text-sm">Digital forensics pipeline — EXIF analysis, Edge Function ML verification, GPS spatial validation</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Pipeline Configuration</h3>

            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1.5 block">Target Project</label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-purple-500/50"
                style={{ background: '#0D1526', border: '1px solid #1E2D4A' }}
              >
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file);
                  setPreviewUrl(URL.createObjectURL(file));
                }
              }}
              onClick={() => document.getElementById('vdesk-input')?.click()}
              className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 mb-4"
              style={{
                borderColor: dragActive ? '#8B5CF6' : selectedFile ? '#10B981' : 'rgba(30,45,74,0.8)',
                background: dragActive ? 'rgba(139,92,246,0.05)' : selectedFile ? 'rgba(16,185,129,0.05)' : 'transparent',
              }}
            >
              <input
                id="vdesk-input"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                  <p className="text-xs text-emerald-400 font-medium">{selectedFile?.name}</p>
                </div>
              ) : (
                <>
                  <Upload size={22} className="mx-auto mb-2 text-slate-600" />
                  <p className="text-xs text-slate-400">Drop field evidence image</p>
                  <p className="text-[10px] text-slate-600 mt-1">JPEG/PNG with GPS EXIF metadata</p>
                </>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <StarBorderButton
              size="md"
              loading={running}
              onClick={runPipeline}
              className="w-full justify-center"
            >
              <Cpu size={14} />
              {running ? 'Processing...' : 'Execute Pipeline'}
            </StarBorderButton>
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-5"
                style={{ borderColor: result.result === 'VERIFIED' ? '#10B981' : result.result === 'REJECTED' ? '#EF4444' : '#F59E0B' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  {result.result === 'VERIFIED' ? <CheckCircle size={18} className="text-emerald-400" /> :
                   result.result === 'REJECTED' ? <XCircle size={18} className="text-red-400" /> :
                   <AlertCircle size={18} className="text-yellow-400" />}
                  <span className={`font-bold text-sm ${
                    result.result === 'VERIFIED' ? 'text-emerald-400' :
                    result.result === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{result.result}</span>
                </div>

                {[
                  { icon: MapPin, label: 'GPS', value: `${result.gps_status} (${result.checks.gps.distanceMeters?.toFixed(1) ?? 'N/A'}m delta)` },
                  { icon: Clock, label: 'Timestamp', value: `${result.timestamp_status} (${result.checks.timestamp.driftSeconds?.toFixed(0) ?? 'N/A'}s drift)` },
                  { icon: ImageIcon, label: 'MobileNetV2', value: `${result.mobilenet_status} — ${(result.confidence * 100).toFixed(1)}%` },
                ].map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-start gap-2 py-2 border-b border-slate-800/50 last:border-0">
                      <Icon size={12} className="text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500">{row.label}</p>
                        <p className="text-xs text-slate-300">{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-card p-5 flex flex-col"
          style={{ minHeight: '480px' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-slate-500 font-mono ml-2">tmt-forensic-engine v3.0 (edge)</span>
            {running && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 font-mono text-xs"
            style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px' }}>
            {logs.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2"
              >
                <span className="text-slate-600 shrink-0">{log.time}</span>
                <span style={{ color: logColors[log.type] }}>{log.msg}</span>
              </motion.div>
            ))}
            {running && (
              <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-purple-400">█</motion.div>
            )}
            <div ref={logsEndRef} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
