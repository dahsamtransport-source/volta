/**
 * Offline mutation queue. Stores pending writes with idempotency keys.
 * Isolated from live writes: nothing here calls the network. A sync worker must be
 * added only once backend endpoints that honour idempotency keys exist and are tested.
 */
export type QueueStatus = "pending" | "conflict" | "failed";

export interface QueuedMutation {
  idempotencyKey: string;
  table: string;
  op: "insert" | "update";
  payload: Record<string, unknown>;
  createdAt: string;
  status: QueueStatus;
  error?: string;
}

export interface QueueStorage {
  all(): Promise<QueuedMutation[]>;
  put(m: QueuedMutation): Promise<void>;
  remove(key: string): Promise<void>;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export class MemoryQueueStorage implements QueueStorage {
  private map = new Map<string, QueuedMutation>();
  async all() {
    return [...this.map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async put(m: QueuedMutation) {
    this.map.set(m.idempotencyKey, m);
  }
  async remove(k: string) {
    this.map.delete(k);
  }
}

const DB = "lahj-field-sales";
const STORE = "mutation_queue";

export class IndexedDbQueueStorage implements QueueStorage {
  private db(): Promise<IDBDatabase> {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "idempotencyKey" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  private async tx<T>(
    mode: IDBTransactionMode,
    fn: (s: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.db();
    return new Promise((res, rej) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  async all() {
    const rows = await this.tx<QueuedMutation[]>(
      "readonly",
      (s) => s.getAll() as IDBRequest<QueuedMutation[]>,
    );
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async put(m: QueuedMutation) {
    await this.tx("readwrite", (s) => s.put(m));
  }
  async remove(k: string) {
    await this.tx("readwrite", (s) => s.delete(k));
  }
}

export class OfflineQueue {
  constructor(private storage: QueueStorage) {}

  /** Enqueue; duplicate idempotency keys are ignored (duplicate prevention). */
  async enqueue(m: Omit<QueuedMutation, "createdAt" | "status">): Promise<boolean> {
    const existing = await this.storage.all();
    if (existing.some((e) => e.idempotencyKey === m.idempotencyKey)) return false;
    await this.storage.put({ ...m, createdAt: new Date().toISOString(), status: "pending" });
    return true;
  }
  list() {
    return this.storage.all();
  }
  async markConflict(key: string, error: string) {
    const m = (await this.storage.all()).find((x) => x.idempotencyKey === key);
    if (m) await this.storage.put({ ...m, status: "conflict", error });
  }
  discard(key: string) {
    return this.storage.remove(key);
  }
}

let shared: OfflineQueue | null = null;
export function getQueue(): OfflineQueue {
  if (!shared)
    shared = new OfflineQueue(
      typeof indexedDB !== "undefined" ? new IndexedDbQueueStorage() : new MemoryQueueStorage(),
    );
  return shared;
}
