import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import type { FileInfo, RenameRule, RenamePreview } from '../../shared/types';
import { RenameRuleRepository } from '../repositories/RenameRuleRepository';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';
import { SnapshotRepository } from '../repositories/SnapshotRepository';

export class RenameService {
  private renameRuleRepo: RenameRuleRepository;
  private fileRecordRepo: FileRecordRepository;
  private executionLogRepo: ExecutionLogRepository;
  private snapshotRepo: SnapshotRepository;

  constructor() {
    this.renameRuleRepo = new RenameRuleRepository();
    this.fileRecordRepo = new FileRecordRepository();
    this.executionLogRepo = new ExecutionLogRepository();
    this.snapshotRepo = new SnapshotRepository();
  }

  private applyTemplate(
    template: string,
    file: FileInfo,
    index: number
  ): string {
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    const date = dayjs(file.createdAt);

    let result = template
      .replace(/\{original\}/g, baseName)
      .replace(/\{index\}/g, String(index + 1).padStart(3, '0'))
      .replace(/\{date\}/g, date.format('YYYYMMDD'))
      .replace(/\{year\}/g, date.format('YYYY'))
      .replace(/\{month\}/g, date.format('MM'))
      .replace(/\{day\}/g, date.format('DD'))
      .replace(/\{type\}/g, file.type)
      .replace(/\{ext\}/g, ext.replace('.', ''));

    return result + ext;
  }

  async generatePreview(
    files: FileInfo[],
    template: string
  ): Promise<RenamePreview> {
    const usedNames = new Set<string>();
    const renameList: RenamePreview['files'] = [];

    files.forEach((file, index) => {
      const newName = this.applyTemplate(template, file, index);
      const newPath = path.join(path.dirname(file.path), newName);
      const conflict = usedNames.has(newName);
      usedNames.add(newName);

      renameList.push({
        id: file.id,
        oldName: file.name,
        newName,
        path: file.path,
        conflict,
      });
    });

    const conflictCount = renameList.filter((item) => item.conflict).length;

    return {
      files: renameList,
      items: renameList,
      conflictCount,
    };
  }

  async generatePreviewByRules(files: FileInfo[]): Promise<RenamePreview> {
    const rules = this.renameRuleRepo.findAllEnabled();
    const usedNames = new Map<string, number>();
    const renameList: RenamePreview['files'] = [];

    for (const file of files) {
      let matched = false;
      let newName = file.name;

      for (const rule of rules) {
        if (rule.enabled) {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(file.name)) {
            newName = this.applyTemplate(rule.template, file, 0);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        continue;
      }

      const count = usedNames.get(newName) || 0;
      usedNames.set(newName, count + 1);

      const finalName =
        count > 0
          ? `${path.basename(newName, path.extname(newName))}_${count}${path.extname(newName)}`
          : newName;

      renameList.push({
        id: file.id,
        oldName: file.name,
        newName: finalName,
        path: file.path,
        conflict: count > 0,
      });
    }

    const conflictCount = renameList.filter((item) => item.conflict).length;

    return {
      files: renameList,
      items: renameList,
      conflictCount,
    };
  }

  async executeRename(preview: RenamePreview): Promise<{
    success: boolean;
    renamed: number;
    failed: number;
    snapshotId?: string;
  }> {
    const changes: Array<{
      fileId: string;
      oldPath: string;
      newPath: string;
      oldName: string;
      newName: string;
    }> = [];

    let renamed = 0;
    let failed = 0;
    const errors: string[] = [];

    const snapshot = this.snapshotRepo.create({
      fileStates: [],
      changes: [],
    });

    for (const item of preview.files) {
      try {
        const newPath = path.join(path.dirname(item.path), item.newName);

        await fs.rename(item.path, newPath);

        changes.push({
          fileId: item.id,
          oldPath: item.path,
          newPath,
          oldName: item.oldName,
          newName: item.newName,
        });

        this.fileRecordRepo.update(item.id, {
          path: newPath,
          name: item.newName,
        });

        renamed++;
      } catch (error) {
        failed++;
        errors.push(`${item.oldName}: ${(error as Error).message}`);
      }
    }

    this.snapshotRepo.update(snapshot.id, {
      changes,
    } as any);

    this.executionLogRepo.create({
      action: '批量重命名',
      level: failed > 0 ? 'warning' : 'info',
      message: failed > 0 ? `批量重命名部分失败` : `批量重命名完成`,
      filesAffected: renamed,
      status: failed > 0 ? 'warning' : 'success',
      details:
        failed > 0
          ? `成功重命名 ${renamed} 个文件，失败 ${failed} 个: ${errors.join('; ')}`
          : `成功重命名 ${renamed} 个文件`,
      snapshotId: snapshot.id,
    });

    return {
      success: failed === 0,
      renamed,
      failed,
      snapshotId: snapshot.id,
    };
  }

  async getRules(): Promise<RenameRule[]> {
    return this.renameRuleRepo.findAll();
  }

  async addRule(
    rule: Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RenameRule> {
    return this.renameRuleRepo.create(rule);
  }

  async updateRule(
    id: string,
    rule: Partial<Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<RenameRule | undefined> {
    return this.renameRuleRepo.update(id, rule);
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.renameRuleRepo.delete(id);
  }
}
