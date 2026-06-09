import db from '../db/index';

export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  findAll(): T[] {
    return db.prepare(`SELECT * FROM ${this.tableName}`).all() as T[];
  }

  findById(id: string): T | undefined {
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as T | undefined;
  }

  delete(id: string): boolean {
    const result = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  protected executeQuery(sql: string, params: any[] = []): any {
    return db.prepare(sql).run(...params);
  }

  protected queryOne(sql: string, params: any[] = []): any {
    return db.prepare(sql).get(...params);
  }

  protected queryMany(sql: string, params: any[] = []): any[] {
    return db.prepare(sql).all(...params);
  }
}
