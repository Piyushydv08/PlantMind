'use client';

import { useState } from 'react';
import { 
  Wrench, AlertTriangle, ChevronDown, ChevronRight, 
  Copy, Check, Loader2, AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const SYMPTOM_CHIPS = [
  "High vibration", "Temperature spike", "Pressure drop", 
  "Abnormal noise", "Seal leakage", "Flow reduction"
];

export default function MaintenancePage() {
  const [equipmentId, setEquipmentId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [checkedActions, setCheckedActions] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChipClick = (chip: string) => {
    setSymptoms(prev => prev ? `${prev}, ${chip}` : chip);
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setCheckedActions([]);
    setShowCitations(false);
    setActiveTab('short');

    try {
      const response = await axios.post('http://localhost:3001/api/maintenance/analyze', {
        symptoms: symptoms.trim(),
        equipment_id: equipmentId.trim() || undefined
      });
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to communicate with the analysis engine.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (index: number) => {
    setCheckedActions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const copySpareParts = () => {
    if (result?.analysis?.spare_parts_needed) {
      navigator.clipboard.writeText(result.analysis.spare_parts_needed.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6 h-[calc(100vh-112px)] overflow-hidden">
      
      {/* LEFT PANEL: INPUT */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 text-slate-100">
          <Wrench className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-semibold">Failure Analysis</h2>
        </div>

        <div className="space-y-6 flex-1">
          {/* Equipment ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Equipment Tag</label>
            <input 
              type="text"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              placeholder="e.g. P-201, HE-102, C-301"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Describe Symptoms</label>
            <textarea 
              rows={5}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. High vibration on pump, bearing temp 85°C, unusual noise since yesterday morning"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none shadow-sm"
            />
            
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SYMPTOM_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-auto border-t border-slate-800">
          <button
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing RCA...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: RESULTS */}
      <div className="lg:col-span-3 h-full overflow-y-auto pr-2 custom-scrollbar pb-6 space-y-6">
        
        {loading ? (
          /* Skeletons */
          <div className="space-y-6">
            <div className="h-28 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
              <div className="h-64 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="h-40 bg-slate-800/80 border border-slate-700/50 rounded-xl animate-pulse"></div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-medium text-red-400 mb-2">Analysis Failed</h3>
            <p className="text-slate-300 text-sm mb-6 max-w-md">{error}</p>
            <button 
              onClick={handleAnalyze}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-lg text-sm transition-colors border border-slate-700 shadow-sm"
            >
              Retry Diagnostics
            </button>
          </div>
        ) : !result ? (
          /* Placeholder */
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 h-full flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Wrench className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-300 mb-3">Awaiting Diagnostic Data</h3>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed">
              Enter the equipment tag and a detailed description of the symptoms on the left to generate an AI-driven Root Cause Analysis mapping directly back to your historical manuals and operating procedures.
            </p>
          </div>
        ) : (
          /* Results Container */
          <div className="space-y-6 animate-in fade-in duration-700">
            
            {/* Primary Cause */}
            {result.analysis?.root_cause_analysis?.primary_cause && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
                <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Primary Root Cause Identified
                </h3>
                <p className="text-slate-100 text-[17px] font-medium leading-snug">{result.analysis.root_cause_analysis.primary_cause}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Probable Causes */}
              <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-800 pb-2">Probable Causes</h3>
                <div className="space-y-3">
                  {result.analysis?.probable_causes?.map((pc: any, idx: number) => {
                    const likelihood = pc.likelihood?.toLowerCase() || 'low';
                    const colorClasses = 
                      likelihood === 'high' ? 'border-l-red-500 bg-red-500/5' :
                      likelihood === 'medium' ? 'border-l-amber-500 bg-amber-500/5' :
                      'border-l-emerald-500 bg-emerald-500/5';
                    const badgeClasses = 
                      likelihood === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      likelihood === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

                    return (
                      <div key={idx} className={cn("border border-slate-800 border-l-4 rounded-lg p-3.5", colorClasses)}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <h4 className="text-slate-200 font-medium text-sm leading-tight">{pc.cause}</h4>
                          <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0", badgeClasses)}>
                            {likelihood}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{pc.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5 Whys Chain */}
              <div className="space-y-4">
                <h3 className="text-slate-200 font-semibold text-lg border-b border-slate-800 pb-2">5-Why Analysis</h3>
                <div className="relative pl-3 space-y-5 py-2">
                  {/* Vertical dashed line */}
                  <div className="absolute left-[22px] top-4 bottom-6 w-px border-l-2 border-dashed border-slate-700/50 z-0"></div>
                  
                  {result.analysis?.root_cause_analysis?.why_chain?.map((why: string, idx: number) => (
                    <div key={idx} className="relative z-10 flex gap-4 items-start group">
                      <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 text-xs font-bold shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        {idx + 1}
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-lg flex-1 group-hover:border-slate-600 transition-colors">
                        <p className="text-[13px] text-slate-300 leading-snug">{why.replace(/^Why \d+:?\s*/i, '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Immediate Actions Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-slate-200 font-semibold text-lg mb-4">Immediate Actions</h3>
              <div className="space-y-3">
                {result.analysis?.immediate_actions?.map((action: string, idx: number) => {
                  const isChecked = checkedActions.includes(idx);
                  return (
                    <label key={idx} className="flex items-start gap-3.5 cursor-pointer group p-1">
                      <div className={cn(
                        "w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-all",
                        isChecked ? "bg-emerald-500 border-emerald-500" : "border-slate-600 group-hover:border-slate-400 bg-slate-800"
                      )}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                      </div>
                      <span className={cn(
                        "text-[14px] leading-snug transition-colors",
                        isChecked ? "line-through text-slate-500" : "text-slate-200"
                      )}>
                        {action}
                      </span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked}
                        onChange={() => toggleAction(idx)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Maintenance & Safety */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Maintenance Tabs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="flex border-b border-slate-800 bg-slate-950">
                  <button 
                    onClick={() => setActiveTab('short')}
                    className={cn(
                      "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'short' ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    )}
                  >
                    Short-Term Fix
                  </button>
                  <button 
                    onClick={() => setActiveTab('long')}
                    className={cn(
                      "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                      activeTab === 'long' ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    )}
                  >
                    Long-Term Fix
                  </button>
                </div>
                <div className="p-5 bg-slate-900/50 flex-1">
                  <ul className="space-y-3 text-sm text-slate-300">
                    {(activeTab === 'short' 
                      ? result.analysis?.recommended_maintenance?.short_term 
                      : result.analysis?.recommended_maintenance?.long_term
                    )?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5 shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Safety & Spare Parts */}
              <div className="space-y-4">
                
                {/* Safety Precautions */}
                {result.analysis?.safety_precautions && result.analysis.safety_precautions.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-3 tracking-wide">
                      <AlertTriangle className="w-4 h-4" /> SAFETY PRECAUTIONS
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-200/90">
                      {result.analysis.safety_precautions.map((p: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                          <span className="leading-snug">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spare Parts */}
                {result.analysis?.spare_parts_needed && result.analysis.spare_parts_needed.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-slate-200 font-semibold text-sm">Required Spare Parts</h4>
                      <button 
                        onClick={copySpareParts}
                        className="text-slate-400 hover:text-slate-100 flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy All'}
                      </button>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {result.analysis.spare_parts_needed.map((part: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                          <span className="text-slate-500 shrink-0 mt-0.5">📦</span>
                          <span className="font-medium">{part}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>

            {/* Citations Collapsible */}
            {result.citations && result.citations.length > 0 && (
              <div className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowCitations(!showCitations)}
                  className="w-full flex items-center justify-between p-4.5 p-4 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-xs border border-slate-700">
                      {result.citations.length}
                    </span>
                    Knowledge Base Sources Used
                  </span>
                  {showCitations ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                
                {showCitations && (
                  <div className="p-4 pt-1 border-t border-slate-800 bg-slate-900/50">
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      {result.citations.map((cit: any, idx: number) => (
                        <div key={idx} className="bg-slate-800 p-3.5 rounded-lg border border-slate-700 flex flex-col justify-between hover:border-slate-600 transition-colors">
                          <span className="text-sm font-medium text-slate-200 mb-2.5 truncate" title={cit.document}>{cit.document}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 tracking-wider">
                              {cit.type}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-bold">{cit.relevance}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
