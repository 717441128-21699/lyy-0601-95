import { BaseRepository } from './BaseRepository';
import type { TodoItem, TodoStatus, TodoPriority } from '../../shared/types';

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: string;
  status: string;
  related_file_id: string | null;
  related_file_name: string | null;
  created_at: string;
  updated_at: string;
}

export class TodoRepository extends BaseRepository<TodoItem> {
  constructor() {
    super('todo_items');
  }

  private mapRowToTodo(row: TodoRow): TodoItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      deadline: row.deadline || undefined,
      priority: row.priority as TodoPriority,
      status: row.status as TodoStatus,
      relatedFileId: row.related_file_id || undefined,
      relatedFileName: row.related_file_name || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  override findAll(): TodoItem[] {
    const rows = this.queryMany('SELECT * FROM todo_items ORDER BY created_at DESC') as TodoRow[];
    return rows.map(this.mapRowToTodo);
  }

  override findById(id: string): TodoItem | undefined {
    const row = this.queryOne('SELECT * FROM todo_items WHERE id = ?', [id]) as TodoRow | undefined;
    return row ? this.mapRowToTodo(row) : undefined;
  }

  findByStatus(status: TodoStatus): TodoItem[] {
    const rows = this.queryMany(
      'SELECT * FROM todo_items WHERE status = ? ORDER BY deadline ASC, priority DESC',
      [status]
    ) as TodoRow[];
    return rows.map(this.mapRowToTodo);
  }

  findUpcoming(limit: number = 5): TodoItem[] {
    const rows = this.queryMany(
      `SELECT * FROM todo_items 
       WHERE status != 'completed' AND deadline IS NOT NULL
       ORDER BY deadline ASC LIMIT ?`,
      [limit]
    ) as TodoRow[];
    return rows.map(this.mapRowToTodo);
  }

  create(todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): TodoItem {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO todo_items (
        id, title, description, deadline, priority, status,
        related_file_id, related_file_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        todo.title,
        todo.description || null,
        todo.deadline || null,
        todo.priority,
        todo.status,
        todo.relatedFileId || null,
        todo.relatedFileName || null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  updateStatus(id: string, status: TodoStatus): TodoItem | undefined {
    const now = new Date().toISOString();
    this.executeQuery(
      'UPDATE todo_items SET status = ?, updated_at = ? WHERE id = ?',
      [status, now, id]
    );
    return this.findById(id);
  }

  update(id: string, updates: Partial<Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>): TodoItem | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description || null); }
    if (updates.deadline !== undefined) { fields.push('deadline = ?'); values.push(updates.deadline || null); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.executeQuery(
      `UPDATE todo_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  countPending(): number {
    const result = this.queryOne(
      "SELECT COUNT(*) as count FROM todo_items WHERE status = 'pending' OR status = 'in_progress'"
    ) as { count: number };
    return result.count;
  }
}
