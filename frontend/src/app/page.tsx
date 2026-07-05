'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Wrench, 
  ShieldCheck, 
  Network, 
  Upload, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Database,
  AlertCircle,
  Clock,
  Gauge,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

type Document = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
};

type Alarm = {
  tag: string;
  name: string;
  issue: string;
  severity: 'critical' | 'warning';
  source: string;
};

type ActivityLog = {
  id: number;
  type: 'system' | 'compliance' | 'maintenance';
  text: string;
  time: string;
};

type StatsData = {
  safetyIndex: number;
  complianceLevel: string;
  activeAlarmsCount: number;
  alarmDetails: Alarm[];
  recentActivities: ActivityLog[];
};

export default function Home() {
  const [docCount, setDocCount] = useState<number | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/documents'),
          axios.get('http://localhost:3001/api/dashboard/stats')
        ]);
        
        const docs = docsRes.data.documents || [];
        setDocCount(docs.length);
        
        // Map backend document fields correctly to the front-end format
        const mappedDocs = docs.map((d: any) => ({
          id: d.doc_id,
          name: d.doc_name,
          type: d.doc_type,
          uploadedAt: new Date().toISOString()
        }));
        
        setRecentDocs(mappedDocs.slice(-3).reverse());
        const rawStats = statsRes.data;
        if (rawStats && Array.isArray(rawStats.alarmDetails)) {
          rawStats.alarmDetails.sort((a: Alarm, b: Alarm) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            return 0;
          });
        }
        setStatsData(rawStats);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoadingDocs(false);
        setLoadingStats(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { 
      label: 'Plant Safety Index', 
      value: loadingStats ? '...' : `${statsData?.safetyIndex ?? 98.4}%`, 
      change: 'Calculated from equipment conditions', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: Gauge 
    },
    { 
      label: 'Compliance Level', 
      value: loadingStats ? '...' : statsData?.complianceLevel ?? 'Grade A', 
      change: 'Audit checklist rating', 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      icon: ShieldCheck 
    },
    { 
      label: 'Knowledge Base', 
      value: loadingDocs ? '...' : `${docCount} Docs`, 
      change: 'Vector embeddings active', 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: Database 
    },
    { 
      label: 'Active Alarms', 
      value: loadingStats ? '...' : `${statsData?.activeAlarmsCount ?? 0} Active`, 
      change: 'Anomalies needing action', 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: AlertTriangle 
    },
  ];

  const services = [
    {
      title: 'Expert Copilot',
      description: 'Interact with Groq Llama AI to get contextual instructions, verify procedures, and query standard operating guidelines.',
      href: '/copilot',
      icon: MessageSquare,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40',
      badge: 'Interactive Q&A'
    },
    {
      title: 'Maintenance RCA',
      description: 'Diagnose equipment failures. Feed active symptoms to generate structured Root Cause Analysis and predictive scheduling.',
      href: '/maintenance',
      icon: Wrench,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40',
      badge: 'RCA & Predictive'
    },
    {
      title: 'Compliance Checker',
      description: 'Validate maintenance logs, operating procedures, and safety checklists against OISD standards and industrial regulations.',
      href: '/compliance',
      icon: ShieldCheck,
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40',
      badge: 'Auto Audit'
    },
    {
      title: 'Knowledge Graph',
      description: 'Explore a neural mapping of documents, regulations, and equipment tags to trace regulatory impact on assets.',
      href: '/graph',
      icon: Network,
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40',
      badge: 'Semantic Graph'
    },
    {
      title: 'Document Upload',
      description: 'Ingest SOPs, P&IDs, regulation guidelines, or maintenance registers. Documents are chunked and vectorized instantly.',
      href: '/upload',
      icon: Upload,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40',
      badge: 'Vector Ingestion'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              PlantMind Intelligence Activated
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome back to Plant Operations
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Retrieve real-time insights, verify procedures, and cross-reference standard compliance logs powered by advanced RAG and Llama 3.3.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/copilot"
              className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg hover:shadow-emerald-600/25 hover:scale-[1.02] flex items-center gap-2 text-sm"
            >
              Consult Copilot
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`p-6 rounded-xl border ${stat.border} bg-slate-900/40 backdrop-blur-sm shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]`}>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <span className="text-xs text-slate-400 font-medium block">{stat.change}</span>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Services and Logs */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Services Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-500" />
              Operational Modules
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <Link 
                  key={i} 
                  href={svc.href}
                  className={`group p-6 rounded-xl border flex flex-col justify-between transition-all duration-300 shadow-md ${svc.color} hover:scale-[1.02] ${i === 4 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-slate-300 transition-colors">
                        {svc.badge}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        {svc.title}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Status & Documents */}
        <div className="space-y-8">
          {/* Live Activity Logs */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-emerald-500" />
              Live Plant Activity
            </h2>
            <div className="space-y-4">
              {loadingStats ? (
                <div className="space-y-2 py-2">
                  <div className="h-4 bg-slate-800/40 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-800/40 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-800/40 rounded animate-pulse"></div>
                </div>
              ) : !statsData?.recentActivities || statsData.recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500">No activity logs recorded.</p>
              ) : (
                statsData.recentActivities.map((act) => {
                  let dotColor = 'bg-emerald-500';
                  if (act.type === 'compliance') dotColor = 'bg-purple-500';
                  if (act.type === 'maintenance') dotColor = 'bg-amber-500';
                  
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0`}></div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-200">{act.text}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{act.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Alarms & Anomalies */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              Anomalies & Compliance Alarms
            </h2>
            {loadingStats ? (
              <div className="space-y-3 py-2">
                <div className="h-10 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-10 bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            ) : !statsData?.alarmDetails || statsData.alarmDetails.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">All systems compliant & nominal</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {statsData.alarmDetails.map((alarm, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border text-xs ${
                    alarm.severity === 'critical' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}>
                    <div className="flex justify-between items-start mb-1 font-semibold">
                      <span className="truncate mr-2">{alarm.tag} — {alarm.name}</span>
                      <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded border shrink-0 font-bold ${
                        alarm.severity === 'critical' 
                          ? 'border-red-500/30 bg-red-500/20 text-red-400' 
                          : 'border-amber-500/30 bg-amber-500/20 text-amber-400'
                      }`}>
                        {alarm.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-medium">{alarm.issue}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Source: {alarm.source}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Ingestions */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-blue-500" />
              Recently Ingested
            </h2>
            {loadingDocs ? (
              <div className="space-y-3 py-2">
                <div className="h-10 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-10 bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No documents uploaded yet</p>
                <Link href="/upload" className="text-xs text-emerald-500 hover:underline mt-1 inline-block font-semibold">Upload document</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-3">
                      <p className="font-semibold text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{doc.type}</p>
                    </div>
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
