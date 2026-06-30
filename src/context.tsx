import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Order, Supplier } from './types';

const initialState: AppState = {
  currentStock: 50,
  lowStockThreshold: 20,
  dailyRequirement: 100,
  suppliers: [
    {
      id: '1',
      name: 'Supplier Utama',
      phone: '6281395037157',
      capacity: 100,
      pricePerKg: 15000,
    },
    {
      id: '2',
      name: 'Ternak Telur Sejahtera',
      phone: '6289876543210',
      capacity: 50,
      pricePerKg: 15500,
    }
  ],
  orders: [],
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwqMq-US2fBizRGQI0MzhRGTWJC3IaqXkr__Z1dmoVKMsDAOIlyYFqbBUs7OLAdoow/exec',
  isAutoOrderEnabled: true,
};

type AppContextType = {
  state: AppState;
  updateStock: (amount: number) => void;
  setCurrentStock: (stock: number) => void;
  setLowStockThreshold: (threshold: number) => void;
  setDailyRequirement: (req: number) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updateOrder: (id: string, orderUpdate: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  setAppsScriptUrl: (id: string) => void;
  setFonnteToken: (token: string) => void;
  toggleAutoOrder: () => void;
  syncToSheets: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/stock');
        const data = await res.json();
        if (data && data.currentStock !== undefined) {
          setState(prev => ({
            ...prev,
            currentStock: data.currentStock ?? prev.currentStock,
            lowStockThreshold: data.lowStockThreshold ?? prev.lowStockThreshold,
            dailyRequirement: data.dailyRequirement ?? prev.dailyRequirement,
            fonnteToken: data.fonnteToken ?? prev.fonnteToken,
            suppliers: data.suppliers?.length ? data.suppliers : prev.suppliers,
            orders: data.orders || prev.orders,
          }));
        } else {
          const saved = localStorage.getItem('eggWhiteAppState');
          if (saved) {
            try { setState({ ...initialState, ...JSON.parse(saved) }); } catch(e) {}
          }
        }
      } catch (err) {
        console.error("Gagal load dari backend", err);
        const saved = localStorage.getItem('eggWhiteAppState');
        if (saved) {
          try { setState({ ...initialState, ...JSON.parse(saved) }); } catch(e) {}
        }
      } finally {
        setIsLoaded(true);
      }
    };
    fetchState();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem('eggWhiteAppState', JSON.stringify(state));
    
    // Sync ke backend server agar Cron Job (bot WA) tahu stok terbaru
    const syncBackend = async () => {
      fetch('/api/stock', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentStock: state.currentStock,
          lowStockThreshold: state.lowStockThreshold,
          dailyRequirement: state.dailyRequirement,
          fonnteToken: state.fonnteToken,
          suppliers: state.suppliers,
          orders: state.orders
        })
      }).catch(err => console.error("Gagal sync ke backend:", err));
    };

    syncBackend();

    // Sinkronisasi otomatis di background setiap ada perubahan stok atau order (Google Sheets)
    if (state.appsScriptUrl) {
      const payload = {
        type: 'sync',
        currentStock: state.currentStock,
        lowStockThreshold: state.lowStockThreshold,
        orders: state.orders,
        suppliers: state.suppliers
      };
      
      fetch(state.appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(err => console.error("Auto sync error:", err));
    }
  }, [state, isLoaded]);

  const setCurrentStock = (stock: number) => {
    setState(prev => ({ ...prev, currentStock: Math.max(0, stock) }));
  };

  const updateStock = (amount: number) => {
    setState(prev => ({ ...prev, currentStock: Math.max(0, prev.currentStock + amount) }));
  };

  const setLowStockThreshold = (threshold: number) => {
    setState(prev => ({ ...prev, lowStockThreshold: threshold }));
  };

  const setDailyRequirement = (req: number) => {
    setState(prev => ({ ...prev, dailyRequirement: req }));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, { ...supplier, id: Math.random().toString(36).substring(7) }]
    }));
  };

  const updateSupplier = (id: string, supplierUpdate: Partial<Supplier>) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...supplierUpdate } : s)
    }));
  };

  const deleteSupplier = (id: string) => {
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id)
    }));
  };

  const addOrder = (order: Omit<Order, 'id'>) => {
    setState(prev => ({
      ...prev,
      orders: [...prev.orders, { ...order, id: Math.random().toString(36).substring(7) }]
    }));
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setState(prev => {
      const newOrders = prev.orders.map(o => o.id === id ? { ...o, status } : o);
      // If status changed to received, increase stock
      let newStock = prev.currentStock;
      if (status === 'received') {
        const order = prev.orders.find(o => o.id === id);
        if (order && order.status !== 'received') {
          newStock += order.quantity;
        }
      }
      return { ...prev, orders: newOrders, currentStock: newStock };
    });
  };

  const updateOrder = (id: string, orderUpdate: Partial<Order>) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === id ? { ...o, ...orderUpdate } : o)
    }));
  };

  const deleteOrder = (id: string) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== id)
    }));
  };

  const setAppsScriptUrl = (url: string) => {
    setState(prev => ({ ...prev, appsScriptUrl: url }));
  };

  const setFonnteToken = (token: string) => {
    setState(prev => ({ ...prev, fonnteToken: token }));
  };

  const toggleAutoOrder = () => {
    setState(prev => ({ ...prev, isAutoOrderEnabled: !prev.isAutoOrderEnabled }));
  };

  const syncToSheets = async () => {
    if (!state.appsScriptUrl) throw new Error('URL Apps Script belum diatur');
    
    const payload = {
      type: 'sync',
      currentStock: state.currentStock,
      lowStockThreshold: state.lowStockThreshold,
      orders: state.orders,
      suppliers: state.suppliers
    };

    await fetch(state.appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  };

  return (
    <AppContext.Provider value={{
      state,
      updateStock,
      setCurrentStock,
      setLowStockThreshold,
      setDailyRequirement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addOrder,
      updateOrderStatus,
      updateOrder,
      deleteOrder,
      setAppsScriptUrl,
      setFonnteToken,
      toggleAutoOrder,
      syncToSheets
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
