import { BaseRepository } from './BaseRepository';
import type { IgnoreRule } from '../../shared/types';
import db from '../db/index';

interface RuleRow {
  id: string;
  name: string;
  pattern: string;
  type: string;
  is_active: number;
  enabled: number;
  created_at: string;
}

export class IgnoreRuleRepository extends BaseRepository<IgnoreRule> {
  constructor() {
    super('ignore_rules');
  }

  private mapRowToRule(row: RuleRow): IgnoreRule {
    return {
      id: row.id,
      name: row.name || row.pattern,
      pattern: row.pattern,
      type: row.type as 'filename' | 'extension' | 'folder',
      isActive: row.is_active === 1,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
    };
  }

  override findAll(): IgnoreRule[] {
    const rows = this.queryMany('SELECT * FROM ignore_rules ORDER BY created_at DESC') as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  override findById(id: string): IgnoreRule | undefined {
    const row = this.queryOne('SELECT * FROM ignore_rules WHERE id = ?', [id]) as RuleRow | undefined;
    return row ? this.mapRowToRule(row) : undefined;
  }

  findAllEnabled(): IgnoreRule[] {
    const rows = this.queryMany(
      'SELECT * FROM ignore_rules WHERE enabled = 1 AND is_active = 1'
    ) as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  create(rule: Omit<IgnoreRule, 'id' | 'createdAt'>): IgnoreRule {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const isActiveVal = rule.isActive !== undefined ? (rule.isActive ? 1 : 0) : (rule.enabled !== undefined ? (rule.enabled ? 1 : 0) : 1);
    const enabledVal = rule.enabled !== undefined ? (rule.enabled ? 1 : 0) : isActiveVal;
    
    this.executeQuery(
      `INSERT INTO ignore_rules (id, name, pattern, type, is_active, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        rule.name || rule.pattern,
        rule.pattern,
        rule.type,
        isActiveVal,
        enabledVal,
        now
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, rule: Partial<Omit<IgnoreRule, 'id' | 'createdAt'>>): IgnoreRule | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (rule.name !== undefined) { fields.push('name = ?'); values.push(rule.name); }
    if (rule.pattern !== undefined) { fields.push('pattern = ?'); values.push(rule.pattern); }
    if (rule.type !== undefined) { fields.push('type = ?'); values.push(rule.type); }
    
    if (rule.isActive !== undefined) {
      const activeVal = rule.isActive ? 1 : 0;
      fields.push('is_active = ?'); values.push(activeVal);
      fields.push('enabled = ?'); values.push(activeVal);
    } else if (rule.enabled !== undefined) {
      const activeVal = rule.enabled ? 1 : 0;
      fields.push('enabled = ?'); values.push(activeVal);
      fields.push('is_active = ?'); values.push(activeVal);
    }
    
    values.push(id);

    this.executeQuery(
      `UPDATE ignore_rules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
