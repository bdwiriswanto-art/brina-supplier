import { useApp } from '../context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Send, Printer, ShoppingCart, Trash2 } from 'lucide-react';
import { Order } from '../types';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import brinaLogo from './logo.png';

export function Orders() {
  const { state, updateOrderStatus, setDailyRequirement, addOrder, deleteOrder, updateOrder } = useApp();
  const [dailyInput, setDailyInput] = useState((state.dailyRequirement || 100).toString());
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    state.suppliers.length > 0 ? state.suppliers[0].id : "manual-order"
  );
  const [actualOrderInput, setActualOrderInput] = useState<string>("0");

  const [isSplitSupplier, setIsSplitSupplier] = useState(false);
  const [selectedSupplierId2, setSelectedSupplierId2] = useState<string>("");
  const [qtySupplier1, setQtySupplier1] = useState<string>("0");
  const [qtySupplier2, setQtySupplier2] = useState<string>("0");

  useEffect(() => {
    if (state.suppliers.length > 0) {
      if (!state.suppliers.find(s => s.id === selectedSupplierId)) {
        setSelectedSupplierId(state.suppliers[0].id);
      }
    } else {
      setSelectedSupplierId("manual-order");
    }
  }, [state.suppliers, selectedSupplierId]);

  useEffect(() => {
    if (state.suppliers.length > 1) {
      if (!selectedSupplierId2 || !state.suppliers.find(s => s.id === selectedSupplierId2)) {
        const other = state.suppliers.find(s => s.id !== selectedSupplierId);
        setSelectedSupplierId2(other ? other.id : state.suppliers[1].id);
      }
    } else {
      setSelectedSupplierId2("");
    }
  }, [state.suppliers, selectedSupplierId, selectedSupplierId2]);

  useEffect(() => {
    const total = parseInt(actualOrderInput);
    if (!isNaN(total) && total >= 0) {
      if (isSplitSupplier) {
        const half = Math.ceil(total / 2);
        setQtySupplier1(half.toString());
        setQtySupplier2((total - half).toString());
      } else {
        setQtySupplier1(total.toString());
        setQtySupplier2("0");
      }
    }
  }, [actualOrderInput, isSplitSupplier]);

  const handleQty1Change = (val: string) => {
    setQtySupplier1(val);
    const total = parseInt(actualOrderInput);
    const q1 = parseInt(val);
    if (!isNaN(total) && !isNaN(q1)) {
      const q2 = Math.max(0, total - q1);
      setQtySupplier2(q2.toString());
    }
  };

  const handleQty2Change = (val: string) => {
    setQtySupplier2(val);
    const total = parseInt(actualOrderInput);
    const q2 = parseInt(val);
    if (!isNaN(total) && !isNaN(q2)) {
      const q1 = Math.max(0, total - q2);
      setQtySupplier1(q1.toString());
    }
  };
  
  const handleUpdateDaily = () => {
    const val = parseInt(dailyInput);
    if (!isNaN(val) && val >= 0) {
      setDailyRequirement(val);
    }
  };

  const pendingOrOrderedQuantity = state.orders
    .filter(o => o.status !== 'received')
    .reduce((sum, o) => sum + o.quantity, 0);

  const recommendedOrder = Math.max(0, (state.dailyRequirement || 100) - state.currentStock - pendingOrOrderedQuantity);

  useEffect(() => {
    setActualOrderInput(recommendedOrder.toString());
  }, [recommendedOrder]);

  const handleCreateOrder = () => {
    const qty = parseInt(actualOrderInput);
    if (isNaN(qty) || qty <= 0) return;
    
    if (isSplitSupplier && state.suppliers.length >= 2) {
      const q1 = parseInt(qtySupplier1);
      const q2 = parseInt(qtySupplier2);

      if (!isNaN(q1) && q1 > 0) {
        addOrder({
          supplierId: selectedSupplierId,
          date: format(new Date(), 'yyyy-MM-dd'),
          quantity: q1,
          status: 'pending'
        });
      }

      if (!isNaN(q2) && q2 > 0) {
        addOrder({
          supplierId: selectedSupplierId2 || (state.suppliers.find(s => s.id !== selectedSupplierId)?.id || ''),
          date: format(new Date(), 'yyyy-MM-dd'),
          quantity: q2,
          status: 'pending'
        });
      }
    } else {
      let supplierId = selectedSupplierId;
      if (supplierId === "manual-order" && state.suppliers.length > 0) {
        supplierId = state.suppliers[0].id;
      }
        
      addOrder({
        supplierId,
        date: format(new Date(), 'yyyy-MM-dd'),
        quantity: qty,
        status: 'pending'
      });
    }
  };

  const getSupplierName = (id: string) => {
    const supplier = state.suppliers.find(s => s.id === id);
    return supplier ? supplier.name : 'Unknown';
  };

  const getSupplierPhone = (id: string) => {
    const supplier = state.suppliers.find(s => s.id === id);
    return supplier ? supplier.phone : '';
  };

  const getOrderWaUrl = (order: Order) => {
    let targetPhone = getSupplierPhone(order.supplierId);
    if (!targetPhone) targetPhone = "6281395037157"; // Fallback to admin phone

    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }
    
    const supplierName = getSupplierName(order.supplierId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let message = `Halo Bos ${supplierName !== 'Unknown' && supplierName !== 'Supplier' ? supplierName : ''}, saya ingin order putih telur sebanyak ${order.quantity} kg untuk besok tanggal ${dateStr}. Mohon konfirmasi ketersediaannya.`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleMarkReceived = (id: string) => {
    updateOrderStatus(id, 'received');
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const supplierName = getSupplierName(order.supplierId);
    
    // Resolve absolute image URL
    const logoUrl = brinaLogo.startsWith('http') || brinaLogo.startsWith('data:') 
      ? brinaLogo 
      : window.location.origin + brinaLogo;

    const html = `
      <html>
        <head>
          <title>Order - ${order.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; mix-blend-mode: multiply; }
            .content { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 20px;}
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="BRINA PUTIH TELUR" class="logo" />
            <h2>ORDER PEMBELIAN</h2>
            <p>Tgl: ${order.date}</p>
          </div>
          <div class="content">
            <div class="row"><span>ID Order:</span> <span>${order.id}</span></div>
            <div class="row"><span>Supplier:</span> <span>${supplierName}</span></div>
            <div class="row"><span>Item:</span> <span>Putih Telur</span></div>
            <div class="row"><span>Jumlah:</span> <span>${order.quantity} kg</span></div>
            <div class="row"><span>Status:</span> <span>${order.status.toUpperCase()}</span></div>
          </div>
          <div class="footer">
            <p>Terima Kasih</p>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getStatusBadge = (status: Order['status']) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase">Pending WA</span>;
      case 'ordered': return <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold uppercase">Ordered</span>;
      case 'received': return <span className="px-2 py-1 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold uppercase">Received</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <Label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            Kebutuhan Stok Per Hari (kg)
          </Label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={dailyInput}
              onChange={(e) => setDailyInput(e.target.value)}
              className="font-mono text-sm w-full"
            />
            <Button onClick={handleUpdateDaily} className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              Simpan
            </Button>
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 mt-2">
            Target stok aman yang harus tersedia setiap harinya.
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col justify-center items-start border border-slate-100">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Rekomendasi Order Hari Ini
              </span>
              <span className="text-xl md:text-2xl font-mono font-black text-slate-400">
                {recommendedOrder} <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-normal">kg</span>
              </span>
            </div>
            
            <div className="flex flex-col pt-3 border-t border-slate-200 w-full gap-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Aktual Order
                </span>
                {state.suppliers.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="split-supplier" 
                      checked={isSplitSupplier} 
                      onChange={(e) => setIsSplitSupplier(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="split-supplier" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none">
                      Bagi ke 2 Supplier
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                      type="number"
                      value={actualOrderInput}
                      onChange={(e) => setActualOrderInput(e.target.value)}
                      className="font-mono text-sm w-20 h-8 text-center"
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
                  </div>
                  
                  {!isSplitSupplier && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                      <select 
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-600 bg-white w-full sm:w-auto h-8"
                      >
                        {state.suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Button 
                        onClick={handleCreateOrder} 
                        disabled={parseInt(actualOrderInput) <= 0 || isNaN(parseInt(actualOrderInput))}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm w-full sm:w-auto h-8"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> Buat Order
                      </Button>
                    </div>
                  )}
                </div>

                {isSplitSupplier && state.suppliers.length >= 2 && (
                  <div className="flex flex-col gap-3 p-3 bg-white rounded-md border border-slate-200 shadow-sm w-full">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengaturan Pembagian Supplier</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier 1</label>
                        <select 
                          value={selectedSupplierId}
                          onChange={(e) => setSelectedSupplierId(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white h-8 outline-none focus:ring-1 focus:ring-blue-600 w-full"
                        >
                          {state.suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 mt-1">
                          <Input 
                            type="number"
                            value={qtySupplier1}
                            onChange={(e) => handleQty1Change(e.target.value)}
                            className="font-mono text-xs w-20 h-8 text-center"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kg</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier 2</label>
                        <select 
                          value={selectedSupplierId2}
                          onChange={(e) => setSelectedSupplierId2(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white h-8 outline-none focus:ring-1 focus:ring-blue-600 w-full"
                        >
                          {state.suppliers.map(s => (
                            <option key={s.id} value={s.id} disabled={s.id === selectedSupplierId}>{s.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 mt-1">
                          <Input 
                            type="number"
                            value={qtySupplier2}
                            onChange={(e) => handleQty2Change(e.target.value)}
                            className="font-mono text-xs w-20 h-8 text-center"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button 
                        onClick={handleCreateOrder} 
                        disabled={parseInt(actualOrderInput) <= 0 || isNaN(parseInt(actualOrderInput))}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm h-8 px-4"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> Buat Order Gabungan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Daily Order Schedule</h2>
        </div>
        
        <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200">Tanggal</th>
              <th className="px-4 py-3 border-b border-slate-200">Supplier</th>
              <th className="px-4 py-3 text-right border-b border-slate-200">Jumlah</th>
              <th className="px-4 py-3 border-b border-slate-200">Status</th>
              <th className="px-4 py-3 text-right border-b border-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {state.orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 group transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{order.date}</td>
                <td className="px-4 py-3 font-bold text-slate-800 italic">
                  {order.status !== 'received' ? (
                    <select
                      value={order.supplierId}
                      onChange={(e) => updateOrder(order.id, { supplierId: e.target.value })}
                      className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-600 bg-white w-full max-w-[150px]"
                    >
                      <option value="manual-order">Pilih Supplier</option>
                      {state.suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs">{getSupplierName(order.supplierId)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-600">{order.quantity} kg</td>
                <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                <td className="px-4 py-3 text-right flex justify-end gap-1 sm:gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handlePrintOrder(order)} className="text-slate-500 hover:text-slate-800 h-7 w-7 sm:h-8 sm:w-8" title="Cetak Order">
                    <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  {(order.status === 'pending' || order.status === 'ordered') && (
                    <a 
                      href={getOrderWaUrl(order)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={() => updateOrderStatus(order.id, 'ordered')}
                      className="inline-flex items-center justify-center h-7 sm:h-8 px-2 sm:px-3 rounded-md bg-green-600 hover:bg-green-700 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors"
                    >
                      <Send className="mr-1 sm:mr-2 h-3 w-3" /> WA
                    </a>
                  )}
                  {order.status === 'ordered' && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkReceived(order.id)} className="h-7 sm:h-8 text-[9px] sm:text-[10px] px-2 sm:px-3 font-bold uppercase tracking-widest border-slate-300 text-slate-600">
                      <Check className="mr-1 sm:mr-2 h-3 w-3" /> Diterima
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deleteOrder(order.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8" title="Hapus Order">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {state.orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                  Belum ada order. Order otomatis akan dibuat saat stok menipis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
