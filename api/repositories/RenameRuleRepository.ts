import { BaseRepository } from './BaseRepository';
import type { RenameRule } from '../../shared/types';
import db from '../db/index';

interface RuleRow {
  id: string;
  name: string;
  pattern: string;
  template: string;
  is_active: number;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export class RenameRuleRepository extends BaseRepository<RenameRule> {
  constructor() {
    super('rename_rules');
  }

  private mapRowToRule(row: RuleRow): RenameRule {
    return {
      id: row.id,
      name: row.name,
      pattern: row.pattern,
      template: row.template,
      isActive: row.is_active === 1,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  override findAll(): RenameRule[] {
    const rows = this.queryMany('SELECT * FROM rename_rules ORDER BY created_at DESC') as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  override findById(id: string): RenameRule | undefined {
    const row = this.queryOne('SELECT * FROM rename_rules WHERE id = ?', [id]) as RuleRow | undefined;
    return row ? this.mapRowToRule(row) : undefined;
  }

  findAllEnabled(): RenameRule[] {
    const rows = this.queryMany(
      'SELECT * FROM rename_rules WHERE enabled = 1 AND is_active = 1'
    ) as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  create(rule: Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>): RenameRule {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO rename_rules (id, name, pattern, template, is_active, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        rule.name,
        rule.pattern,
        rule.template,
        rule.isActive ? 1 : 1,
        rule.enabled ? 1 : 0,
        now,
        now
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, rule: Partial<Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>>): RenameRule | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (rule.name !== undefined) { fields.push('name = ?'); values.push(rule.name); }
    if (rule.pattern !== undefined) { fields.push('pattern = ?'); values.push(rule.pattern); }
    if (rule.template !== undefined) { fields.push('template = ?'); values.push(rule.template); }
    if (rule.isActive !== undefined) { fields.push('is_active = ?'); values.push(rule.isActive ? 1 : 0); }
    if (rule.enabled !== undefined) { fields.push('enabled = ?'); values.push(rule.enabled ? 1 : 0); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.executeQuery(
      `UPDATE rename_rules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
