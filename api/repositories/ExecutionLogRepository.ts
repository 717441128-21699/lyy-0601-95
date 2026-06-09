import { BaseRepository } from './BaseRepository';
import type { ExecutionLog, LogStatus, LogLevel } from '../../shared/types';

interface LogRow {
  id: string;
  action: string;
  level: string;
  message: string;
  timestamp: string;
  files_affected: number;
  status: string;
  details: string;
  snapshot_id: string | null;
}

export class ExecutionLogRepository extends BaseRepository<ExecutionLog> {
  constructor() {
    super('execution_logs');
  }

  private mapRowToLog(row: LogRow): ExecutionLog {
    return {
      id: row.id,
      action: row.action,
      level: (row.level || 'info') as LogLevel,
      message: row.message || row.details,
      timestamp: row.timestamp,
      filesAffected: row.files_affected,
      status: row.status as LogStatus,
      details: row.details,
      snapshotId: row.snapshot_id || undefined,
    };
  }

  override findAll(): ExecutionLog[] {
    const rows = this.queryMany('SELECT * FROM execution_logs ORDER BY timestamp DESC') as LogRow[];
    return rows.map(this.mapRowToLog);
  }

  override findById(id: string): ExecutionLog | undefined {
    const row = this.queryOne('SELECT * FROM execution_logs WHERE id = ?', [id]) as LogRow | undefined;
    return row ? this.mapRowToLog(row) : undefined;
  }

  findRecent(limit: number = 10): ExecutionLog[] {
    const rows = this.queryMany(
      'SELECT * FROM execution_logs ORDER BY timestamp DESC LIMIT ?',
      [limit]
    ) as LogRow[];
    return rows.map(this.mapRowToLog);
  }

  create(log: Omit<ExecutionLog, 'id' | 'timestamp'>): ExecutionLog {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO execution_logs (id, action, level, message, timestamp, files_affected, status, details, snapshot_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.action,
        log.level || 'info',
        log.message || log.details,
        now,
        log.filesAffected,
        log.status,
        log.details,
        log.snapshotId || null,
      ]
    );

    return this.findById(id)!;
  }

  countToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = this.queryOne(
      'SELECT COALESCE(SUM(files_affected), 0) as count FROM execution_logs WHERE timestamp >= ?',
      [today.toISOString()]
    ) as { count: number };
    return result.count;
  }
}
