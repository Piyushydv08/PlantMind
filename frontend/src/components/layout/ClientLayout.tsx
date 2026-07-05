'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '../ui/toast-context';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (localStorage.getItem('plantmind-demo-banner-dismissed') !== 'true') {
      setShowBanner(true);
    }
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const dismissBanner = () => {
    localStorage.setItem('plantmind-demo-banner-dismissed', 'true');
    setShowBanner(false);
  };

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100">
        
        {/* Top Demo Banner */}
        {showBanner && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium z-[60]">
            <p className="truncate mr-4">✨ Demo Mode — Knowledge base loaded with OISD-116, Plant SOPs & Maintenance Records</p>
            <button onClick={dismissBanner} className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex flex-1 relative overflow-hidden">
          
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out w-[240px] bg-slate-950/95 lg:bg-transparent lg:translate-x-0 lg:static lg:flex-shrink-0 border-r border-slate-800",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Inject absolute positioning relative to banner on mobile, otherwise static */}
            <div className="h-full w-full">
              <Sidebar />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 w-full relative">
            <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
              <div className="flex items-center">
                <button 
                  className="lg:hidden p-4 text-slate-300 hover:text-emerald-500 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="flex-1 w-full overflow-hidden">
                  <Header />
                </div>
              </div>
            </div>
            
            <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
              {children}
            </main>
          </div>
          
        </div>
      </div>
    </ToastProvider>
  );
}
