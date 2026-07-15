import Dexie, { type Table } from 'dexie';

export interface SyncQueueItem {
  id?: number;
  action: string;
  payload: any;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export class EvalunaERPDatabase extends Dexie {
  products!: Table<any, string>;
  customers!: Table<any, string>;
  inventory!: Table<any, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super('Evaluna ERPLocal');
    this.version(1).stores({
      products: 'id',
      customers: 'id',
      inventory: 'id',
      sync_queue: '++id, action, status'
    });
  }
}

export const db = new EvalunaERPDatabase();
