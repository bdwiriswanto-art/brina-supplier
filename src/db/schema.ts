import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  capacity: integer('capacity').notNull(),
  pricePerKg: integer('price_per_kg').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').notNull(),
  date: text('date').notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appState = pgTable('app_state', {
  id: serial('id').primaryKey(),
  currentStock: integer('current_stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(20),
  dailyRequirement: integer('daily_requirement').notNull().default(50),
  appsScriptUrl: text('apps_script_url').default(''),
  isAutoOrderEnabled: boolean('is_auto_order_enabled').default(false),
  fonnteToken: text('fonnte_token').default(''),
  lastSupplierIndex: integer('last_supplier_index').notNull().default(-1),
  updatedAt: timestamp('updated_at').defaultNow(),
});
