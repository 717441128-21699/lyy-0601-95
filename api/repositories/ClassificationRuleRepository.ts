import { BaseRepository } from './BaseRepository';
import type { ClassificationRule, ClassificationRuleType } from '../../shared/types';
import db from '../db/index';

interface RuleRow {
  id: string;
  name: string;
  type: string;
  pattern: string;
  target_folder: string;
  is_active: number;
  enabled: number;
  priority: number;
  conditions: string;
  created_at: string;
  updated_at: string;
}

export class ClassificationRuleRepository extends BaseRepository<ClassificationRule> {
  constructor() {
    super('classification_rules');
  }

  private mapRowToRule(row: RuleRow): ClassificationRule {
    return {
      id: row.id,
      name: row.name,
      type: (row.type || 'keyword') as ClassificationRuleType,
      pattern: row.pattern || '',
      targetFolder: row.target_folder,
      isActive: row.is_active === 1,
      priority: row.priority,
      conditions: row.conditions ? JSON.parse(row.conditions) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  override findAll(): ClassificationRule[] {
    const rows = this.queryMany('SELECT * FROM classification_rules ORDER BY priority DESC') as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  override findById(id: string): ClassificationRule | undefined {
    const row = this.queryOne('SELECT * FROM classification_rules WHERE id = ?', [id]) as RuleRow | undefined;
    return row ? this.mapRowToRule(row) : undefined;
  }

  findAllEnabled(): ClassificationRule[] {
    const rows = this.queryMany(
      'SELECT * FROM classification_rules WHERE enabled = 1 AND is_active = 1 ORDER BY priority DESC'
    ) as RuleRow[];
    return rows.map(this.mapRowToRule);
  }

  create(rule: Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>): ClassificationRule {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    this.executeQuery(
      `INSERT INTO classification_rules (id, name, type, pattern, target_folder, is_active, priority, conditions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        rule.name,
        rule.type || 'keyword',
        rule.pattern || '',
        rule.targetFolder,
        rule.isActive !== undefined ? (rule.isActive ? 1 : 0) : 1,
        rule.priority ?? 1,
        JSON.stringify(rule.conditions ?? []),
        now,
        now
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, rule: Partial<Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>>): ClassificationRule | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (rule.name !== undefined) { fields.push('name = ?'); values.push(rule.name); }
    if (rule.type !== undefined) { fields.push('type = ?'); values.push(rule.type); }
    if (rule.pattern !== undefined) { fields.push('pattern = ?'); values.push(rule.pattern); }
    if (rule.targetFolder !== undefined) { fields.push('target_folder = ?'); values.push(rule.targetFolder); }
    if (rule.isActive !== undefined) { fields.push('is_active = ?'); values.push(rule.isActive ? 1 : 0); }
    if (rule.priority !== undefined) { fields.push('priority = ?'); values.push(rule.priority); }
    if (rule.conditions !== undefined) { fields.push('conditions = ?'); values.push(JSON.stringify(rule.conditions)); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.executeQuery(
      `UPDATE classification_rules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }
}
