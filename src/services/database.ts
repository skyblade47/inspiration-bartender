import * as SQLite from 'expo-sqlite';
import { Inspiration, GlassType, InspirationStatus } from '../types';

const db = SQLite.openDatabaseSync('inspiration.db');

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
  const id = Date.now().toString();
  const now = Date.now();
  const inspiration: Inspiration = {
    id,
    name: data.name || '新灵感',
    type: data.type || GlassType.MASON,
    completion: data.completion || 0,
    status: data.status || InspirationStatus.SEED,
    rawInput: data.rawInput || { text: '' },
    brewingLog: [],
    brainstormCards: [],
    collisionHistory: [],
    structuredContent: {},
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO inspirations (id, name, type, completion, status, rawInput, brewingLog, brainstormCards, collisionHistory, structuredContent, createdAt, updatedAt) 
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
