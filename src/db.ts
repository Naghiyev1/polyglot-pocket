import Dexie, { type Table } from 'dexie';

export interface DictionaryEntry {
  id?: number;
  word: string;
  definition: string;
  language: string;
  source: 'offline' | 'custom';
  tags?: string[];
  createdAt: number;
}

export interface LanguagePack {
  id: string;
  name: string;
  status: 'available' | 'downloading' | 'installed';
  lastUpdated?: number;
}

export class PolyglotDB extends Dexie {
  entries!: Table<DictionaryEntry>;
  packs!: Table<LanguagePack>;

  constructor() {
    super('PolyglotDB');
    this.version(1).stores({
      entries: '++id, word, language, source',
      packs: 'id, name, status'
    });
  }
}

export const db = new PolyglotDB();
