import { BaseRepository } from './BaseRepository';
import type { Settings } from '../../shared/types';

interface SettingRow {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export class SettingsRepository extends BaseRepository<{ key: string; value: string }> {
  constructor() {
    super('settings');
  }

  getAll(): Partial<Settings> {
    const rows = this.queryMany('SELECT * FROM settings') as SettingRow[];
    const settings: Partial<Settings> = {};
    
    rows.forEach((row) => {
      if (row.value !== null) {
        try {
          (settings as any)[row.key] = JSON.parse(row.value);
        } catch {
          (settings as any)[row.key] = row.value;
        }
      }
    });
    
    return settings;
  }

  set(key: string, value: any): void {
    const now = new Date().toISOString();
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    this.executeQuery(
      'UPDATE settings SET value = ?, updated_at = ? WHERE key = ?',
      [strValue, now, key]
    );
    
    const changes = this.executeQuery(
      'SELECT changes() as count'
    );
    
    if (changes.count === 0) {
      const id = crypto.randomUUID();
      this.executeQuery(
        'INSERT INTO settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
        [id, key, strValue, now]
      );
    }
  }

  get(key: string): any {
    const row = this.queryOne('SELECT * FROM settings WHERE key = ?', [key]) as SettingRow | undefined;
    if (!row || row.value === null) return undefined;
    
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }
}
