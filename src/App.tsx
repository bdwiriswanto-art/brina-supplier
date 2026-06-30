/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from './components/Dashboard';
import { Suppliers } from './components/Suppliers';
import { Orders } from './components/Orders';
import { Integrations } from './components/Integrations';
import { AppProvider } from './context';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import brinaLogo from './components/logo.png';
import { Button } from '@/components/ui/button';

export default function App() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <AppProvider>
      <div className="flex flex-col h-screen w-full bg-slate-50 font-sans overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-8 h-16 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-transparent shrink-0">
              <img src={brinaLogo} alt="BRINA PUTIH TELUR Logo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-sm md:text-xl font-bold text-slate-800 tracking-tight italic uppercase truncate">BRINA PUTIH TELUR</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <div className="flex items-center gap-2 hidden md:flex">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Systems Online</span>
            </div>
            <div className="flex items-center gap-3 border-l pl-3 md:pl-6 border-slate-200">
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] md:text-xs font-medium text-slate-400 leading-none">{format(now, 'EEEE', { locale: id })}</p>
                <p className="text-xs md:text-sm font-bold text-slate-800 leading-tight">{format(now, 'dd MMM yy', { locale: id })}</p>
                <p className="text-[9px] md:text-xs font-mono font-medium text-slate-500 mt-0.5">{format(now, 'HH:mm:ss')} WIB</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="flex overflow-x-auto w-full md:w-[600px] justify-start bg-slate-200/50 p-1 rounded-md touch-pan-x scrollbar-hide">
                <TabsTrigger value="dashboard" className="shrink-0 data-[state=active]:bg-white data-[state=active]:text-blue-600 uppercase text-[9px] md:text-[10px] font-bold tracking-widest data-[state=active]:shadow-sm rounded whitespace-nowrap">Dashboard</TabsTrigger>
                <TabsTrigger value="suppliers" className="shrink-0 data-[state=active]:bg-white data-[state=active]:text-blue-600 uppercase text-[9px] md:text-[10px] font-bold tracking-widest data-[state=active]:shadow-sm rounded whitespace-nowrap">Supplier</TabsTrigger>
                <TabsTrigger value="orders" className="shrink-0 data-[state=active]:bg-white data-[state=active]:text-blue-600 uppercase text-[9px] md:text-[10px] font-bold tracking-widest data-[state=active]:shadow-sm rounded whitespace-nowrap">Jadwal</TabsTrigger>
                <TabsTrigger value="integrations" className="shrink-0 data-[state=active]:bg-white data-[state=active]:text-blue-600 uppercase text-[9px] md:text-[10px] font-bold tracking-widest data-[state=active]:shadow-sm rounded whitespace-nowrap">Integrasi</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-6 focus-visible:outline-none">
                <Dashboard />
              </TabsContent>
              
              <TabsContent value="suppliers" className="mt-6 focus-visible:outline-none">
                <Suppliers />
              </TabsContent>
              
              <TabsContent value="orders" className="mt-6 focus-visible:outline-none">
                <Orders />
              </TabsContent>
              
              <TabsContent value="integrations" className="mt-6 focus-visible:outline-none">
                <Integrations />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <footer className="h-10 bg-slate-800 flex items-center px-8 justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Session: Active</span>
            <span className="text-[10px] font-mono text-slate-500">v1.0.0-PRO</span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 hidden md:block">
            Cloud Synchronization Protocol Active • Protected by AES-256
          </div>
        </footer>
      </div>
      <Toaster />
    </AppProvider>
  );
}
