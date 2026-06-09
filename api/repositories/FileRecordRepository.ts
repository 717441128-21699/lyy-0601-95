import { BaseRepository } from './BaseRepository';
import type { FileInfo } from '../../shared/types';
import db from '../db/index';

interface FileRecordRow {
  id: string;
  original_path: string;
  current_path: string;
  file_name: string;
  extension: string;
  size: number;
  file_type: string;
  source: string | null;
  deadline: string | null;
  is_duplicate: number;
  duplicate_of: string | null;
  missing_attachments: string | null;
  created_at: string;
  modified_at: string;
  scanned_at: string;
}

export class FileRecordRepository extends BaseRepository<FileInfo> {
  constructor() {
    super('file_records');
  }

  private mapRowToFileInfo(row: FileRecordRow): FileInfo {
    return {
      id: row.id,
      name: row.file_name,
      path: row.current_path,
      originalPath: row.original_path,
      size: row.size,
      extension: row.extension,
      createdAt: row.created_at,
      modifiedAt: row.modified_at,
      type: row.file_type as FileInfo['type'] || 'other',
      source: row.source || undefined,
      deadline: row.deadline || undefined,
      isDuplicate: row.is_duplicate === 1,
      duplicateOf: row.duplicate_of || undefined,
      missingAttachments: row.missing_attachments ? JSON.parse(row.missing_attachments) : undefined,
    };
  }

  override findAll(): FileInfo[] {
    const rows = this.queryMany('SELECT * FROM file_records ORDER BY scanned_at DESC') as FileRecordRow[];
    return rows.map(this.mapRowToFileInfo);
  }

  override findById(id: string): FileInfo | undefined {
    const row = this.queryOne('SELECT * FROM file_records WHERE id = ?', [id]) as FileRecordRow | undefined;
    return row ? this.mapRowToFileInfo(row) : undefined;
  }

  findByPath(path: string): FileInfo | undefined {
    const row = this.queryOne('SELECT * FROM file_records WHERE current_path = ?', [path]) as FileRecordRow | undefined;
    return row ? this.mapRowToFileInfo(row) : undefined;
  }

  create(file: Omit<FileInfo, 'id'>): FileInfo {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO file_records (
        id, original_path, current_path, file_name, extension, size, file_type,
        source, deadline, is_duplicate, duplicate_of, missing_attachments,
        created_at, modified_at, scanned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        file.originalPath,
        file.path,
        file.name,
        file.extension,
        file.size,
        file.type,
        file.source || null,
        file.deadline || null,
        file.isDuplicate ? 1 : 0,
        file.duplicateOf || null,
        file.missingAttachments ? JSON.stringify(file.missingAttachments) : null,
        file.createdAt,
        file.modifiedAt,
        now,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, updates: Partial<FileInfo>): FileInfo | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.path !== undefined) { fields.push('current_path = ?'); values.push(updates.path); }
    if (updates.name !== undefined) { fields.push('file_name = ?'); values.push(updates.name); }
    if (updates.type !== undefined) { fields.push('file_type = ?'); values.push(updates.type); }
    if (updates.source !== undefined) { fields.push('source = ?'); values.push(updates.source || null); }
    if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline || null); }
    if (updates.isDuplicate !== undefined) { fields.push('is_duplicate = ?'); values.push(updates.isDuplicate ? 1 : 0); }
    
    values.push(id);

    this.executeQuery(
      `UPDATE file_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  findByScanDate(startDate: string, endDate: string): FileInfo[] {
    const rows = this.queryMany(
      'SELECT * FROM file_records WHERE scanned_at BETWEEN ? AND ? ORDER BY scanned_at DESC',
      [startDate, endDate]
    ) as FileRecordRow[];
    return rows.map(this.mapRowToFileInfo);
  }

  countByType(): Record<string, number> {
    const results = this.queryMany(
      'SELECT file_type, COUNT(*) as count FROM file_records GROUP BY file_type'
    ) as Array<{ file_type: string; count: number }>;
    
    const counts: Record<string, number> = { invoice: 0, contract: 0, notice: 0, other: 0 };
    results.forEach((r) => {
      if (r.file_type) {
        counts[r.file_type] = r.count;
      }
    });
    return counts;
  }

  countDuplicates(): number {
    const result = this.queryOne(
      'SELECT COUNT(*) as count FROM file_records WHERE is_duplicate = 1'
    ) as { count: number };
    return result.count;
  }
}
