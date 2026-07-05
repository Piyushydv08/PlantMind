'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Leaf, 
  LayoutDashboard, 
  MessageSquare, 
  Wrench, 
  ShieldCheck, 
  Network, 
  Upload 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Copilot', href: '/copilot', icon: MessageSquare },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Knowledge', href: '/graph', icon: Network },
  { name: 'Upload Docs', href: '/upload', icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 w-[240px] h-screen bg-slate-950 border-r border-slate-800 flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-slate-800">
        <Leaf className="w-6 h-6 text-emerald-500" />
        <span className="text-xl font-bold text-slate-100">PlantMind</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          // Exact match for dashboard, prefix match for others to keep active state on sub-routes
          const isActive = item.href === '/' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'text-emerald-500 bg-emerald-500/10' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center font-medium">
          Powered by Groq AI + Llama 3.3
        </p>
      </div>
    </div>
  );
}
