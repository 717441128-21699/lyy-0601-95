import { BaseRepository } from './BaseRepository';
import type { OperationSnapshot, FileInfo, SnapshotStatus } from '../../shared/types';

interface SnapshotRow {
  id: string;
  action: string;
  status: string;
  description: string;
  created_at: string;
  file_count: number;
  timestamp: string;
  file_states: string;
  changes: string;
}

export class SnapshotRepository extends BaseRepository<OperationSnapshot> {
  constructor() {
    super('operation_snapshots');
  }

  private mapRowToSnapshot(row: SnapshotRow): OperationSnapshot {
    return {
      id: row.id,
      action: row.action || '文件操作',
      status: (row.status || 'applied') as SnapshotStatus,
      description: row.description || '',
      createdAt: row.created_at || row.timestamp,
      fileCount: row.file_count || 0,
      timestamp: row.timestamp,
      fileStates: JSON.parse(row.file_states),
      changes: JSON.parse(row.changes),
    };
  }

  override findAll(): OperationSnapshot[] {
    const rows = this.queryMany('SELECT * FROM operation_snapshots ORDER BY timestamp DESC') as SnapshotRow[];
    return rows.map(this.mapRowToSnapshot);
  }

  override findById(id: string): OperationSnapshot | undefined {
    const row = this.queryOne('SELECT * FROM operation_snapshots WHERE id = ?', [id]) as SnapshotRow | undefined;
    return row ? this.mapRowToSnapshot(row) : undefined;
  }

  findLatest(): OperationSnapshot | undefined {
    const row = this.queryOne(
      'SELECT * FROM operation_snapshots ORDER BY timestamp DESC LIMIT 1'
    ) as SnapshotRow | undefined;
    return row ? this.mapRowToSnapshot(row) : undefined;
  }

  create(data: {
    action?: string;
    description?: string;
    fileCount?: number;
    fileStates: FileInfo[];
    changes: Array<{ fileId: string; oldPath: string; newPath: string; oldName: string; newName: string }>;
  }): OperationSnapshot {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO operation_snapshots (id, action, status, description, created_at, file_count, timestamp, file_states, changes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.action || '文件操作',
        'applied',
        data.description || '',
        now,
        data.fileCount || data.changes.length,
        now,
        JSON.stringify(data.fileStates),
        JSON.stringify(data.changes)
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, updates: Partial<Omit<OperationSnapshot, 'id' | 'timestamp' | 'createdAt'>>): OperationSnapshot | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.action !== undefined) { fields.push('action = ?'); values.push(updates.action); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.fileCount !== undefined) { fields.push('file_count = ?'); values.push(updates.fileCount); }
    if (updates.fileStates !== undefined) { fields.push('file_states = ?'); values.push(JSON.stringify(updates.fileStates)); }
    if (updates.changes !== undefined) { fields.push('changes = ?'); values.push(JSON.stringify(updates.changes)); }
    
    values.push(id);

    this.executeQuery(
      `UPDATE operation_snapshots SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
