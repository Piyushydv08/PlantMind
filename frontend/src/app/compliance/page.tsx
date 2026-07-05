'use client';

import { useState } from 'react';
import { 
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, 
  XCircle, AlertTriangle, FileCheck
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-context';

export default function CompliancePage() {
  const [procedure, setProcedure] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [regulationFocus, setRegulationFocus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { showToast } = useToast();

  const handleAnalyze = async () => {
    if (!procedure.trim()) {
      showToast('Please describe the procedure to check', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:3001/api/compliance/check', {
        procedure: procedure.trim(),
        equipment_id: equipmentId.trim() || undefined,
        regulation_type: regulationFocus || undefined
      });
      setResult(response.data);
      showToast('Compliance audit complete', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to complete compliance audit.');
      showToast('Compliance audit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('non')) return { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle, label: 'Non-Compliant' };
    if (s.includes('partial')) return { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle, label: 'Partially Compliant' };
    if (s.includes('compliant')) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2, label: 'Compliant' };
    return { color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', icon: AlertCircle, label: 'Unknown' };
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6 min-h-[calc(100vh-112px)] overflow-hidden">
      
      {/* LEFT PANEL: INPUT */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 text-slate-100">
          <ShieldCheck className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold">Compliance Checker</h2>
        </div>

        <div className="space-y-6 flex-1">
          {/* Procedure */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Procedure to Audit</label>
            <textarea 
              rows={4}
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="e.g. Hot work near P-201, confined space entry in V-101"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none shadow-sm"
            />
          </div>

          {/* Equipment ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Equipment Tag (Optional)</label>
            <input 
              type="text"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              placeholder="e.g. P-201"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>

          {/* Regulation Focus */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Regulation Focus</label>
            <select 
              value={regulationFocus}
              onChange={(e) => setRegulationFocus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            >
              <option value="">All Regulations</option>
              <option value="OISD Standards">OISD Standards</option>
              <option value="Factory Act">Factory Act 1948</option>
              <option value="DGMS Guidelines">DGMS Guidelines</option>
              <option value="PESO Regulations">PESO Regulations</option>
            </select>
          </div>
        </div>

        <div className="pt-6 mt-auto border-t border-slate-800">
          <button
            onClick={handleAnalyze}
            disabled={loading || !procedure.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Auditing...
              </>
            ) : (
              'Check Compliance'
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: RESULTS */}
      <div className="lg:col-span-3 h-full overflow-y-auto pr-2 custom-scrollbar pb-6 space-y-6">
        
        {loading ? (
          /* Skeletons */
          <div className="space-y-6">
            <div className="h-32 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
            <div className="h-64 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-40 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
              <div className="h-40 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-medium text-red-400 mb-2">Audit Failed</h3>
            <p className="text-slate-300 text-sm mb-6 max-w-md">{error}</p>
          </div>
        ) : !result ? (
          /* Placeholder */
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 h-full flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
              <ShieldCheck className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-300 mb-3">Regulatory Sandbox</h3>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed">
              Verify your operational procedures against ingrained regulatory frameworks (OISD, Factory Act) and historical safety logs automatically.
            </p>
          </div>
        ) : (
          /* Results Container */
          <div className="space-y-6 animate-in fade-in duration-700">
            
            {/* Status Badge */}
            {result.analysis?.compliance_status && (
              (() => {
                const cfg = getStatusConfig(result.analysis.compliance_status);
                const Icon = cfg.icon;
                return (
                  <div className={cn("rounded-xl p-6 border shadow-sm flex items-center gap-5", cfg.bg)}>
                    <Icon className={cn("w-12 h-12", cfg.color)} />
                    <div>
                      <h3 className={cn("text-2xl font-bold uppercase tracking-wide", cfg.color)}>
                        {cfg.label}
                      </h3>
                      <p className="text-slate-300 text-sm mt-1">
                        Risk Level: <span className="font-semibold text-slate-100 capitalize">{result.analysis.risk_level || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Applicable Regulations Table */}
            {result.analysis?.applicable_regulations && result.analysis.applicable_regulations.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950">
                  <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider">Applicable Regulations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="px-5 py-3 font-medium">Regulation</th>
                        <th className="px-5 py-3 font-medium">Section</th>
                        <th className="px-5 py-3 font-medium">Requirement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {result.analysis.applicable_regulations.map((reg: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-300">{reg.regulation}</td>
                          <td className="px-5 py-3 text-slate-400">{reg.section}</td>
                          <td className="px-5 py-3 text-slate-300">{reg.requirement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compliance Gaps */}
            {result.analysis?.compliance_gaps && result.analysis.compliance_gaps.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-800 pb-2">Identified Gaps</h3>
                <div className="grid gap-3">
                  {result.analysis.compliance_gaps.map((gap: any, idx: number) => {
                    const sev = gap.severity?.toLowerCase();
                    const isCritical = sev === 'critical' || sev === 'high';
                    const isMajor = sev === 'major' || sev === 'medium';
                    return (
                      <div key={idx} className={cn(
                        "bg-slate-900 border-l-4 rounded-xl p-4 shadow-sm",
                        isCritical ? "border-l-red-500 border-t-slate-800 border-r-slate-800 border-b-slate-800" :
                        isMajor ? "border-l-amber-500 border-t-slate-800 border-r-slate-800 border-b-slate-800" :
                        "border-l-yellow-500 border-t-slate-800 border-r-slate-800 border-b-slate-800"
                      )}>
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <p className="text-slate-200 font-medium text-[15px] leading-snug">{gap.gap_description}</p>
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0",
                            isCritical ? "bg-red-500/20 text-red-400" :
                            isMajor ? "bg-amber-500/20 text-amber-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {gap.severity}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-800">
                          <div className="flex text-xs">
                            <span className="text-slate-500 w-24 shrink-0">Ref:</span>
                            <span className="text-slate-300">{gap.regulation_reference}</span>
                          </div>
                          <div className="flex text-xs">
                            <span className="text-slate-500 w-24 shrink-0">Fix:</span>
                            <span className="text-emerald-400 font-medium">{gap.corrective_action}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Evidence Required */}
              {result.analysis?.audit_evidence_required && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-500" /> Evidence Required
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {result.analysis.audit_evidence_required.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center shrink-0 mt-0.5 bg-slate-800"></div>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.analysis?.recommendations && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wider mb-4">Recommendations</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {result.analysis.recommendations.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </div>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
