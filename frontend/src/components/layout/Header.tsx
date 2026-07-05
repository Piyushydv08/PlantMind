'use client';

import { usePathname } from 'next/navigation';

const routeNames: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/copilot': 'Expert Copilot',
  '/maintenance': 'Maintenance RCA',
  '/compliance': 'Compliance Checker',
  '/graph': 'Knowledge Graph',
  '/upload': 'Document Upload',
};

export function Header() {
  const pathname = usePathname();
  // Get the base path title or default to PlantMind
  const title = routeNames[pathname] || 
    (pathname.startsWith('/maintenance') ? 'Maintenance RCA' : 
     pathname.startsWith('/compliance') ? 'Compliance Checker' : 'PlantMind');

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
      
      <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-sm font-medium text-emerald-500">System Online</span>
      </div>
    </header>
  );
}
