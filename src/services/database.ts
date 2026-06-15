import * as SQLite from 'expo-sqlite';
import { Inspiration, GlassType, InspirationStatus } from '../types';
import { fromSyncInspiration, SyncTask, SyncStatus } from './sync';

const db = SQLite.openDatabaseSync('inspiration.db');

export async function initSyncTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_tasks (
      id TEXT PRIMARY KEY,
      inspiration_id TEXT NOT NULL,
      target_device_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 5,
      next_retry_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspiration_id TEXT NOT NULL,
      source_device TEXT,
      target_device TEXT,
      status TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      duration_ms INTEGER
    );
  `);
}

export async function createSyncTask(task: Omit<SyncTask, 'createdAt' | 'updatedAt'>): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_tasks (id, inspiration_id, target_device_id, status, retry_count, max_retries, next_retry_time, created_at, updated_at, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      task.id,
      task.inspirationId,
      task.targetDeviceId,
      task.status,
      task.retryCount,
      task.maxRetries,
      task.nextRetryTime,
      new Date().toISOString(),
      new Date().toISOString(),
      task.error,
    ]
  );
}

export async function getSyncTask(taskId: string): Promise<SyncTask | null> {
  const row = await db.getFirstAsync('SELECT * FROM sync_tasks WHERE id = ?', taskId);
  if (!row) return null;
  
  const r = row as any;
  return {
    id: r.id,
    inspirationId: r.inspiration_id,
    targetDeviceId: r.target_device_id,
    status: r.status as SyncTask['status'],
    retryCount: r.retry_count,
    maxRetries: r.max_retries,
    nextRetryTime: r.next_retry_time,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    error: r.error,
  };
}

export async function getSyncTasksByStatus(status?: string): Promise<SyncTask[]> {
  let query = 'SELECT * FROM sync_tasks';
  let params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const rows = await db.getAllAsync(query, params);
  return rows.map((row: any) => ({
    id: row.id,
    inspirationId: row.inspiration_id,
    targetDeviceId: row.target_device_id,
    status: row.status as SyncTask['status'],
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    nextRetryTime: row.next_retry_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    error: row.error,
  }));
}

export async function updateSyncTask(taskId: string, updates: Partial<SyncTask>): Promise<void> {
  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.status !== undefined) {
    setParts.push('status = ?');
    params.push(updates.status);
  }
  if (updates.retryCount !== undefined) {
    setParts.push('retry_count = ?');
    params.push(updates.retryCount);
  }
  if (updates.nextRetryTime !== undefined) {
    setParts.push('next_retry_time = ?');
    params.push(updates.nextRetryTime);
  }
  if (updates.error !== undefined) {
    setParts.push('error = ?');
    params.push(updates.error);
  }

  if (setParts.length === 0) return;

  params.push(new Date().toISOString());
  params.push(taskId);

  await db.runAsync(
    `UPDATE sync_tasks SET ${setParts.join(', ')}, updated_at = ? WHERE id = ?`,
    params
  );
}

export async function deleteSyncTask(taskId: string): Promise<void> {
  await db.runAsync('DELETE FROM sync_tasks WHERE id = ?', taskId);
}

export async function clearCompletedSyncTasks(): Promise<void> {
  await db.runAsync('DELETE FROM sync_tasks WHERE status = ?', ['completed']);
}

export async function addSyncHistory(
  inspirationId: string,
  sourceDevice: string,
  targetDevice: string,
  status: string,
  durationMs: number
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_history (inspiration_id, source_device, target_device, status, timestamp, duration_ms) VALUES (?, ?, ?, ?, ?, ?)',
    [
      inspirationId,
      sourceDevice,
      targetDevice,
      status,
      new Date().toISOString(),
      durationMs,
    ]
  );
}

export async function getSyncHistory(limit: number = 50): Promise<{
  id: number;
  inspirationId: string;
  sourceDevice: string;
  targetDevice: string;
  status: string;
  timestamp: string;
  durationMs: number;
}[]> {
  const rows = await db.getAllAsync(
    'SELECT * FROM sync_history ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return rows.map((row: any) => ({
    id: row.id,
    inspirationId: row.inspiration_id,
    sourceDevice: row.source_device,
    targetDevice: row.target_device,
    status: row.status,
    timestamp: row.timestamp,
    durationMs: row.duration_ms,
  }));
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const pendingResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM sync_tasks WHERE status = ?',
    ['pending']
  );
  const syncingResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM sync_tasks WHERE status = ?',
    ['syncing']
  );
  const completedResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM sync_tasks WHERE status = ?',
    ['completed']
  );
  const failedResult = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM sync_tasks WHERE status = ?',
    ['failed']
  );

  const lastSyncResult = await db.getFirstAsync(
    'SELECT timestamp FROM sync_history WHERE status = ? ORDER BY timestamp DESC LIMIT 1',
    ['completed']
  );

  return {
    lastSyncTime: lastSyncResult ? (lastSyncResult as any).timestamp : null,
    pendingTasks: (pendingResult as any).count || 0,
    failedTasks: (failedResult as any).count || 0,
    syncingTasks: (syncingResult as any).count || 0,
    completedTasks: (completedResult as any).count || 0,
  };
}

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      completion INTEGER DEFAULT 0,
      status TEXT DEFAULT 'seed',
      rawInput TEXT NOT NULL,
      brewingLog TEXT DEFAULT '[]',
      brainstormCards TEXT DEFAULT '[]',
      collisionHistory TEXT DEFAULT '[]',
      structuredContent TEXT DEFAULT '{}',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

export async function createInspiration(data: Partial<Inspiration>): Promise<string> {
  const id = data.id || Date.now().toString();
  const now = Date.now();
  const inspiration: Inspiration = {
    id,
    name: data.name || '新灵感',
    type: (data.type as GlassType) || GlassType.MASON,
    completion: data.completion || 0,
    status: (data.status as InspirationStatus) || InspirationStatus.SEED,
    rawInput: data.rawInput || { text: '' },
    brewingLog: data.brewingLog || [],
    brainstormCards: data.brainstormCards || [],
    collisionHistory: data.collisionHistory || [],
    structuredContent: data.structuredContent || {},
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO inspirations (id, name, type, completion, status, rawInput, brewingLog, brainstormCards, collisionHistory, structuredContent, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      inspiration.id,
      inspiration.name,
      inspiration.type,
      inspiration.completion,
      inspiration.status,
      JSON.stringify(inspiration.rawInput),
      JSON.stringify(inspiration.brewingLog),
      JSON.stringify(inspiration.brainstormCards),
      JSON.stringify(inspiration.collisionHistory),
      JSON.stringify(inspiration.structuredContent),
      inspiration.createdAt,
      inspiration.updatedAt,
    ]
  );
  return id;
}

export async function saveSyncInspiration(data: any): Promise<string> {
  const now = Date.now();
  const inspirationData = {
    id: data.id,
    name: data.name || '同步的灵感',
    type: (data.glassType as GlassType) || GlassType.MASON,
    completion: data.completion || 0,
    status: InspirationStatus.SEED,
    rawInput: data.rawInput || { text: data.content || '' },
    createdAt: now,
    updatedAt: now,
  };
  return await createInspiration(inspirationData);
}

export async function getAllInspirations(): Promise<Inspiration[]> {
  const rows = await db.getAllAsync('SELECT * FROM inspirations ORDER BY updatedAt DESC');
  return rows.map((row: any) => ({
    ...row,
    rawInput: JSON.parse(row.rawInput),
    brewingLog: JSON.parse(row.brewingLog),
    brainstormCards: JSON.parse(row.brainstormCards),
    collisionHistory: JSON.parse(row.collisionHistory),
    structuredContent: JSON.parse(row.structuredContent),
  })) as Inspiration[];
}

export async function getInspirationById(id: string): Promise<Inspiration | null> {
  const row = await db.getFirstAsync('SELECT * FROM inspirations WHERE id = ?', id);
  if (!row) return null;
  
  return {
    ...row,
    rawInput: JSON.parse((row as any).rawInput),
    brewingLog: JSON.parse((row as any).brewingLog),
    brainstormCards: JSON.parse((row as any).brainstormCards),
    collisionHistory: JSON.parse((row as any).collisionHistory),
    structuredContent: JSON.parse((row as any).structuredContent),
  } as Inspiration;
}

export async function updateInspiration(id: string, data: Partial<Inspiration>): Promise<void> {
  const updates: string[] = [];
  const values: any[] = [];
  const now = Date.now();

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.completion !== undefined) {
    updates.push('completion = ?');
    values.push(data.completion);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.rawInput !== undefined) {
    updates.push('rawInput = ?');
    values.push(JSON.stringify(data.rawInput));
  }
  if (data.brewingLog !== undefined) {
    updates.push('brewingLog = ?');
    values.push(JSON.stringify(data.brewingLog));
  }
  if (data.brainstormCards !== undefined) {
    updates.push('brainstormCards = ?');
    values.push(JSON.stringify(data.brainstormCards));
  }
  if (data.collisionHistory !== undefined) {
    updates.push('collisionHistory = ?');
    values.push(JSON.stringify(data.collisionHistory));
  }
  if (data.structuredContent !== undefined) {
    updates.push('structuredContent = ?');
    values.push(JSON.stringify(data.structuredContent));
  }

  if (updates.length === 0) return;

  updates.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(
    `UPDATE inspirations SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteInspiration(id: string): Promise<void> {
  await db.runAsync('DELETE FROM inspirations WHERE id = ?', id);
}
