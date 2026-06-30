export type Supplier = {
  id: string;
  name: string;
  phone: string;
  capacity: number;
  pricePerKg: number;
};

export type Order = {
  id: string;
  supplierId: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  status: 'pending' | 'ordered' | 'received';
};

export type AppState = {
  currentStock: number;
  lowStockThreshold: number;
  dailyRequirement: number;
  suppliers: Supplier[];
  orders: Order[];
  appsScriptUrl: string;
  isAutoOrderEnabled: boolean;
  fonnteToken?: string;
};
