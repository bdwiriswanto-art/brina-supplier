import { db } from './index.ts';
import { appState, suppliers, orders, users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  const result = await db.insert(users)
    .values({ uid, email })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email },
    })
    .returning();
  return result[0];
}

export async function getGlobalAppState() {
  const stateResult = await db.select().from(appState).limit(1);
  if (stateResult.length === 0) {
    const newState = await db.insert(appState).values({}).returning();
    return newState[0];
  }
  return stateResult[0];
}

export async function updateGlobalAppState(data: Partial<typeof appState.$inferInsert>) {
  const state = await getGlobalAppState();
  const updated = await db.update(appState)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(appState.id, state.id))
    .returning();
  return updated[0];
}

export async function getAllSuppliers() {
  return await db.select().from(suppliers);
}

export async function replaceAllSuppliers(newSuppliers: (typeof suppliers.$inferInsert)[]) {
  await db.delete(suppliers);
  if (newSuppliers.length > 0) {
    await db.insert(suppliers).values(newSuppliers);
  }
}

export async function getAllOrders() {
  return await db.select().from(orders);
}

export async function replaceAllOrders(newOrders: (typeof orders.$inferInsert)[]) {
  await db.delete(orders);
  if (newOrders.length > 0) {
    await db.insert(orders).values(newOrders);
  }
}
