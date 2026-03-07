import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Movement } from '@/app/types/database';

interface OfflineDB extends DBSchema {
    movements_queue: {
        key: number;
        value: Omit<Movement, 'id' | 'created_at'> & { timestamp: number };
    };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<OfflineDB>('gourmet-glatt-pwa', 1, {
            upgrade(db) {
                db.createObjectStore('movements_queue', { keyPath: 'timestamp' });
            },
        });
    }
    return dbPromise;
};

export const queueMovement = async (movement: Omit<Movement, 'id' | 'created_at'>) => {
    const db = await getDB();
    const timestamp = Date.now();
    await db.put('movements_queue', { ...movement, timestamp });
    return timestamp;
};

export const getQueuedMovements = async () => {
    const db = await getDB();
    return db.getAll('movements_queue');
};

export const dequeueMovement = async (timestamp: number) => {
    const db = await getDB();
    await db.delete('movements_queue', timestamp);
};
