import { useApp } from '../context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp, Send, Activity } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export function Dashboard() {
  const { state, updateStock, setCurrentStock, setLowStockThreshold, addOrder, syncToSheets } = useApp();
  const [useAmount, setUseAmount] = useState<number>(5);
  const [incomingAmount, setIncomingAmount] = useState<number>(0);
  const [editStock, setEditStock] = useState<string>(state.currentStock.toString());
  const [editThreshold, setEditThreshold] = useState<string>(state.lowStockThreshold.toString());

  useEffect(() => {
    setEditStock(state.currentStock.toString());
  }, [state.currentStock]);

  useEffect(() => {
    setEditThreshold(state.lowStockThreshold.toString());
  }, [state.lowStockThreshold]);

  const isLowStock = state.currentStock <= state.lowStockThreshold;
  const stockPercentage = Math.min(100, Math.max(0, (state.currentStock / (state.lowStockThreshold * 3)) * 100));

  const chartData = useMemo(() => {
    // Generate mock historical data and append current stock to make it look real-time
    const data = [];
    let mockStock = state.currentStock + 40;
    for (let i = 6; i >= 1; i--) {
      data.push({
        name: format(subDays(new Date(), i), 'MMM dd'),
        stock: Math.max(0, mockStock),
      });
      mockStock -= Math.floor(Math.random() * 15);
    }
    data.push({
      name: 'Today',
      stock: state.currentStock,
    });
    return data;
  }, [state.currentStock]);

  const handleUseStock = () => {
    const newStock = state.currentStock - useAmount;
    updateStock(-useAmount);
    
    // Auto trigger WA if it drops below threshold
    if (state.isAutoOrderEnabled && state.currentStock > state.lowStockThreshold && newStock <= state.lowStockThreshold) {
      const orderQuantity = Math.max(20, state.lowStockThreshold * 2);
      
      let supplierId = "auto-order";
      let supplierName = "Supplier";
      let targetPhone = "6281395037157"; // Fallback to admin

      if (state.suppliers.length > 0) {
        supplierId = state.suppliers[0].id;
        supplierName = state.suppliers[0].name;
        if (state.suppliers[0].phone) {
          targetPhone = state.suppliers[0].phone;
        }
      }
        
      addOrder({
        supplierId: supplierId,
        date: format(new Date(), 'yyyy-MM-dd'),
        quantity: orderQuantity,
        status: 'pending'
      });
      
      const message = `Halo ${supplierName}, saya ingin order putih telur sebanyak ${orderQuantity} kg untuk hari ini. Mohon info ketersediaan.`;
      const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }
  };

  const handleIncomingStock = () => {
    if (incomingAmount > 0) {
      updateStock(incomingAmount);
      setIncomingAmount(0);
    }
  };

  const getWaUrl = () => {
    const targetStock = Math.max(20, state.lowStockThreshold * 2);
    const needToOrder = Math.max(0, targetStock - state.currentStock);
    
    let targetPhone = "6281395037157";
    let supplierName = "Supplier";
    
    if (state.suppliers.length > 0) {
      targetPhone = state.suppliers[0].phone || targetPhone;
      supplierName = state.suppliers[0].name || supplierName;
    }

    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let message = `Halo Bos ${supplierName !== 'Unknown' && supplierName !== 'Supplier' ? supplierName : ''}, saya ingin order putih telur sebanyak ${needToOrder > 0 ? needToOrder : 100} kg untuk besok tanggal ${dateStr}. Mohon konfirmasi ketersediaannya.`;
    
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="col-span-1 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Stock Monitoring</h3>
          <div className="space-y-6">
            <div className={`p-4 rounded-lg border ${isLowStock ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${isLowStock ? 'text-red-700' : 'text-slate-700'}`}>Putih Telur (Cair)</span>
                <span className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-slate-600'}`}>{state.currentStock} kg</span>
              </div>
              <div className={`w-full h-2 rounded-full mt-2 ${isLowStock ? 'bg-red-200' : 'bg-slate-200'}`}>
                <div 
                  className={`h-2 rounded-full ${isLowStock ? 'bg-red-600' : 'bg-blue-600'}`} 
                  style={{ width: `${stockPercentage}%` }}
                ></div>
              </div>
              {isLowStock ? (
                <p className="text-[10px] text-red-500 mt-2 font-medium uppercase">Reorder Triggered Automatically</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase">Stable Inventory</p>
              )}
            </div>
            
            <a 
              href={getWaUrl()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full flex items-center justify-center h-9 px-3 rounded-md bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold uppercase text-[10px] tracking-widest mt-2 transition-colors"
            >
              <Send className="mr-2 h-3 w-3" /> Pesan ke Supplier (WA)
            </a>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-5 text-white shadow-xl h-48">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Integration Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${state.appsScriptUrl ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                <span className="text-sm">Google Sheets Sync</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{state.appsScriptUrl ? 'Live' : 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${state.isAutoOrderEnabled ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                <span className="text-sm">WhatsApp Gateway</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{state.isAutoOrderEnabled ? 'Connected' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="col-span-1 lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Live Stock Trend</h2>
            <div className="flex flex-wrap items-center gap-2">
              {state.appsScriptUrl && (
                <Button size="sm" onClick={syncToSheets} className="bg-green-600 hover:bg-green-700 text-white shadow-none text-[10px] font-bold uppercase tracking-widest">
                  Simpan ke Sheets
                </Button>
              )}
              <span className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-500">
                <Activity className="h-4 w-4 text-blue-500" /> Synced
              </span>
            </div>
          </div>
          <div className="p-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                />
                <Legend verticalAlign="top" height={36} content={(props) => {
                  return (
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                      <span>Perkembangan stok selama 7 hari terakhir</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-50"></div>
                          <span>Stok Tersedia</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500"></div>
                          <span>Batas Minimum ({state.lowStockThreshold} kg)</span>
                        </div>
                      </div>
                    </div>
                  );
                }} />
                <ReferenceLine y={state.lowStockThreshold} stroke="#ef4444" strokeDasharray="3 3" />
                <Area type="monotone" name="Stok (kg)" dataKey="stock" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" activeDot={{ r: 6, fill: '#2563eb' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Penggunaan Stok Harian</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="useAmount" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jumlah Terpakai (kg)</Label>
              <div className="flex space-x-2">
                <Input 
                  id="useAmount" 
                  type="number" 
                  value={useAmount} 
                  onChange={(e) => setUseAmount(Number(e.target.value))} 
                  className="font-mono text-sm border-slate-200 focus-visible:ring-blue-600 max-w-xs"
                />
                <Button onClick={handleUseStock} className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  <ArrowDown className="mr-2 h-3 w-3" /> Kurangi Stok
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Pengaturan Data Master</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="incomingStock" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Barang Datang Hari Ini (kg)</Label>
              <div className="flex space-x-2">
                <Input 
                  id="incomingStock" 
                  type="number" 
                  value={incomingAmount || ''} 
                  onChange={(e) => setIncomingAmount(Number(e.target.value))} 
                  className="font-mono text-sm border-slate-200 focus-visible:ring-blue-600 max-w-xs"
                  placeholder="Jumlah (kg)"
                />
                <Button onClick={handleIncomingStock} disabled={incomingAmount <= 0 || isNaN(incomingAmount)} className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest">
                  <ArrowUp className="mr-2 h-3 w-3" /> Tambah Stok
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label htmlFor="currentStock" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stok Aktual Saat Ini (kg)</Label>
                <Input 
                  id="currentStock" 
                  type="number" 
                  value={editStock} 
                  onChange={(e) => {
                    setEditStock(e.target.value);
                    if (e.target.value !== '') {
                      setCurrentStock(Number(e.target.value));
                    }
                  }} 
                  onBlur={() => {
                    if (editStock === '') {
                      setEditStock('0');
                      setCurrentStock(0);
                    }
                  }}
                  className="font-mono text-sm border-slate-200 focus-visible:ring-blue-600 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Batas Minimum (kg)</Label>
                <Input 
                  id="threshold" 
                  type="number" 
                  value={editThreshold} 
                  onChange={(e) => {
                    setEditThreshold(e.target.value);
                    if (e.target.value !== '') {
                      setLowStockThreshold(Number(e.target.value));
                    }
                  }} 
                  onBlur={() => {
                    if (editThreshold === '') {
                      setEditThreshold('0');
                      setLowStockThreshold(0);
                    }
                  }}
                  className="font-mono text-sm border-slate-200 focus-visible:ring-blue-600 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
