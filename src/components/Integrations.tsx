import { useApp } from '../context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Integrations() {
  const { state, setAppsScriptUrl, setFonnteToken, toggleAutoOrder, syncToSheets } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(state.appsScriptUrl);
  const [tokenInput, setTokenInput] = useState(state.fonnteToken || '');

  const handleSaveSheet = () => {
    setAppsScriptUrl(sheetUrl);
    setFonnteToken(tokenInput);
    toast.success('Pengaturan Integrasi disimpan');
  };

  const handleTestWa = async () => {
    if (!tokenInput) {
      toast.error('Harap masukkan dan Simpan Token Fonnte terlebih dahulu');
      return;
    }
    setIsTestingWa(true);
    try {
      const res = await fetch('/api/test-wa', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.result.status) {
        toast.success('Berhasil! Silakan cek WhatsApp Anda.');
      } else {
        toast.error('Gagal mengirim: ' + (data.error || data.result?.reason || 'Token tidak valid'));
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menghubungi server');
    }
    setIsTestingWa(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncToSheets();
      toast.success('Berhasil sinkronisasi dengan Google Sheets');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Google Sheets (Apps Script)</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Sinkronisasi data stok dan order melalui URL Web App Google Apps Script.</p>
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="sheetId" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">URL Apps Script (Web App)</Label>
            <Input 
              id="sheetId" 
              placeholder="https://script.google.com/macros/s/.../exec" 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="font-mono text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600"
            />
          </div>
          <div className="space-y-1 sm:space-y-2 pt-3 sm:pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 sm:mb-0">
              <Label htmlFor="fonnteToken" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Token API Fonnte (Bot WA)</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestWa}
                disabled={isTestingWa || !tokenInput}
                className="h-7 text-[9px] sm:text-[10px] uppercase font-bold w-full sm:w-auto"
              >
                {isTestingWa ? 'Mengirim...' : 'Tes Chat WA'}
              </Button>
            </div>
            <Input 
              id="fonnteToken" 
              placeholder="Masukkan Token Fonnte Anda..." 
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="font-mono text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-600"
            />
            <p className="text-[9px] sm:text-[10px] text-slate-400">Token ini digunakan untuk mengirimkan notifikasi sisa stok otomatis setiap jam 08:00 WIB.</p>
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <Button onClick={handleSaveSheet} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest">Simpan</Button>
          <Button onClick={handleSync} disabled={isSyncing || !state.appsScriptUrl} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest">
            <RefreshCw className={`mr-2 h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} /> 
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg shadow-xl flex flex-col text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-tighter">Otomatisasi Order</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="space-y-1 pr-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-slate-200">Notifikasi WA Otomatis</Label>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Buat draft pesan WhatsApp secara otomatis saat stok turun di bawah batas threshold minimum.
                </p>
              </div>
              <Switch
                checked={state.isAutoOrderEnabled}
                onCheckedChange={toggleAutoOrder}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-5">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        </div>
      </div>
    </div>
  );
}
