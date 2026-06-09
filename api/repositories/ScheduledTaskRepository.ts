import { BaseRepository } from './BaseRepository';
import type { ScheduledTask, ScheduledTaskType } from '../../shared/types';

interface TaskRow {
  id: string;
  name: string;
  type: string;
  cron_expression: string;
  target_path: string;
  is_enabled: number;
  last_run_at: string | null;
  action: string;
  source_path: string;
  enabled: number;
  last_run: string | null;
  next_run: string | null;
  status: string | null;
  last_error: string | null;
  created_at: string;
}

export class ScheduledTaskRepository extends BaseRepository<ScheduledTask> {
  constructor() {
    super('scheduled_tasks');
  }

  private mapRowToTask(row: TaskRow): ScheduledTask {
    return {
      id: row.id,
      name: row.name,
      type: (row.type || 'scan_and_classify') as ScheduledTaskType,
      cronExpression: row.cron_expression,
      targetPath: row.target_path || row.source_path,
      isEnabled: row.is_enabled === 1,
      lastRunAt: row.last_run_at || row.last_run || undefined,
      action: (row.action || row.type || 'scan_and_classify') as ScheduledTask['action'],
      sourcePath: row.source_path,
      enabled: row.enabled === 1,
      lastRun: row.last_run || undefined,
      nextRun: row.next_run || undefined,
      status: (row.status as ScheduledTask['status']) || undefined,
      lastError: row.last_error || undefined,
      createdAt: row.created_at,
    };
  }

  override findAll(): ScheduledTask[] {
    const rows = this.queryMany('SELECT * FROM scheduled_tasks ORDER BY created_at DESC') as TaskRow[];
    return rows.map(this.mapRowToTask);
  }

  override findById(id: string): ScheduledTask | undefined {
    const row = this.queryOne('SELECT * FROM scheduled_tasks WHERE id = ?', [id]) as TaskRow | undefined;
    return row ? this.mapRowToTask(row) : undefined;
  }

  findAllEnabled(): ScheduledTask[] {
    const rows = this.queryMany(
      'SELECT * FROM scheduled_tasks WHERE enabled = 1 AND is_enabled = 1'
    ) as TaskRow[];
    return rows.map(this.mapRowToTask);
  }

  create(task: Omit<ScheduledTask, 'id' | 'createdAt'>): ScheduledTask {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const isEnabledVal = task.isEnabled !== undefined ? (task.isEnabled ? 1 : 0) : (task.enabled !== undefined ? (task.enabled ? 1 : 0) : 1);
    const enabledVal = task.enabled !== undefined ? (task.enabled ? 1 : 0) : isEnabledVal;
    
    this.executeQuery(
      `INSERT INTO scheduled_tasks (id, name, type, cron_expression, target_path, is_enabled, last_run_at, action, source_path, enabled, last_run, next_run, status, last_error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        task.name,
        task.type || 'scan_and_classify',
        task.cronExpression,
        task.targetPath || task.sourcePath,
        isEnabledVal,
        task.lastRunAt || null,
        task.action || task.type || 'scan_and_classify',
        task.sourcePath,
        enabledVal,
        task.lastRun || null,
        task.nextRun || null,
        task.status || null,
        task.lastError || null,
        now,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, updates: Partial<Omit<ScheduledTask, 'id' | 'createdAt'>>): ScheduledTask | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.cronExpression !== undefined) { fields.push('cron_expression = ?'); values.push(updates.cronExpression); }
    if (updates.targetPath !== undefined) { fields.push('target_path = ?'); values.push(updates.targetPath); }
    if (updates.isEnabled !== undefined) { fields.push('is_enabled = ?'); values.push(updates.isEnabled ? 1 : 0); }
    if (updates.lastRunAt !== undefined) { fields.push('last_run_at = ?'); values.push(updates.lastRunAt || null); }
    if (updates.action !== undefined) { fields.push('action = ?'); values.push(updates.action); }
    if (updates.sourcePath !== undefined) { fields.push('source_path = ?'); values.push(updates.sourcePath); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }
    if (updates.lastRun !== undefined) { fields.push('last_run = ?'); values.push(updates.lastRun || null); }
    if (updates.nextRun !== undefined) { fields.push('next_run = ?'); values.push(updates.nextRun || null); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status || null); }
    if (updates.lastError !== undefined) { fields.push('last_error = ?'); values.push(updates.lastError || null); }
    
    values.push(id);

    this.executeQuery(
      `UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
