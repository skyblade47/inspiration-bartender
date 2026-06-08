import { SyncInspiration, DeviceType } from './types';

export function generateChecksum(content: string, tags: string[]): string {
  const data = content + tags.join(',');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function verifyChecksum(inspiration: SyncInspiration): boolean {
  return inspiration.checksum === generateChecksum(inspiration.content, inspiration.tags);
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function toSyncInspiration(
  data: {
    id: string;
    name?: string;
    content: string;
    tags: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
    status?: string;
    glassType?: string;
    completion?: number;
    rawInput?: any;
  },
  source: DeviceType
): SyncInspiration {
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toISOString();
  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt.toISOString();

  return {
    id: data.id,
    title: data.name,
    content: data.content,
    tags: data.tags,
    source,
    sourceApp: 'inspiration-bartender',
    createdAt,
    updatedAt,
    syncStatus: data.status === 'synced' ? 'synced' : 'pending',
    syncHistory: [],
    checksum: generateChecksum(data.content, data.tags),
    original: {
      glassType: data.glassType,
      completion: data.completion,
      rawInput: data.rawInput,
    },
  };
}

export function fromSyncInspiration(syncInsp: SyncInspiration): {
  id: string;
  name: string;
  content: string;
  tags: string[];
  glassType?: string;
  completion?: number;
  rawInput?: any;
} {
  return {
    id: syncInsp.id,
    name: syncInsp.title || syncInsp.content.substring(0, 30),
    content: syncInsp.content,
    tags: syncInsp.tags,
    glassType: syncInsp.original?.glassType,
    completion: syncInsp.original?.completion,
    rawInput: syncInsp.original?.rawInput,
  };
}
