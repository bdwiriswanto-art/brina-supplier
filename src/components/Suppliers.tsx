import { useApp } from '../context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Supplier } from '../types';

function SupplierRow({ supplier, updateSupplier, deleteSupplier }: { supplier: Supplier, updateSupplier: (id: string, s: Partial<Supplier>) => void, deleteSupplier: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [phone, setPhone] = useState(supplier.phone);
  const [capacity, setCapacity] = useState(supplier.capacity.toString());
  const [price, setPrice] = useState(supplier.pricePerKg.toString());

  const handleSave = () => {
    updateSupplier(supplier.id, {
      name,
      phone,
      capacity: Number(capacity) || 0,
      pricePerKg: Number(price) || 0
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(supplier.name);
    setPhone(supplier.phone);
    setCapacity(supplier.capacity.toString());
    setPrice(supplier.pricePerKg.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-slate-50 rounded-lg group">
        <td className="px-4 py-4 rounded-l-lg">
          <Input value={name} onChange={e => setName(e.target.value)} className="font-mono text-xs h-8" />
        </td>
        <td className="px-4 py-4">
          <Input value={phone} onChange={e => setPhone(e.target.value)} className="font-mono text-xs h-8" />
        </td>
        <td className="px-4 py-4">
          <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="font-mono text-xs text-right h-8 w-24 ml-auto" />
        </td>
        <td className="px-4 py-4">
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="font-mono text-xs text-right h-8 w-28 ml-auto" />
        </td>
        <td className="px-4 py-4 text-right rounded-r-lg whitespace-nowrap">
          <Button size="sm" onClick={handleSave} className="h-8 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest mr-1">
            Simpan
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-slate-50 rounded-lg group">
      <td className="px-4 py-4 font-bold text-slate-800 italic rounded-l-lg">{supplier.name}</td>
      <td className="px-4 py-4 font-mono font-bold text-slate-500">
        <a href={`https://wa.me/${supplier.phone}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
          +{supplier.phone}
        </a>
      </td>
      <td className="px-4 py-4 text-right font-mono font-bold text-slate-600">{supplier.capacity} kg</td>
      <td className="px-4 py-4 text-right font-mono font-bold text-slate-600">Rp {supplier.pricePerKg.toLocaleString('id-ID')}</td>
      <td className="px-4 py-4 text-right rounded-r-lg whitespace-nowrap">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-blue-600 border-blue-200 hover:bg-blue-50 mr-1">
          Edit
        </Button>
        <Button variant="ghost" size="icon" onClick={() => deleteSupplier(supplier.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export function Suppliers() {
  const { state, addSupplier, updateSupplier, deleteSupplier, syncToSheets } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      name,
      phone,
      capacity: Number(capacity),
      pricePerKg: Number(price)
    });
    setIsOpen(false);
    setName('');
    setPhone('');
    setCapacity('');
    setPrice('');
  };

  return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Data Supplier</h2>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {state.appsScriptUrl && (
            <Button size="sm" onClick={syncToSheets} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
              Simpan ke Sheets
            </Button>
          )}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1 sm:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <Plus className="mr-1 h-3 w-3" /> Tambah
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-lg font-bold text-slate-800 italic uppercase">Tambah Supplier Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSupplier} className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Supplier</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} className="font-mono text-xs sm:text-sm border-slate-200" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="phone" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Nomor WhatsApp</Label>
                <Input id="phone" required value={phone} onChange={e => setPhone(e.target.value)} className="font-mono text-xs sm:text-sm border-slate-200" placeholder="62812..." />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="capacity" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Kapasitas Maksimal (kg/hari)</Label>
                <Input id="capacity" type="number" required value={capacity} onChange={e => setCapacity(e.target.value)} className="font-mono text-xs sm:text-sm border-slate-200" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="price" className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Harga per kg (Rp)</Label>
                <Input id="price" type="number" required value={price} onChange={e => setPrice(e.target.value)} className="font-mono text-xs sm:text-sm border-slate-200" />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200">Nama</th>
              <th className="px-4 py-3 border-b border-slate-200">WhatsApp</th>
              <th className="px-4 py-3 text-right border-b border-slate-200">Kapasitas</th>
              <th className="px-4 py-3 text-right border-b border-slate-200">Harga/kg</th>
              <th className="px-4 py-3 border-b border-slate-200"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {state.suppliers.map((supplier) => (
              <SupplierRow key={supplier.id} supplier={supplier} updateSupplier={updateSupplier} deleteSupplier={deleteSupplier} />
            ))}
            {state.suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-lg">
                  Belum ada data supplier
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
