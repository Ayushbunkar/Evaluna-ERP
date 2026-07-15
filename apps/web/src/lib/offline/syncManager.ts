import { db } from './db';

export async function queueMutation(action: string, payload: any) {
  await db.sync_queue.add({
    action,
    payload,
    status: 'pending',
    timestamp: Date.now()
  });
}

export async function processSyncQueue() {
  const pendingItems = await db.sync_queue.where('status').equals('pending').toArray();
  
  for (const item of pendingItems) {
    if (item.id === undefined) continue;

    try {
      // TODO: Call tRPC API here based on item.action and item.payload
      console.log('Processing sync item:', item);
      
      // Simulate API call
      // await someApiCall(item.action, item.payload);
      
      await db.sync_queue.update(item.id, { status: 'completed' });
    } catch (error) {
      console.error('Failed to sync item:', item.id, error);
      // Optionally mark as failed or leave as pending for retry
      await db.sync_queue.update(item.id, { status: 'failed' });
    }
  }
}

export async function cacheCatalog(products: any[]) {
  await db.products.bulkPut(products);
}
